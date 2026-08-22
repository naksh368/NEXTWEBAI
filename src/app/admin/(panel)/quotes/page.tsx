import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, StatCard, Panel, Table, Th, Td, EmptyRow, Pill } from "@/components/admin/ui";
import { SendQuoteButton } from "@/components/admin/quote-actions";
import { formatINR, formatDate } from "@/lib/utils";
import { createQuoteAction } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "brand" | "info" | "warning" | "success" | "danger" | "neutral"> = {
  DRAFT: "neutral", SENT: "info", ACCEPTED: "success", DECLINED: "danger", EXPIRED: "warning",
};
const inp = "w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15";

export default async function AdminQuotesPage({ searchParams }: { searchParams: Promise<{ enquiryId?: string }> }) {
  await requireAdmin("booking.view");
  const { enquiryId } = await searchParams;

  const [quotes, packages, enquiry, counts] = await Promise.all([
    db.quote.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    db.package.findMany({ where: { status: "PUBLISHED" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    enquiryId ? db.enquiry.findUnique({ where: { id: enquiryId } }) : Promise.resolve(null),
    db.quote.groupBy({ by: ["status"], _count: true }),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <>
      <PageHeader title="Quotes" subtitle="Send a personalized quote — the customer can accept and pay online." />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Draft" value={countOf("DRAFT")} tone="navy" />
        <StatCard label="Sent" value={countOf("SENT")} tone="blue" />
        <StatCard label="Accepted" value={countOf("ACCEPTED")} tone="green" />
        <StatCard label="Total" value={quotes.length} tone="orange" />
      </div>

      <Panel title="New quote">
        <form action={createQuoteAction} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <input type="hidden" name="enquiryId" value={enquiry?.id ?? ""} />
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-brand-navy">Customer name *</span>
            <input name="customerName" required defaultValue={enquiry?.fullName ?? ""} className={inp} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-brand-navy">Customer email</span>
            <input name="customerEmail" type="email" defaultValue={enquiry?.email ?? ""} placeholder="needed to send the quote" className={inp} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-brand-navy">Phone</span>
            <input name="customerPhone" defaultValue={enquiry?.phone ?? ""} className={inp} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-brand-navy">Package</span>
            <select name="packageId" className={inp}>
              <option value="">— Custom (no package) —</option>
              {packages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-brand-navy">Quote title</span>
            <input name="title" defaultValue={enquiry?.packageName ?? ""} placeholder="auto-filled from package if blank" className={inp} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-brand-navy">Travellers</span>
            <input name="travellerCount" type="number" min={1} defaultValue={enquiry?.travellers ?? 2} className={inp} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-brand-navy">Travel date</span>
            <input name="travelDate" defaultValue={enquiry?.travelDate ?? ""} placeholder="e.g. 12 Oct 2026" className={inp} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-brand-navy">Departure city</span>
            <input name="departureCity" className={inp} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-brand-navy">Total amount (₹) *</span>
            <input name="amount" type="number" min={0} required placeholder="the agreed price incl. any discount" className={inp} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-brand-navy">Valid for (days)</span>
            <input name="validDays" type="number" min={1} defaultValue={7} className={inp} />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block font-semibold text-brand-navy">Notes to the customer</span>
            <textarea name="notes" rows={2} placeholder="what's included, next steps, anything special…" className={inp} />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-orange px-6 font-semibold text-white hover:bg-brand-orangeDark">Create quote (draft)</button>
          </div>
        </form>
      </Panel>

      <div className="mt-6">
        <Panel title="All quotes">
          <Table head={<><Th>Ref</Th><Th>Customer</Th><Th>Holiday</Th><Th className="text-right">Amount</Th><Th>Status</Th><Th>Created</Th><Th>Action</Th></>}>
            {quotes.length === 0 ? (
              <EmptyRow colSpan={7} label="No quotes yet — create one above." />
            ) : quotes.map((q) => (
              <tr key={q.id} className="align-top hover:bg-surface-muted/40">
                <Td><Link href={`/quote/${q.id}`} className="font-semibold text-brand-blue hover:underline">{q.reference}</Link></Td>
                <Td>
                  <div className="font-medium">{q.customerName}</div>
                  {q.customerEmail && <div className="text-xs text-ink-muted">{q.customerEmail}</div>}
                </Td>
                <Td className="text-ink-muted">{q.title}</Td>
                <Td className="text-right font-medium tabular-nums">{formatINR(q.amount)}</Td>
                <Td><Pill tone={STATUS_TONE[q.status] ?? "neutral"}>{q.status}</Pill>{q.bookingId && <div className="mt-1"><Link href={`/admin/bookings/${q.bookingId}`} className="text-xs text-brand-blue hover:underline">Booked ↗</Link></div>}</Td>
                <Td className="whitespace-nowrap text-ink-muted">{formatDate(q.createdAt)}</Td>
                <Td>{q.status === "ACCEPTED" ? <span className="text-xs text-success">Accepted</span> : <SendQuoteButton quoteId={q.id} sent={q.status === "SENT"} />}</Td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>
    </>
  );
}
