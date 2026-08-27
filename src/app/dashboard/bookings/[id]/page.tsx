import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Plane, Ticket, AlertTriangle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { getCurrentCustomer } from "@/lib/auth";
import { getFlightBooking } from "@/lib/services/flight-booking-service";
import { formatINR } from "@/lib/utils";
import { FLIGHT_STATUS } from "@/lib/flight-status";
import { CancelBooking } from "@/components/flights/cancel-booking";

export const metadata = { title: "Booking" };
export const dynamic = "force-dynamic";

type Pax = { firstName: string; lastName: string; type: string };

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login");
  const { id } = await params;

  let booking: Awaited<ReturnType<typeof getFlightBooking>> = null;
  try { booking = await getFlightBooking(customer.id, id); } catch { booking = null; }
  if (!booking) notFound();

  const s = FLIGHT_STATUS[booking.status] ?? { label: booking.status, tone: "text-ink" };
  const passengers = (booking.passengers as Pax[] | null) ?? [];
  const tickets = (booking.ticketNumbers as string[] | null) ?? [];
  const cancellable = ["TICKETED", "CONFIRMED", "PENDING_VERIFICATION"].includes(booking.status);

  return (
    <Container className="py-8 sm:py-10">
      <Link href="/dashboard/bookings" className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-brand-navy">
        <ArrowLeft className="h-4 w-4" /> My bookings
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-navy sm:text-3xl">{booking.origin} → {booking.destination}</h1>
          <p className="mt-1 text-ink-muted">{booking.reference} · {booking.departDate}</p>
        </div>
        <span className={`rounded-full bg-surface-muted px-3 py-1 text-sm font-bold uppercase tracking-wide ${s.tone}`}>{s.label}</span>
      </div>

      {booking.status === "FAILED" && booking.failureReason && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {booking.failureReason} — any held funds were released to your wallet.
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {/* Itinerary */}
          <div className="rounded-2xl border border-surface-border bg-white p-5">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blueLight text-sm font-extrabold text-brand-blue">{booking.airlineCode ?? "✈"}</span>
              <div className="flex-1">
                <p className="font-bold text-brand-navy">{booking.airline} · {booking.flightNumber}</p>
                <p className="text-sm text-ink-muted">{booking.cabin.replace("_", " ")} · {booking.stops === 0 ? "Non-stop" : `${booking.stops} stop`}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div><p className="text-2xl font-extrabold text-brand-navy">{booking.departTime}</p><p className="text-xs text-ink-muted">{booking.origin}</p></div>
              <div className="flex flex-1 items-center gap-2 px-4 text-ink-faint"><span className="h-px flex-1 bg-surface-border" /><Plane className="h-4 w-4" /><span className="h-px flex-1 bg-surface-border" /></div>
              <div className="text-right"><p className="text-2xl font-extrabold text-brand-navy">{booking.arriveTime}</p><p className="text-xs text-ink-muted">{booking.destination}</p></div>
            </div>
          </div>

          {/* Passengers + tickets */}
          <div className="rounded-2xl border border-surface-border bg-white p-5">
            <h2 className="flex items-center gap-2 font-bold text-brand-navy"><Ticket className="h-4 w-4 text-brand-blue" /> Travellers &amp; tickets</h2>
            <div className="mt-3 space-y-2">
              {passengers.length === 0 ? <p className="text-sm text-ink-muted">—</p> : passengers.map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-surface-border px-3.5 py-2.5">
                  <span className="text-sm font-semibold text-brand-navy">{p.firstName} {p.lastName} <span className="ml-1 text-xs font-normal text-ink-faint">{p.type}</span></span>
                  <span className="text-xs font-mono text-ink-muted">{tickets[i] ?? (booking.status === "TICKETED" ? "—" : "Not issued")}</span>
                </div>
              ))}
            </div>
            {booking.status !== "TICKETED" && (
              <p className="mt-3 text-xs text-ink-faint">Ticket numbers appear only once the airline confirms issuance — never before.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-surface-border bg-white p-5">
            <h2 className="font-bold text-brand-navy">Booking</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink-muted">PNR</dt><dd className="font-bold text-brand-navy">{booking.pnr ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Travellers</dt><dd className="font-semibold">{booking.paxCount}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Base fare</dt><dd>{formatINR(booking.baseFare * booking.paxCount)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Taxes &amp; fees</dt><dd>{formatINR(booking.taxes * booking.paxCount)}</dd></div>
              <div className="flex justify-between border-t border-surface-border pt-2"><dt className="font-bold text-brand-navy">Wallet debit</dt><dd className="font-extrabold text-brand-navy">{formatINR(booking.amount)}</dd></div>
            </dl>
          </div>

          {cancellable && (
            <div className="rounded-2xl border border-surface-border bg-white p-5">
              <h2 className="font-bold text-brand-navy">Manage</h2>
              <div className="mt-3"><CancelBooking id={booking.id} /></div>
            </div>
          )}

          <Link href="/dashboard/flights" className="flex items-center justify-center gap-1 rounded-2xl border border-surface-border bg-white px-4 py-3 text-sm font-semibold text-brand-blue hover:border-brand-blue">
            Book another flight <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Container>
  );
}
