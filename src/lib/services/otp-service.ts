import { createHmac, timingSafeEqual, randomInt } from "node:crypto";
import { db } from "@/lib/db";

/**
 * OTP service (Phase 13). Codes are stored HASHED, single-use, time-limited,
 * attempt-limited and resend-throttled. The plaintext code is never persisted
 * or returned to the client — only delivered via the SMS provider.
 */
const SECRET = process.env.AUTH_SECRET || "insecure-dev-secret-change-me";
const TTL = Number(process.env.OTP_TTL_SECONDS || 300);
const MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const RESEND_COOLDOWN = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 30);

function hashCode(code: string, mobile: string): string {
  return createHmac("sha256", SECRET).update(`${mobile}:${code}`).digest("hex");
}

/** Basic E.164-ish validation; the real world would use libphonenumber. */
export function normalizeMobile(input: string): string | null {
  const trimmed = input.replace(/[\s-]/g, "");
  if (/^\+?[1-9]\d{7,14}$/.test(trimmed)) {
    return trimmed.startsWith("+") ? trimmed : `+91${trimmed.replace(/^0+/, "")}`;
  }
  return null;
}

async function sendSms(mobile: string, code: string) {
  const provider = process.env.SMS_PROVIDER || "console";
  if (provider === "console") {
    // Dev only — never do this in production.
    console.log(`\n📱 [SMS:console] OTP for ${mobile}: ${code} (valid ${TTL}s)\n`);
    return;
  }
  // TODO(prod): integrate a real transactional SMS provider (msg91 / twilio).
  throw new Error(`SMS provider "${provider}" is not configured.`);
}

export type RequestOtpResult =
  | { ok: true; resendInSeconds: number }
  | { ok: false; error: string; retryInSeconds?: number };

export async function requestOtp(rawMobile: string, purpose: "LOGIN" | "REGISTER" = "LOGIN"): Promise<RequestOtpResult> {
  const mobile = normalizeMobile(rawMobile);
  if (!mobile) return { ok: false, error: "Enter a valid mobile number." };

  // Throttle resends: look at the most recent active session for this mobile.
  const recent = await db.otpSession.findFirst({
    where: { mobile, purpose, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    const since = (Date.now() - recent.createdAt.getTime()) / 1000;
    if (since < RESEND_COOLDOWN) {
      return { ok: false, error: "Please wait before requesting another code.", retryInSeconds: Math.ceil(RESEND_COOLDOWN - since) };
    }
    if (recent.resendCount >= 5) {
      return { ok: false, error: "Too many attempts. Try again later." };
    }
  }

  const code = String(randomInt(100000, 1000000)); // 6 digits
  await db.otpSession.create({
    data: {
      mobile, purpose, codeHash: hashCode(code, mobile),
      maxAttempts: MAX_ATTEMPTS, resendCount: recent ? recent.resendCount + 1 : 0,
      expiresAt: new Date(Date.now() + TTL * 1000),
    },
  });
  await sendSms(mobile, code);
  return { ok: true, resendInSeconds: RESEND_COOLDOWN };
}

export type VerifyOtpResult =
  | { ok: true; customerId: string; profileComplete: boolean; mobile: string }
  | { ok: false; error: string };

export async function verifyOtp(rawMobile: string, code: string): Promise<VerifyOtpResult> {
  const mobile = normalizeMobile(rawMobile);
  if (!mobile) return { ok: false, error: "Enter a valid mobile number." };
  if (!/^\d{6}$/.test(code)) return { ok: false, error: "Enter the 6-digit code." };

  const session = await db.otpSession.findFirst({
    where: { mobile, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!session) return { ok: false, error: "Code expired. Please request a new one." };

  if (session.attempts >= session.maxAttempts) {
    return { ok: false, error: "Too many incorrect attempts. Request a new code." };
  }

  const provided = Buffer.from(hashCode(code, mobile));
  const expected = Buffer.from(session.codeHash);
  const match = provided.length === expected.length && timingSafeEqual(provided, expected);

  if (!match) {
    await db.otpSession.update({ where: { id: session.id }, data: { attempts: { increment: 1 } } });
    return { ok: false, error: "Incorrect code. Please try again." };
  }

  // Success — consume the code and upsert the customer.
  await db.otpSession.update({ where: { id: session.id }, data: { consumedAt: new Date() } });
  const customer = await db.customer.upsert({
    where: { mobile },
    update: { isVerified: true },
    create: { mobile, isVerified: true },
  });

  return {
    ok: true,
    customerId: customer.id,
    profileComplete: Boolean(customer.fullName && customer.email),
    mobile,
  };
}
