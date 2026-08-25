import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, Panel, Table, Th, Td, EmptyRow, Pill, StatCard, AdminPager } from "@/components/admin/ui";
import { formatINR, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;
const TONE: Record<string, string> = { PAID: "success", PENDING: "warning", FAILED: "danger", REFUNDED: "neutral" };

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin("payment.view");
  const page = Math.max(1, Number((await searchParams).page ?? 1) || 1);

  const [total, paidAgg, rows] = await Promise.all([
    db.payment.count(),
    db.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),
    db.payment.findMany({
      orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      include: { booking: { select: { id: true, reference: true } } },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader title="Payments" subtitle="Gateway transactions — verified server-side." />
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total captured" value={formatINR(paidAgg._sum.amount ?? 0, { compact: true })} tone="green" />
        <StatCard label="Transactions" value={total} tone="navy" />
      </div>
      <Panel>
        <Table head={<><Th>Booking</Th><Th>Provider</Th><Th>Order / Payment ID</Th><Th className="text-right">Amount</Th><Th>Status</Th><Th>Date</Th></>}>
          {rows.length === 0 ? <EmptyRow colSpan={6} label="No payments yet." /> : rows.map((p) => (
            <tr key={p.id} className="hover:bg-surface-muted/40">
              <Td><Link href={`/admin/bookings/${p.booking.id}`} className="font-semibold text-brand-blue hover:underline">{p.booking.reference}</Link></Td>
              <Td className="text-ink-muted">{p.provider}</Td>
              <Td className="max-w-[220px] truncate font-mono text-xs text-ink-muted">{p.providerPaymentId ?? p.providerOrderId ?? "—"}</Td>
              <Td className="text-right tabular-nums">{formatINR(p.amount)}</Td>
              <Td><Pill tone={TONE[p.status] ?? "neutral"}>{p.status}</Pill></Td>
              <Td className="text-ink-muted">{formatDate(p.createdAt)}</Td>
            </tr>
          ))}
        </Table>
        <AdminPager page={page} totalPages={totalPages} base="/admin/payments" />
      </Panel>
    </>
  );
}
