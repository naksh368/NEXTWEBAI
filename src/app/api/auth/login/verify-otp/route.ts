import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyOtp } from "@/lib/otp";
import { setCustomerCookie } from "@/lib/customer-session";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email().max(160),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
  redirect: z.string().max(512).optional(),
});

const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 422 });
  }
  const email = parsed.data.email.toLowerCase();

  const otp = await db.loginOtp.findFirst({ where: { email, consumedAt: null }, orderBy: { createdAt: "desc" } });
  if (!otp) return NextResponse.json({ ok: false, error: "No pending login. Please start again." }, { status: 404 });
  if (otp.expiresAt < new Date()) return NextResponse.json({ ok: false, error: "This code has expired. Please sign in again." }, { status: 410 });
  if (otp.attempts >= MAX_ATTEMPTS) return NextResponse.json({ ok: false, error: "Too many attempts. Please sign in again." }, { status: 429 });

  if (!verifyOtp(parsed.data.code, otp.codeHash)) {
    await db.loginOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return NextResponse.json({ ok: false, error: "Incorrect code. Please try again." }, { status: 401 });
  }

  await db.loginOtp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
  await setCustomerCookie(otp.customerId);

  const raw = parsed.data.redirect;
  const redirect = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/account";
  return NextResponse.json({ ok: true, redirect }, { headers: { "Cache-Control": "no-store" } });
}
