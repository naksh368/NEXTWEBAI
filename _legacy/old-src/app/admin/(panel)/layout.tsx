import { requireAdmin } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/admin-shell";

// Every page under (panel) is guarded here — unauthenticated users are
// redirected to /admin/login before any admin data is queried.
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <AdminShell admin={{ name: admin.fullName, role: admin.roleName ?? "Admin" }}>
      {children}
    </AdminShell>
  );
}
