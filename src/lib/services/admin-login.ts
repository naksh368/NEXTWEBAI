import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

/**
 * Administrator credential check.
 *
 * There is ONE login page; this runs inside it, server-side only, and no
 * secret ever reaches the browser. There is deliberately no public admin
 * sign-up and no way for a customer to grant themselves a role.
 *
 * SECURITY: there is no default password. `ADMIN_EMAIL` and `ADMIN_PASSWORD`
 * must both be set in the environment before the bootstrap login works — with
 * either missing, this function denies every attempt. A password compiled into
 * the source would be public the moment the repository is cloned.
 *
 * Two paths are supported:
 *  1. Bootstrap — the identifier matches ADMIN_EMAIL/ADMIN_MOBILE and the
 *     password matches ADMIN_PASSWORD. Used to create the very first admin.
 *  2. Normal — any ACTIVE AdminUser row whose stored `passwordHash` verifies.
 *     Hashes are scrypt (see lib/password.ts); plaintext is never stored.
 */

const BOOTSTRAP_EMAIL = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const BOOTSTRAP_MOBILE = (process.env.ADMIN_MOBILE ?? "").replace(/\D/g, "");
const BOOTSTRAP_PASSWORD = process.env.ADMIN_PASSWORD ?? "";
const MIN_PASSWORD_LENGTH = 12;

/** Warn loudly, once, if the bootstrap credentials are misconfigured. */
let warned = false;
function warnOnce(message: string) {
  if (warned) return;
  warned = true;
  console.warn(`[admin-login] ${message}`);
}

function bootstrapConfigured(): boolean {
  if (!BOOTSTRAP_EMAIL || !BOOTSTRAP_PASSWORD) {
    warnOnce(
      "ADMIN_EMAIL and ADMIN_PASSWORD are not both set — bootstrap admin login is disabled. " +
        "Set them in the environment to create the first administrator."
    );
    return false;
  }
  if (BOOTSTRAP_PASSWORD.length < MIN_PASSWORD_LENGTH) {
    warnOnce(
      `ADMIN_PASSWORD is shorter than ${MIN_PASSWORD_LENGTH} characters — bootstrap admin login is disabled. ` +
        "Choose a longer password."
    );
    return false;
  }
  return true;
}

/** Constant-time string comparison, so a wrong password leaks no timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Returns the AdminUser id when the identifier + password are valid, else null.
 * Never throws: a database problem denies the login rather than crashing it.
 */
export async function tryAdminLogin(identifier: string, password: string): Promise<string | null> {
  const id = identifier.trim();
  if (!id || !password) return null;

  // Build the identity match from the forms the input could actually be.
  // (A NUL-byte "never match" sentinel is not an option — PostgreSQL rejects
  // NUL in text, which would turn a failed login into a 500.)
  const idDigits = id.replace(/\D/g, "");
  const identityMatches: { email?: string; mobile?: string }[] = [{ email: id.toLowerCase() }];
  if (idDigits) identityMatches.push({ mobile: idDigits });

  try {
    // ── 1. An existing admin signing in with their own stored password ──
    const existing = await db.adminUser.findFirst({
      where: { status: "ACTIVE", passwordHash: { not: null }, OR: identityMatches },
      select: { id: true, passwordHash: true },
    });
    if (existing?.passwordHash && verifyPassword(password, existing.passwordHash)) {
      await db.adminUser.update({ where: { id: existing.id }, data: { lastLoginAt: new Date() } });
      return existing.id;
    }

    // ── 2. Bootstrap credentials from the environment ──
    if (!bootstrapConfigured()) return null;

    const matchesEmail = safeEqual(id.toLowerCase(), BOOTSTRAP_EMAIL);
    const matchesMobile = Boolean(BOOTSTRAP_MOBILE) && safeEqual(idDigits, BOOTSTRAP_MOBILE);
    if (!matchesEmail && !matchesMobile) return null;
    if (!safeEqual(password, BOOTSTRAP_PASSWORD)) return null;

    let superRole = await db.role.findUnique({ where: { key: "SUPER_ADMIN" }, select: { id: true } });
    if (!superRole) {
      superRole = await db.role.create({
        data: { key: "SUPER_ADMIN", name: "Super Admin", description: "Full access to every section." },
        select: { id: true },
      });
    }

    // Reuse an existing row rather than blindly creating one — a CREATE whose
    // email or mobile already belongs to another admin would hit the unique
    // constraint and 500 the login.
    const byEmail = await db.adminUser.findUnique({ where: { email: BOOTSTRAP_EMAIL }, select: { id: true } });
    if (byEmail) {
      await db.adminUser.update({
        where: { id: byEmail.id },
        // Store the hash so this admin can sign in even if the env var is later
        // rotated or removed.
        data: { status: "ACTIVE", roleId: superRole.id, passwordHash: hashPassword(BOOTSTRAP_PASSWORD), lastLoginAt: new Date() },
      });
      return byEmail.id;
    }

    if (BOOTSTRAP_MOBILE) {
      const byMobile = await db.adminUser.findUnique({ where: { mobile: BOOTSTRAP_MOBILE }, select: { id: true } });
      if (byMobile) {
        await db.adminUser.update({
          where: { id: byMobile.id },
          data: { email: BOOTSTRAP_EMAIL, status: "ACTIVE", roleId: superRole.id, passwordHash: hashPassword(BOOTSTRAP_PASSWORD), lastLoginAt: new Date() },
        });
        return byMobile.id;
      }
    }

    const created = await db.adminUser.create({
      data: {
        email: BOOTSTRAP_EMAIL,
        mobile: BOOTSTRAP_MOBILE || null,
        fullName: "Administrator",
        passwordHash: hashPassword(BOOTSTRAP_PASSWORD),
        status: "ACTIVE",
        roleId: superRole.id,
      },
      select: { id: true },
    });
    return created.id;
  } catch (e) {
    console.error("[admin-login] login denied after an error:", e);
    return null;
  }
}
