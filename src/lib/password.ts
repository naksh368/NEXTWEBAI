import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Password hashing for admin accounts (Phase 30). scrypt with a per-hash salt.
 * Format: scrypt$<saltHex>$<hashHex>. Never store or log plaintext.
 */
export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(plain, salt, 64);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derived = scryptSync(plain, salt, expected.length);
  return timingSafeEqual(derived, expected);
}
