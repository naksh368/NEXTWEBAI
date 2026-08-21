import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { generateOtp, hashOtp } from "@/lib/otp";
import { sendEmail, emailLayout } from "@/lib/services/email";

export const runtime = "nodejs";

const schema = z.object({
  fullName: z.string().min(1, "Enter your full name.").max(120),
  email: z.string().email("Enter a valid email address.").max(160),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const OTP_TTL_MIN = 10;

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 422 });
  }
  const email = parsed.data.email.toLowerCase();

  // Already registered?
  const existing = await db.customer.findFirst({ where: { email }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ ok: false, error: "An account with this email already exists. Please sign in." }, { status: 409 });
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60_000);

  // Replace any prior pending signup for this email.
  await db.emailOtp.deleteMany({ where: { email } });
  await db.emailOtp.create({
    data: { email, codeHash: hashOtp(code), fullName: parsed.data.fullName, passwordHash: hashPassword(parsed.data.password), expiresAt },
  });

  const sent = await sendEmail({
    to: email,
    subject: `${code} is your ExpertzTrip verification code`,
    html: emailLayout(
      "Verify your email",
      `<p>Welcome to ExpertzTrip! Use this code to finish creating your account:</p>
       <p style="font-size:30px;font-weight:800;letter-spacing:8px;color:#2340D9;margin:14px 0">${code}</p>
       <p>This code expires in ${OTP_TTL_MIN} minutes. If you didn't request it, you can ignore this email.</p>`,
    ),
  });

  // In dev (console provider) the code is printed to the server log.
  return NextResponse.json(
    { ok: true, ...(process.env.NODE_ENV !== "production" && !sent.ok ? { devHint: "Email not configured — check server console." } : {}) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
