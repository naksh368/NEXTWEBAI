import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateOtp, hashOtp } from "@/lib/otp";
import { sendEmail, emailLayout, isEmailConfigured } from "@/lib/services/email";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().email().max(160) });
const TTL_MIN = 15;

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 422 });
  }
  const email = parsed.data.email.trim().toLowerCase();

  // Always respond the same way — never reveal whether an account exists.
  const done = () => NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });

  try {
    const customer = await db.customer.findFirst({ where: { email }, select: { id: true, status: true } });
    if (!customer || customer.status !== "ACTIVE" || !isEmailConfigured()) return done();

    const code = generateOtp();
    await db.passwordReset.deleteMany({ where: { customerId: customer.id, consumedAt: null } });
    await db.passwordReset.create({
      data: { customerId: customer.id, email, codeHash: hashOtp(code), expiresAt: new Date(Date.now() + TTL_MIN * 60_000) },
    });
    await sendEmail({
      to: email,
      subject: `${code} is your ExpertzTrip password reset code`,
      html: emailLayout(
        "Reset your password",
        `<p>Use this code to reset your ExpertzTrip password:</p>
         <div style="margin:16px 0;text-align:center">
           <span style="display:inline-block;background:#EEF1FE;border:1px solid #2340D9;border-radius:12px;padding:12px 22px;font-size:30px;font-weight:800;letter-spacing:8px;color:#2340D9">${code}</span>
         </div>
         <p>This code expires in ${TTL_MIN} minutes. If you didn't request a reset, you can safely ignore this email — your password won't change.</p>`,
      ),
    });
  } catch (e) {
    console.error("[forgot-password] failed (non-blocking):", (e as Error).message);
  }
  return done();
}
