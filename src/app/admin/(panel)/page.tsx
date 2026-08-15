import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, StatCard, Panel, Table, Th, Td, Pill, EmptyRow } from "@/components/admin/ui";
import { BOOKING_STATUS_META } from "@/lib/constants";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/booking-states";
import { formatINR, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  await requireAdmin("dashboard.view");
  const denied = (await searchParams).denied === "1";

  const now = new Date();
  const [
    totalBookings, confirmed, processing, paymentReceived, customers,
    publishedPackages, openTickets, upcoming, paidAgg, refundAgg, recent,
  ] = await Promise.all([
    db.booking.count(),
    db.booking.count({ where: { status: "CONFIRMED" } }),
    db.booking.count({ where: { status: { in: ["BOOKING_PROCESSING", "SUPPLIER_CONFIRMATION_PENDING"] } } }),
    db.booking.count({ where: { status: "PAYMENT_RECEIVED" } }),
    db.customer.count(),
    db.package.count({ where: { status: "PUBLISHED" } }),
    db.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    db.booking.count({ where: { status: { in: ACTIVE_BOOKING_STATUSES }, travelDate: { gte: now } } }),
    db.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),
    db.refund.aggregate({ _sum: { amount: true }, where: { status: "PROCESSED" } }),
    db.booking.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { customer: { select: { fullName: true, mobile: true } }, package: { select: { name: true } } } }),
  ]);

  const revenue = paidAgg._sum.amount ?? 0;
  const refunds = refundAgg._sum.amount ?? 0;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Live operations overview." />

      {denied && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-warning/30 bg-[#FDF7EC] px-4 py-3 text-sm text-warning">
          <AlertTriangle className="h-4 w-4" /> You don&apos;t have permission to view that section.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total bookings" value={totalBookings} tone="navy" />
        <StatCard label="Confirmed" value={confirmed} tone="green" />
        <StatCard label="Processing" value={processing} tone="blue" />
        <StatCard label="Payment received" value={paymentReceived} tone="orange" />
        <StatCard label="Revenue (paid)" value={formatINR(revenue, { compact: true })} tone="green" hint="Verified payments" />
        <StatCard label="Refunds" value={formatINR(refunds, { compact: true })} tone="navy" />
        <StatCard label="Customers" value={customers} tone="blue" />
        <StatCard label="Published packages" value={publishedPackages} tone="navy" />
        <StatCard label="Upcoming trips" value={upcoming} tone="orange" />
        <StatCard label="Open tickets" value={openTickets} tone="blue" />
      </div>

      <div className="mt-6">
        <Panel title="Recent bookings" action={<Link href="/admin/bookings" className="text-sm font-semibold text-brand-blue hover:underline">View all</Link>}>
          <Table head={<><Th>Reference</Th><Th>Customer</Th><Th>Package</Th><Th>Status</Th><Th className="text-right">Amount</Th><Th>Created</Th></>}>
            {recent.length === 0 ? (
              <EmptyRow colSpan={6} label="No bookings yet — they'll appear here as customers book." />
            ) : recent.map((b) => {
              const meta = BOOKING_STATUS_META[b.status] ?? { label: b.status, tone: "neutral" as const };
              return (
                <tr key={b.id} className="hover:bg-surface-muted/40">
                  <Td><Link href={`/admin/bookings/${b.id}`} className="font-semibold text-brand-blue hover:underline">{b.reference}</Link></Td>
                  <Td>{b.customer.fullName ?? b.customer.mobile}</Td>
                  <Td className="text-ink-muted">{b.package.name}</Td>
                  <Td><Pill tone={meta.tone}>{meta.label}</Pill></Td>
                  <Td className="text-right font-medium tabular-nums">{formatINR(b.totalAmount)}</Td>
                  <Td className="text-ink-muted">{formatDate(b.createdAt)}</Td>
                </tr>
              );
            })}
          </Table>
        </Panel>
      </div>
    </>
  );
}
