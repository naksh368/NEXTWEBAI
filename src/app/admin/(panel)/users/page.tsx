import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, Panel, Table, Th, Td, EmptyRow, Pill } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdmin("user.manage");
  const rows = await db.adminUser.findMany({ orderBy: { createdAt: "asc" }, include: { role: { select: { name: true } } } });

  return (
    <>
      <PageHeader title="Admin users" subtitle="Team members with access to this console." />
      <Panel>
        <Table head={<><Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Status</Th><Th>Last login</Th></>}>
          {rows.length === 0 ? <EmptyRow colSpan={5} label="No admin users." /> : rows.map((u) => (
            <tr key={u.id} className="hover:bg-surface-muted/40">
              <Td className="font-medium">{u.fullName}</Td>
              <Td className="text-ink-muted">{u.email}</Td>
              <Td><Pill tone="info">{u.role?.name ?? "—"}</Pill></Td>
              <Td>{u.status === "ACTIVE" ? <Pill tone="success">Active</Pill> : <Pill tone="neutral">{u.status}</Pill>}</Td>
              <Td className="text-ink-muted">{u.lastLoginAt ? formatDate(u.lastLoginAt, { hour: "2-digit", minute: "2-digit" }) : "—"}</Td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
