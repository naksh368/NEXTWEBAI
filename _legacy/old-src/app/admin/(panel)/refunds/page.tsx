import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, Panel, Table, Th, Td, EmptyRow, Pill } from "@/components/admin/ui";
import { formatINR, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
const TONE: Record<string, string> = { PROCESSED: "success", PENDING: "warning", FAILED: "danger" };

export default async function AdminRefundsPage() {
  await requireAdmin("payment.view");
  const rows = await db.refund.findMany({
    orderBy: { createdAt: "desc" }, take: 50,
    include: { booking: { select: { id: true, reference: true } } },
  });

  return (
    <>
      <PageHeader title="Refunds" subtitle="Refund requests and their processing status." />
      <Panel>
        <Table head={<><Th>Booking</Th><Th className="text-right">Amount</Th><Th>Reason</Th><Th>Status</Th><Th>Date</Th></>}>
          {rows.length === 0 ? <EmptyRow colSpan={5} label="No refunds yet." /> : rows.map((r) => (
            <tr key={r.id} className="hover:bg-surface-muted/40">
              <Td><Link href={`/admin/bookings/${r.booking.id}`} className="font-semibold text-brand-blue hover:underline">{r.booking.reference}</Link></Td>
              <Td className="text-right tabular-nums">{formatINR(r.amount)}</Td>
              <Td className="text-ink-muted">{r.reason ?? "—"}</Td>
              <Td><Pill tone={TONE[r.status] ?? "neutral"}>{r.status}</Pill></Td>
              <Td className="text-ink-muted">{formatDate(r.createdAt)}</Td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
