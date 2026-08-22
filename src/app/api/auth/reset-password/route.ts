import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyOtp } from "@/lib/otp";
import { hashPassword } from "@/lib/password";
import { setCustomerCookie } from "@/lib/customer-session";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email().max(160),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
  password: z.string().min(8, "Use at least 8 characters.").max(200),
});

const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 422 });
  }
  const email = parsed.data.email.trim().toLowerCase();

  const reset = await db.passwordReset.findFirst({ where: { email, consumedAt: null }, orderBy: { createdAt: "desc" } });
  if (!reset) return NextResponse.json({ ok: false, error: "No reset in progress. Please start again." }, { status: 404 });
  if (reset.expiresAt < new Date()) return NextResponse.json({ ok: false, error: "This code has expired. Please request a new one." }, { status: 410 });
  if (reset.attempts >= MAX_ATTEMPTS) return NextResponse.json({ ok: false, error: "Too many attempts. Please request a new code." }, { status: 429 });

  if (!verifyOtp(parsed.data.code, reset.codeHash)) {
    await db.passwordReset.update({ where: { id: reset.id }, data: { attempts: { increment: 1 } } });
    return NextResponse.json({ ok: false, error: "Incorrect code. Please try again." }, { status: 401 });
  }

  await db.$transaction([
    db.customer.update({ where: { id: reset.customerId }, data: { passwordHash: hashPassword(parsed.data.password) } }),
    db.passwordReset.update({ where: { id: reset.id }, data: { consumedAt: new Date() } }),
  ]);

  // Sign the customer straight in after a successful reset.
  await setCustomerCookie(reset.customerId);
  return NextResponse.json({ ok: true, redirect: "/account" }, { headers: { "Cache-Control": "no-store" } });
}
