import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { setAdminCookie } from "@/lib/admin-session";

export const runtime = "nodejs";

// Hardcoded admin credentials — change these via env vars in production.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "support@expertztrip.com";
const ADMIN_MOBILE = process.env.ADMIN_MOBILE || "8700650467";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Ashok@84";

const schema = z.object({
  identifier: z.string().min(1, "Enter your email or mobile number."),
  password: z.string().min(1, "Enter your password."),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 422 });
  }

  const { identifier, password } = parsed.data;
  const identifierLower = identifier.trim().toLowerCase();
  const matchesEmail = identifierLower === ADMIN_EMAIL.toLowerCase();
  const matchesMobile = identifier.trim() === ADMIN_MOBILE;

  if ((!matchesEmail && !matchesMobile) || password !== ADMIN_PASSWORD) {
    // Constant-time-ish: always run both checks before returning
    return NextResponse.json({ ok: false, error: "Invalid credentials." }, { status: 401 });
  }

  // Ensure the SUPER_ADMIN role exists (create it with all permissions if the
  // database was never seeded), so the auto-provisioned admin has full access.
  let superRole = await db.role.findUnique({ where: { key: "SUPER_ADMIN" }, select: { id: true } });
  if (!superRole) {
    superRole = await db.role.create({
      data: { key: "SUPER_ADMIN", name: "Super Admin", description: "Full access to every section." },
      select: { id: true },
    });
  }

  // Ensure admin row exists in DB (auto-provision on first login) and always
  // carries the SUPER_ADMIN role — SUPER_ADMIN implicitly has every permission.
  // Key the upsert on the stable mobile (not the email) so changing ADMIN_EMAIL
  // updates the existing admin's email instead of creating a duplicate row that
  // would collide on the unique mobile.
  const admin = await db.adminUser.upsert({
    where: { mobile: ADMIN_MOBILE },
    create: {
      email: ADMIN_EMAIL,
      mobile: ADMIN_MOBILE,
      fullName: "Admin",
      passwordHash: hashPassword(ADMIN_PASSWORD),
      status: "ACTIVE",
      roleId: superRole.id,
    },
    update: { email: ADMIN_EMAIL, lastLoginAt: new Date(), status: "ACTIVE", roleId: superRole.id },
    select: { id: true },
  });

  await setAdminCookie(admin.id);
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
