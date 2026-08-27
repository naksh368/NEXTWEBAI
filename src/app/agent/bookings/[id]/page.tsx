import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireApprovedAgent } from "@/lib/agent-auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatDate } from "@/lib/utils";
import { FLIGHT_BOOKING_STATUS_META } from "@/lib/agent-constants";

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const agent = await requireApprovedAgent();
  const { id } = await params;
  // Tenant isolation — only the owning agent's booking.
  const booking = await db.flightBooking.findFirst({
    where: { id, agentId: agent.id },
    include: { passengers: true, events: { orderBy: { createdAt: "asc" } } },
  });
  if (!booking) notFound();
  const meta = FLIGHT_BOOKING_STATUS_META[booking.status];

  return (
    <div className="space-y-6">
      <Link href="/agent/bookings" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-muted hover:text-brand-blue"><ArrowLeft size={15} /> Back to bookings</Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-extrabold">{booking.reference}</h1>
          <p className="text-sm text-ink-muted">{booking.origin} → {booking.destination} · {formatDate(booking.departDate)}</p>
        </div>
        <Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? booking.status}</Badge>
      </div>

      {booking.status === "CONFIRMATION_PENDING" && (
        <p className="rounded-xl border border-warning/20 bg-[#FDF2E3] px-4 py-3 text-sm text-warning">
          Booking verification is pending with the supplier. We will not show a ticket until issuance is confirmed. Held funds remain reserved until this resolves.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Flight">
            <Row k="Route" v={`${booking.origin} → ${booking.destination}`} />
            <Row k="Trip type" v={booking.tripType === "ROUND" ? "Round trip" : "One way"} />
            <Row k="Cabin" v={booking.cabin} />
            <Row k="Departure" v={formatDate(booking.departDate)} />
            {booking.pnr && <Row k="PNR" v={booking.pnr} />}
          </Panel>
          <Panel title="Passengers">
            {booking.passengers.length === 0 ? <p className="text-sm text-ink-muted">No passengers recorded.</p> : (
              <div className="space-y-2">
                {booking.passengers.map((p) => (
                  <div key={p.id} className="flex justify-between text-sm">
                    <span className="font-semibold">{p.title} {p.firstName} {p.lastName}</span>
                    <span className="text-ink-muted">{p.type}{p.ticketNumber ? ` · ${p.ticketNumber}` : ""}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="Timeline">
            <ol className="space-y-2">
              {booking.events.map((e) => (
                <li key={e.id} className="flex items-start gap-3 text-sm">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-blue" />
                  <div>
                    <p className="font-semibold text-ink">{FLIGHT_BOOKING_STATUS_META[e.toStatus]?.label ?? e.toStatus}</p>
                    {e.message && <p className="text-xs text-ink-muted">{e.message}</p>}
                    <p className="text-xs text-ink-faint">{formatDate(e.createdAt, { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div>
          <Panel title="Fare">
            <Row k="Base fare" v={formatINR(booking.baseFare)} />
            <Row k="Taxes & fees" v={formatINR(booking.taxes)} />
            <div className="mt-2 flex justify-between border-t border-surface-border pt-2 text-base font-extrabold">
              <span>Total</span><span>{formatINR(booking.totalAmount)}</span>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
      <h2 className="mb-3 text-base font-bold">{title}</h2>
      {children}
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between py-1 text-sm"><span className="text-ink-muted">{k}</span><span className="font-semibold text-ink">{v}</span></div>;
}
