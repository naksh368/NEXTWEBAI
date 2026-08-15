import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "./db";
import { getAdminSessionId } from "./admin-session";

export type CurrentAdmin = {
  id: string;
  email: string;
  fullName: string;
  roleKey: string | null;
  roleName: string | null;
  permissions: Set<string>;
};

/** Loads the signed-in admin + their role permissions (request-cached). */
export const getCurrentAdmin = cache(async (): Promise<CurrentAdmin | null> => {
  const id = await getAdminSessionId();
  if (!id) return null;
  const admin = await db.adminUser.findUnique({
    where: { id },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });
  if (!admin || admin.status !== "ACTIVE") return null;
  return {
    id: admin.id,
    email: admin.email,
    fullName: admin.fullName,
    roleKey: admin.role?.key ?? null,
    roleName: admin.role?.name ?? null,
    permissions: new Set(admin.role?.permissions.map((p) => p.permission.key) ?? []),
  };
});

/** Super admin implicitly has every permission (Phase 29). */
export function hasPermission(admin: CurrentAdmin, permission: string): boolean {
  return admin.roleKey === "SUPER_ADMIN" || admin.permissions.has(permission);
}

/**
 * Page guard. Redirects to login when not signed in, or to the dashboard with a
 * denied flag when the permission is missing. Permissions are enforced on the
 * SERVER — hiding UI is never the only defence (Phase 29).
 */
export async function requireAdmin(permission?: string): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (permission && !hasPermission(admin, permission)) redirect("/admin?denied=1");
  return admin;
}

/** For server actions — returns the admin if permitted, else null (no redirect). */
export async function authorize(permission: string): Promise<CurrentAdmin | null> {
  const admin = await getCurrentAdmin();
  if (!admin) return null;
  return hasPermission(admin, permission) ? admin : null;
}
