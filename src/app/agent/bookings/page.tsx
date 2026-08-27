import Link from "next/link";
import { requireApprovedAgent } from "@/lib/agent-auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatDate } from "@/lib/utils";
import { FLIGHT_BOOKING_STATUS_META } from "@/lib/agent-constants";

export const metadata = { title: "Bookings" };
export const dynamic = "force-dynamic";

const TABS = [
  { key: "all", label: "All", statuses: null },
  { key: "confirmed", label: "Confirmed", statuses: ["CONFIRMATION_PENDING", "SUPPLIER_PROCESSING", "HOLD"] },
  { key: "ticketed", label: "Ticketed", statuses: ["TICKETED"] },
  { key: "pending", label: "Pending", statuses: ["DRAFT", "REVALIDATED", "CONFIRMATION_PENDING"] },
  { key: "cancelled", label: "Cancelled", statuses: ["CANCELLED", "FAILED"] },
  { key: "refund", label: "Refund", statuses: ["REFUND_PENDING", "REFUNDED"] },
] as const;

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const agent = await requireApprovedAgent();
  const { tab } = await searchParams;
  const active = TABS.find((t) => t.key === tab) ?? TABS[0];
  const where = { agentId: agent.id, ...(active.statuses ? { status: { in: [...active.statuses] } } : {}) };
  const bookings = await db.flightBooking.findMany({ where, orderBy: { createdAt: "desc" }, include: { passengers: { take: 1 } } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Bookings</h1>
        <p className="text-sm text-ink-muted">All your flight bookings</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <Link key={t.key} href={`/agent/bookings?tab=${t.key}`} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${active.key === t.key ? "bg-brand-blue text-white" : "bg-white text-ink-muted ring-1 ring-surface-border hover:text-brand-blue"}`}>
            {t.label}
          </Link>
        ))}
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-border bg-surface-muted/40 px-6 py-16 text-center">
          <p className="text-base font-semibold text-ink">No bookings yet</p>
          <p className="mt-1 text-sm text-ink-muted">Your first booking will appear here.</p>
          <Link href="/agent/flights" className="mt-4 inline-block rounded-xl bg-brand-blue px-4 py-2 text-sm font-bold text-white">Search Flights</Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-surface-border bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left text-xs font-semibold uppercase tracking-wide text-ink-faint">
                <th className="p-3">Booking ID</th><th className="p-3">PNR</th><th className="p-3">Passenger</th>
                <th className="p-3">Route</th><th className="p-3">Date</th><th className="p-3 text-right">Amount</th><th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const meta = FLIGHT_BOOKING_STATUS_META[b.status];
                const pax = b.passengers[0];
                return (
                  <tr key={b.id} className="border-b border-surface-border/50 hover:bg-surface-muted/40">
                    <td className="p-3"><Link href={`/agent/bookings/${b.id}`} className="font-mono text-xs font-bold text-brand-blue">{b.reference}</Link></td>
                    <td className="p-3 font-mono text-xs">{b.pnr ?? "—"}</td>
                    <td className="p-3">{pax ? `${pax.firstName} ${pax.lastName}` : "—"}</td>
                    <td className="p-3 font-semibold">{b.origin} → {b.destination}</td>
                    <td className="p-3 text-ink-muted">{formatDate(b.departDate)}</td>
                    <td className="p-3 text-right font-bold">{formatINR(b.totalAmount)}</td>
                    <td className="p-3"><Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? b.status}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
