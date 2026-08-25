import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Plane, BedDouble, Car, MapPin, Clock, Check, X, Info, User } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Itinerary } from "@/components/package/itinerary";
import { PrintButton } from "@/components/ui/print-button";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/auth";
import { db } from "@/lib/db";
import { BOOKING_STATUS_META } from "@/lib/constants";
import { formatINR, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Trip itinerary", robots: { index: false } };

function arr(v: unknown): string[] {
  return Array.isArray(v) ? (v.filter((x) => typeof x === "string") as string[]) : [];
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 break-inside-avoid">
      <h2 className="flex items-center gap-2 border-l-4 border-brand-orange pl-3 text-lg font-extrabold text-brand-blue">{title}</h2>
      <div className="mt-3 text-sm text-ink">{children}</div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="rounded-lg border border-surface-border p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-0.5 font-semibold text-brand-navy">{value}</p>
    </div>
  );
}

/**
 * Booking-scoped branded itinerary (Phase 20). Personalized with the exact
 * package version the customer booked plus their reference, travel date,
 * traveller count and confirmed price — printable / save-as-PDF. Real data
 * only; nothing invented.
 */
export default async function TripItineraryPage({ params }: { params: Promise<{ id: string }> }) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/sign-in");

  const { id } = await params;
  const booking = await db.booking.findFirst({
    where: { id, customerId: customer.id }, // ownership enforced
    include: {
      package: { select: { name: true, code: true, slug: true, destination: { select: { name: true, country: true } } } },
      packageVersion: {
        include: {
          days: { orderBy: { dayNumber: "asc" }, include: { items: { orderBy: { sortOrder: "asc" } } } },
          images: { orderBy: { sortOrder: "asc" }, select: { url: true } },
        },
      },
      items: { orderBy: { sortOrder: "asc" } },
      travellers: true,
    },
  });
  if (!booking) notFound();

  const v = booking.packageVersion;
  const pkg = booking.package;
  const meta = BOOKING_STATUS_META[booking.status] ?? { label: booking.status };
  const highlights = arr(v.highlights);
  const inclusions = arr(v.inclusions);
  const exclusions = arr(v.exclusions);
  const leadTraveller = booking.travellers[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 print:max-w-none print:px-0 print:py-0">
      {/* Document header */}
      <div className="flex items-start justify-between gap-4 border-b-2 border-brand-blue pb-4">
        <div>
          <Logo size="lg" href={null} />
          <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-brand-orange">Your Holiday Itinerary</p>
        </div>
        <div className="text-right text-xs text-ink-muted">
          <p className="font-mono font-semibold text-brand-navy">{booking.reference}</p>
          <p>Generated {formatDate(new Date())}</p>
          <div className="mt-2"><PrintButton label="Download" /></div>
        </div>
      </div>

      {/* Title */}
      <div className="mt-5">
        <h1 className="text-2xl font-extrabold text-brand-navy sm:text-3xl">{pkg.name}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-brand-orange" /> {pkg.destination.name}, {pkg.destination.country}</span>
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {v.durationNights}N / {v.durationDays}D</span>
          {v.category && <span className="rounded-full bg-brand-blueLight px-2 py-0.5 text-xs font-semibold text-brand-blue">{v.category.replace(/_/g, " ")}</span>}
        </p>
      </div>

      {/* Booking summary — personalized */}
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Fact label="Booking ref" value={booking.reference} />
        <Fact label="Status" value={meta.label} />
        <Fact label="Travel date" value={booking.travelDate ? formatDate(booking.travelDate) : "To be confirmed"} />
        <Fact label="Travellers" value={`${booking.travellerCount}`} />
        {leadTraveller && (
          <div className="col-span-2 rounded-lg border border-surface-border p-3 sm:col-span-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Lead traveller</p>
            <p className="mt-0.5 flex items-center gap-1.5 font-semibold text-brand-navy"><User className="h-3.5 w-3.5 text-brand-blue" /> {leadTraveller.fullName}</p>
          </div>
        )}
      </div>

      {v.summary && <Section title="Overview"><p className="leading-relaxed text-ink-muted">{v.summary}</p></Section>}

      {highlights.length > 0 && (
        <Section title="Highlights">
          <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {highlights.map((h, i) => <li key={i} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {h}</li>)}
          </ul>
        </Section>
      )}

      <Section title="Flight & transfers">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-lg border border-surface-border p-3"><Plane className="h-4 w-4 text-brand-blue" /> Return economy flights included</div>
          <div className="flex items-center gap-2 rounded-lg border border-surface-border p-3"><Car className="h-4 w-4 text-brand-blue" /> Airport ⇄ hotel &amp; sightseeing transfers</div>
          <Fact label="Sector" value={v.flightSector} />
          <Fact label="Baggage" value={v.baggage} />
        </div>
      </Section>

      <Section title="Hotel">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="flex items-center gap-2 rounded-lg border border-surface-border p-3"><BedDouble className="h-4 w-4 text-brand-blue" /> {v.durationNights} nights</div>
          <Fact label="Room" value={v.roomCategory} />
          <Fact label="Meal plan" value={v.mealPlan} />
        </div>
      </Section>

      {v.days.length > 0 && (
        <Section title="Day-by-day itinerary">
          <Itinerary days={v.days} images={v.images.map((i) => i.url)} />
        </Section>
      )}

      <Section title="Price summary">
        <ul className="space-y-1.5">
          {booking.items.map((it) => (
            <li key={it.id} className="flex justify-between"><span className="text-ink-muted">{it.label}</span><span>{formatINR(it.amount)}</span></li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-surface-border pt-3 font-extrabold text-brand-navy">
          <span>Total paid</span><span>{formatINR(booking.totalAmount)}</span>
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {inclusions.length > 0 && (
          <Section title="Inclusions">
            <ul className="space-y-1.5">{inclusions.map((x, i) => <li key={i} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {x}</li>)}</ul>
          </Section>
        )}
        {exclusions.length > 0 && (
          <Section title="Exclusions">
            <ul className="space-y-1.5">{exclusions.map((x, i) => <li key={i} className="flex items-start gap-2 text-ink-muted"><X className="mt-0.5 h-4 w-4 shrink-0 text-danger" /> {x}</li>)}</ul>
          </Section>
        )}
      </div>

      {v.cancellationPolicy && <Section title="Cancellation policy"><p className="leading-relaxed text-ink-muted">{v.cancellationPolicy}</p></Section>}
      {v.importantInfo && <Section title="Important terms"><p className="leading-relaxed text-ink-muted">{v.importantInfo}</p></Section>}
      {v.visaInfo && <Section title="Visa information"><p className="text-ink-muted">{v.visaInfo}</p></Section>}
      {v.insuranceInfo && <Section title="Insurance"><p className="text-ink-muted">{v.insuranceInfo}</p></Section>}

      <div className="mt-8 flex items-start gap-2 rounded-lg bg-brand-blueLight/60 p-3 text-xs text-brand-blue break-inside-avoid">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>This itinerary is generated by ExpertzTrip for booking {booking.reference}. Your dedicated team confirms every component and shares tickets &amp; vouchers in your account. © {new Date().getFullYear()} ExpertzTrip.</span>
      </div>
    </div>
  );
}
