import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { PageHeader, Panel, Table, Th, Td, Pill, EmptyRow, AdminPager } from "@/components/admin/ui";
import { BOOKING_STATUS_META, BOOKING_STATUS } from "@/lib/constants";
import { formatINR, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 15;

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  await requireAdmin("booking.view");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const status = sp.status && BOOKING_STATUS.includes(sp.status as never) ? sp.status : undefined;
  const where: Prisma.BookingWhereInput = status ? { status } : {};

  const [total, rows] = await Promise.all([
    db.booking.count({ where }),
    db.booking.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      include: { customer: { select: { fullName: true, mobile: true } }, package: { select: { name: true } } },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader title="Bookings" subtitle={`${total} booking${total === 1 ? "" : "s"}`} />

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip label="All" href="/admin/bookings" active={!status} />
        {(["PAYMENT_PENDING", "PAYMENT_RECEIVED", "BOOKING_PROCESSING", "CONFIRMED", "CANCELLED"] as const).map((s) => (
          <FilterChip key={s} label={BOOKING_STATUS_META[s].label} href={`/admin/bookings?status=${s}`} active={status === s} />
        ))}
      </div>

      <Panel>
        <Table head={<><Th>Reference</Th><Th>Customer</Th><Th>Package</Th><Th>Status</Th><Th className="text-right">Amount</Th><Th>Created</Th></>}>
          {rows.length === 0 ? (
            <EmptyRow colSpan={6} label="No bookings match this filter." />
          ) : rows.map((b) => {
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
        <AdminPager page={page} totalPages={totalPages} base={status ? `/admin/bookings?status=${status}` : "/admin/bookings"} />
      </Panel>
    </>
  );
}

function FilterChip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link href={href} className={`rounded-full border px-3 py-1.5 text-sm font-medium ${active ? "border-brand-blue bg-brand-blueLight text-brand-blue" : "border-surface-border text-ink-muted hover:border-brand-blue"}`}>
      {label}
    </Link>
  );
}
