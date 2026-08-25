import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

const SECRET = process.env.AUTH_SECRET || "insecure-dev-secret-change-me";

/** Six-digit numeric OTP. */
export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** HMAC of the code (never store the raw code). */
export function hashOtp(code: string): string {
  return createHmac("sha256", `otp:${SECRET}`).update(code).digest("hex");
}

export function verifyOtp(code: string, hash: string): boolean {
  const a = Buffer.from(hashOtp(code));
  const b = Buffer.from(hash);
  return a.length === b.length && timingSafeEqual(a, b);
}
