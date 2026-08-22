import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";

/**
 * Admin credentials. Configure via env in production; the defaults preserve the
 * existing admin account so the same email/mobile + password keeps working.
 * There is ONE login page — this check runs inside the normal customer login.
 */
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "expertztripofficial@gmail.com").toLowerCase();
const ADMIN_MOBILE = process.env.ADMIN_MOBILE || "8700650467";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Ashok@84";

/**
 * If the given identifier + password match the admin credentials, provision the
 * admin row (idempotent, SUPER_ADMIN role) and return its id. Otherwise null.
 * No secret is ever sent to the client; this runs server-side only.
 */
export async function tryAdminLogin(identifier: string, password: string): Promise<string | null> {
  const id = identifier.trim();
  const matchesEmail = id.toLowerCase() === ADMIN_EMAIL;
  const matchesMobile = id === ADMIN_MOBILE;
  if ((!matchesEmail && !matchesMobile) || password !== ADMIN_PASSWORD) return null;

  // Provisioning must never throw — a DB hiccup or a legacy row shape should
  // deny the login gracefully (return null), never crash the login request.
  try {
    let superRole = await db.role.findUnique({ where: { key: "SUPER_ADMIN" }, select: { id: true } });
    if (!superRole) {
      superRole = await db.role.create({
        data: { key: "SUPER_ADMIN", name: "Super Admin", description: "Full access to every section." },
        select: { id: true },
      });
    }

    // Reuse an existing admin row instead of blindly upserting — match on the
    // configured email first, then the mobile. This avoids ever trying to CREATE
    // a row whose email or mobile already belongs to another admin row (which
    // would violate the unique constraints and 500 the login).
    const byEmail = await db.adminUser.findUnique({ where: { email: ADMIN_EMAIL }, select: { id: true } });
    if (byEmail) {
      await db.adminUser.update({ where: { id: byEmail.id }, data: { status: "ACTIVE", roleId: superRole.id, lastLoginAt: new Date() } });
      return byEmail.id;
    }

    const byMobile = await db.adminUser.findUnique({ where: { mobile: ADMIN_MOBILE }, select: { id: true } });
    if (byMobile) {
      // No row holds ADMIN_EMAIL (checked above), so aligning the email here is
      // safe and lets the login code reach the configured admin inbox.
      await db.adminUser.update({ where: { id: byMobile.id }, data: { email: ADMIN_EMAIL, status: "ACTIVE", roleId: superRole.id, lastLoginAt: new Date() } });
      return byMobile.id;
    }

    const created = await db.adminUser.create({
      data: { email: ADMIN_EMAIL, mobile: ADMIN_MOBILE, fullName: "Admin", passwordHash: hashPassword(ADMIN_PASSWORD), status: "ACTIVE", roleId: superRole.id },
      select: { id: true },
    });
    return created.id;
  } catch (e) {
    console.error("[admin-login] provisioning failed (login denied):", e);
    return null;
  }
}
