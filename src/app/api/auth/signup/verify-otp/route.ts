import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyOtp } from "@/lib/otp";
import { setCustomerCookie } from "@/lib/customer-session";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email().max(160),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 422 });
  }
  const email = parsed.data.email.toLowerCase();

  const otp = await db.emailOtp.findFirst({ where: { email, consumedAt: null }, orderBy: { createdAt: "desc" } });
  if (!otp) return NextResponse.json({ ok: false, error: "No pending verification. Please start again." }, { status: 404 });
  if (otp.expiresAt < new Date()) return NextResponse.json({ ok: false, error: "This code has expired. Please request a new one." }, { status: 410 });
  if (otp.attempts >= MAX_ATTEMPTS) return NextResponse.json({ ok: false, error: "Too many attempts. Please request a new code." }, { status: 429 });

  if (!verifyOtp(parsed.data.code, otp.codeHash)) {
    await db.emailOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return NextResponse.json({ ok: false, error: "Incorrect code. Please try again." }, { status: 401 });
  }

  // Guard against a race where the email got registered meanwhile.
  const existing = await db.customer.findFirst({ where: { email }, select: { id: true } });
  if (existing) {
    await db.emailOtp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
    return NextResponse.json({ ok: false, error: "An account with this email already exists. Please sign in." }, { status: 409 });
  }

  const customer = await db.customer.create({
    data: { email, fullName: otp.fullName, passwordHash: otp.passwordHash, isVerified: true },
    select: { id: true },
  });
  await db.emailOtp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
  await setCustomerCookie(customer.id);

  return NextResponse.json({ ok: true, redirect: "/account" }, { headers: { "Cache-Control": "no-store" } });
}
