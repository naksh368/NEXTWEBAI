import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, Panel, Table, Th, Td, EmptyRow, Pill } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
const TONE: Record<string, string> = { OPEN: "warning", IN_PROGRESS: "info", WAITING_FOR_CUSTOMER: "neutral", RESOLVED: "success", CLOSED: "neutral" };

export default async function AdminSupportPage() {
  await requireAdmin("support.manage");
  const rows = await db.supportTicket.findMany({
    orderBy: { updatedAt: "desc" }, take: 50,
    include: { customer: { select: { fullName: true, mobile: true } }, _count: { select: { messages: true } } },
  });

  return (
    <>
      <PageHeader title="Support tickets" subtitle="Customer requests across booking, payment, modification and more." />
      <Panel>
        <Table head={<><Th>Reference</Th><Th>Customer</Th><Th>Category</Th><Th>Subject</Th><Th>Status</Th><Th>Updated</Th></>}>
          {rows.length === 0 ? <EmptyRow colSpan={6} label="No support tickets yet." /> : rows.map((t) => (
            <tr key={t.id} className="hover:bg-surface-muted/40">
              <Td className="font-semibold">{t.reference}</Td>
              <Td>{t.customer.fullName ?? t.customer.mobile}</Td>
              <Td><Pill tone="info">{t.category}</Pill></Td>
              <Td className="max-w-xs truncate text-ink-muted">{t.subject}</Td>
              <Td><Pill tone={TONE[t.status] ?? "neutral"}>{t.status}</Pill></Td>
              <Td className="text-ink-muted">{formatDate(t.updatedAt)}</Td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
