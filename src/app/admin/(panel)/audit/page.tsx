import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, Panel, Table, Th, Td, EmptyRow, AdminPager } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 30;

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin("audit.view");
  const page = Math.max(1, Number((await searchParams).page ?? 1) || 1);

  const [total, rows] = await Promise.all([
    db.auditLog.count(),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      include: { admin: { select: { fullName: true, email: true } } },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader title="Audit logs" subtitle="Every sensitive change: who, what, when (Phase 31)." />
      <Panel>
        <Table head={<><Th>When</Th><Th>Actor</Th><Th>Action</Th><Th>Resource</Th></>}>
          {rows.length === 0 ? <EmptyRow colSpan={4} label="No audit entries yet. Admin actions will be recorded here." /> : rows.map((a) => (
            <tr key={a.id} className="hover:bg-surface-muted/40">
              <Td className="whitespace-nowrap text-ink-muted">{formatDate(a.createdAt, { hour: "2-digit", minute: "2-digit" })}</Td>
              <Td>{a.admin?.fullName ?? a.actorType}</Td>
              <Td className="font-mono text-xs">{a.action}</Td>
              <Td className="font-mono text-xs text-ink-muted">{a.resource}</Td>
            </tr>
          ))}
        </Table>
        <AdminPager page={page} totalPages={totalPages} base="/admin/audit" />
      </Panel>
    </>
  );
}
