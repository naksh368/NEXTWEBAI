import { createHmac, timingSafeEqual, randomInt } from "node:crypto";
import { db } from "@/lib/db";
import { sendOtpSms } from "./sms";
import { sendOtpEmail } from "./email";

/**
 * OTP service (Phase 13). Codes are stored HASHED, single-use, time-limited,
 * attempt-limited and resend-throttled. The plaintext code is never persisted
 * or returned to the client — only delivered to the customer.
 *
 * The core is identifier-based (an email or a mobile). Email OTP (via Resend)
 * is the default login channel so the site works without SMS/DLT; the mobile
 * (MSG91) path is kept for when a DLT template is approved. The OtpSession
 * `mobile` column holds whichever identifier is in use.
 */
const SECRET = process.env.AUTH_SECRET || "insecure-dev-secret-change-me";
const TTL = Number(process.env.OTP_TTL_SECONDS || 300);
const MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const RESEND_COOLDOWN = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 30);
const ttlMinutes = () => Math.max(1, Math.round(TTL / 60));

function hashCode(code: string, identifier: string): string {
  return createHmac("sha256", SECRET).update(`${identifier}:${code}`).digest("hex");
}

/** Basic E.164-ish validation; the real world would use libphonenumber. */
export function normalizeMobile(input: string): string | null {
  const trimmed = input.replace(/[\s-]/g, "");
  if (/^\+?[1-9]\d{7,14}$/.test(trimmed)) {
    return trimmed.startsWith("+") ? trimmed : `+91${trimmed.replace(/^0+/, "")}`;
  }
  return null;
}

/** Lowercase + basic shape check for email identifiers. */
export function normalizeEmail(input: string): string | null {
  const e = input.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}

function otpText(code: string): string {
  return `Your ExpertzTrip verification code is ${code}. Valid for ${ttlMinutes()} minutes. Do not share this code with anyone.`;
}

export type RequestOtpResult =
  | { ok: true; resendInSeconds: number }
  | { ok: false; error: string; retryInSeconds?: number };

/** Create (throttled) + deliver an OTP for any identifier. */
async function createAndDeliver(
  identifier: string,
  purpose: "LOGIN" | "REGISTER",
  deliver: (code: string) => Promise<unknown>
): Promise<RequestOtpResult> {
  const recent = await db.otpSession.findFirst({
    where: { mobile: identifier, purpose, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    const since = (Date.now() - recent.createdAt.getTime()) / 1000;
    if (since < RESEND_COOLDOWN) {
      return { ok: false, error: "Please wait before requesting another code.", retryInSeconds: Math.ceil(RESEND_COOLDOWN - since) };
    }
    if (recent.resendCount >= 5) return { ok: false, error: "Too many attempts. Try again later." };
  }

  const code = String(randomInt(100000, 1000000)); // 6 digits
  await db.otpSession.create({
    data: {
      mobile: identifier, purpose, codeHash: hashCode(code, identifier),
      maxAttempts: MAX_ATTEMPTS, resendCount: recent ? recent.resendCount + 1 : 0,
      expiresAt: new Date(Date.now() + TTL * 1000),
    },
  });
  await deliver(code);
  return { ok: true, resendInSeconds: RESEND_COOLDOWN };
}

/** Validate & consume an OTP for an identifier (no account creation). */
async function verifyCore(identifier: string, code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!/^\d{6}$/.test(code)) return { ok: false, error: "Enter the 6-digit code." };
  const session = await db.otpSession.findFirst({
    where: { mobile: identifier, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!session) return { ok: false, error: "Code expired. Please request a new one." };
  if (session.attempts >= session.maxAttempts) return { ok: false, error: "Too many incorrect attempts. Request a new code." };

  const provided = Buffer.from(hashCode(code, identifier));
  const expected = Buffer.from(session.codeHash);
  const match = provided.length === expected.length && timingSafeEqual(provided, expected);
  if (!match) {
    await db.otpSession.update({ where: { id: session.id }, data: { attempts: { increment: 1 } } });
    return { ok: false, error: "Incorrect code. Please try again." };
  }
  await db.otpSession.update({ where: { id: session.id }, data: { consumedAt: new Date() } });
  return { ok: true };
}

// ── Email OTP (default login channel) ──────────────────────────────
export async function requestEmailOtp(rawEmail: string, purpose: "LOGIN" | "REGISTER" = "LOGIN"): Promise<RequestOtpResult> {
  const email = normalizeEmail(rawEmail);
  if (!email) return { ok: false, error: "Enter a valid email address." };
  return createAndDeliver(email, purpose, (code) => sendOtpEmail(email, code, ttlMinutes()));
}

/** Validate an email OTP (no account creation). Reused by admin login. */
export async function verifyEmailOtpCode(rawEmail: string, code: string): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const email = normalizeEmail(rawEmail);
  if (!email) return { ok: false, error: "Enter a valid email address." };
  const res = await verifyCore(email, code);
  return res.ok ? { ok: true, email } : res;
}

export type VerifyOtpResult =
  | { ok: true; customerId: string; profileComplete: boolean; email: string }
  | { ok: false; error: string };

/** Customer email login — verify then find-or-create the customer by email. */
export async function verifyEmailOtp(rawEmail: string, code: string): Promise<VerifyOtpResult> {
  const res = await verifyEmailOtpCode(rawEmail, code);
  if (!res.ok) return res;
  const customer = await db.customer.upsert({
    where: { email: res.email },
    update: { isVerified: true },
    create: { email: res.email, isVerified: true },
  });
  return { ok: true, customerId: customer.id, profileComplete: Boolean(customer.fullName), email: res.email };
}

// ── Mobile OTP (kept for when an MSG91 DLT template is approved) ────
export async function requestOtp(rawMobile: string, purpose: "LOGIN" | "REGISTER" = "LOGIN"): Promise<RequestOtpResult> {
  const mobile = normalizeMobile(rawMobile);
  if (!mobile) return { ok: false, error: "Enter a valid mobile number." };
  return createAndDeliver(mobile, purpose, (code) => sendOtpSms(mobile, code, otpText(code)));
}

/** Validate a mobile OTP (no account creation). */
export async function verifyOtpCode(rawMobile: string, code: string): Promise<{ ok: true; mobile: string } | { ok: false; error: string }> {
  const mobile = normalizeMobile(rawMobile);
  if (!mobile) return { ok: false, error: "Enter a valid mobile number." };
  const res = await verifyCore(mobile, code);
  return res.ok ? { ok: true, mobile } : res;
}
