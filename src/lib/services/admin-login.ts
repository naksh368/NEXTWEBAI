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

  let superRole = await db.role.findUnique({ where: { key: "SUPER_ADMIN" }, select: { id: true } });
  if (!superRole) {
    superRole = await db.role.create({
      data: { key: "SUPER_ADMIN", name: "Super Admin", description: "Full access to every section." },
      select: { id: true },
    });
  }

  // Key the upsert on the stable mobile (not the email) so changing ADMIN_EMAIL
  // just updates the existing admin's email instead of creating a second row
  // that would collide on the unique mobile.
  const admin = await db.adminUser.upsert({
    where: { mobile: ADMIN_MOBILE },
    create: { email: ADMIN_EMAIL, mobile: ADMIN_MOBILE, fullName: "Admin", passwordHash: hashPassword(ADMIN_PASSWORD), status: "ACTIVE", roleId: superRole.id },
    update: { email: ADMIN_EMAIL, lastLoginAt: new Date(), status: "ACTIVE", roleId: superRole.id },
    select: { id: true },
  });
  return admin.id;
}
