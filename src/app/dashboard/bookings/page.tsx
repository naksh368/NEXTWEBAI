import Link from "next/link";
import { redirect } from "next/navigation";
import { Plane, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { getCurrentCustomer } from "@/lib/auth";
import { listFlightBookings } from "@/lib/services/flight-booking-service";
import { formatINR } from "@/lib/utils";
import { FLIGHT_STATUS } from "@/lib/flight-status";

export const metadata = { title: "My Bookings" };
export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login");

  let bookings: Awaited<ReturnType<typeof listFlightBookings>> = [];
  try { bookings = await listFlightBookings(customer.id, 50); } catch { /* not migrated */ }

  return (
    <Container className="py-8 sm:py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-navy sm:text-3xl">My bookings</h1>
          <p className="mt-1.5 text-ink-muted">Flight bookings, PNRs, tickets and status.</p>
        </div>
        <Link href="/dashboard/flights" className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-blue px-4 text-sm font-bold text-white hover:bg-brand-blueDark">
          <Plane className="h-4 w-4" /> Search flights
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {bookings.length === 0 ? (
          <div className="rounded-2xl border border-surface-border bg-white px-5 py-12 text-center">
            <p className="text-ink-muted">No bookings yet.</p>
            <Link href="/dashboard/flights" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue">Search flights <ArrowRight className="h-4 w-4" /></Link>
          </div>
        ) : bookings.map((b) => {
          const s = FLIGHT_STATUS[b.status] ?? { label: b.status, tone: "text-ink" };
          return (
            <Link key={b.id} href={`/dashboard/bookings/${b.id}`} className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-white p-4 transition-shadow hover:shadow-card sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blueLight text-xs font-extrabold text-brand-blue">{b.airlineCode ?? "✈"}</span>
                <div>
                  <p className="font-bold text-brand-navy">{b.origin} <ArrowRight className="inline h-3.5 w-3.5 text-ink-faint" /> {b.destination}</p>
                  <p className="text-xs text-ink-muted">{b.reference} · {b.departDate} · {b.airline} {b.flightNumber} · {b.paxCount} pax</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <span className={`text-xs font-bold uppercase tracking-wide ${s.tone}`}>{s.label}</span>
                <span className="font-extrabold text-brand-navy">{formatINR(b.amount)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </Container>
  );
}
