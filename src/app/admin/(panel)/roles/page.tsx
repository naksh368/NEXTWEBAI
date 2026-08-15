import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, Panel } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  await requireAdmin("role.manage");
  const roles = await db.role.findMany({
    orderBy: { key: "asc" },
    include: { permissions: { include: { permission: true } }, _count: { select: { admins: true } } },
  });

  return (
    <>
      <PageHeader title="Roles & permissions" subtitle="Permissions are enforced server-side on every action (Phase 29)." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {roles.map((r) => (
          <Panel key={r.id} title={r.name} action={<span className="text-xs text-ink-faint">{r._count.admins} user{r._count.admins === 1 ? "" : "s"}</span>}>
            <div className="p-5">
              {r.description && <p className="mb-3 text-sm text-ink-muted">{r.description}</p>}
              <div className="flex flex-wrap gap-1.5">
                {r.key === "SUPER_ADMIN" ? (
                  <span className="rounded-full bg-brand-blueLight px-2.5 py-1 text-xs font-semibold text-brand-blue">All permissions</span>
                ) : r.permissions.length === 0 ? (
                  <span className="text-xs text-ink-faint">No permissions assigned.</span>
                ) : r.permissions.map((p) => (
                  <span key={p.permissionId} className="rounded-full bg-surface-muted px-2.5 py-1 font-mono text-xs text-ink-muted">{p.permission.key}</span>
                ))}
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
