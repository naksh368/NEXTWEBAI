import { normalizeMobile } from "./otp-service";

/**
 * Twilio Verify integration for MOBILE OTP (spec: reuse Twilio Verify).
 *
 * Uses the Twilio Verify REST API directly (no SDK) so there's no extra
 * dependency. Twilio Verify owns code generation, expiry and per-code attempt
 * limits server-side; we layer our own send cooldown + rate limiting on top.
 * Credentials are SERVER-SIDE ONLY and never exposed to the browser.
 *
 * Configure:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_VERIFY_SERVICE_SID   (VA... — a Twilio Verify Service)
 * When unset, mobile OTP is honestly disabled (email OTP remains the verifier).
 */
const SID = () => process.env.TWILIO_ACCOUNT_SID || "";
const TOKEN = () => process.env.TWILIO_AUTH_TOKEN || "";
const SERVICE = () => process.env.TWILIO_VERIFY_SERVICE_SID || "";

export function isTwilioConfigured(): boolean {
  return Boolean(SID() && TOKEN() && SERVICE());
}

function authHeader(): string {
  return "Basic " + Buffer.from(`${SID()}:${TOKEN()}`).toString("base64");
}

export type TwilioResult = { ok: true } | { ok: false; error: string };

/** Send (or resend) a verification code by SMS to the given mobile. */
export async function sendMobileOtp(rawMobile: string): Promise<TwilioResult> {
  if (!isTwilioConfigured()) return { ok: false, error: "Mobile verification is not configured." };
  const mobile = normalizeMobile(rawMobile);
  if (!mobile) return { ok: false, error: "Enter a valid mobile number." };
  try {
    const res = await fetch(`https://verify.twilio.com/v2/Services/${SERVICE()}/Verifications`, {
      method: "POST",
      headers: { Authorization: authHeader(), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: mobile, Channel: "sms" }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      return { ok: false, error: body.message || `Could not send the code (${res.status}).` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Check a code the user entered. Returns ok only when Twilio approves it. */
export async function checkMobileOtp(rawMobile: string, code: string): Promise<TwilioResult> {
  if (!isTwilioConfigured()) return { ok: false, error: "Mobile verification is not configured." };
  const mobile = normalizeMobile(rawMobile);
  if (!mobile) return { ok: false, error: "Enter a valid mobile number." };
  if (!/^\d{4,10}$/.test(code)) return { ok: false, error: "Enter the code from the SMS." };
  try {
    const res = await fetch(`https://verify.twilio.com/v2/Services/${SERVICE()}/VerificationCheck`, {
      method: "POST",
      headers: { Authorization: authHeader(), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: mobile, Code: code }),
    });
    const body = (await res.json().catch(() => ({}))) as { status?: string; message?: string };
    if (res.ok && body.status === "approved") return { ok: true };
    // 404 = expired/consumed verification; anything else = wrong code.
    if (res.status === 404) return { ok: false, error: "Code expired. Please request a new one." };
    return { ok: false, error: body.message || "Incorrect code. Please try again." };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
