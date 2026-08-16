import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Plane, BedDouble, Car, MapPin, Clock, Check, X, Info } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Itinerary } from "@/components/package/itinerary";
import { PrintButton } from "@/components/ui/print-button";
import { getPackageBySlug } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Package itinerary" };

function arr(v: unknown): string[] {
  return Array.isArray(v) ? (v.filter((x) => typeof x === "string") as string[]) : [];
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 break-inside-avoid">
      <h2 className="flex items-center gap-2 border-l-4 border-brand-orange pl-3 text-lg font-extrabold text-brand-blue">
        {title}
      </h2>
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

export default async function ItineraryDocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pkg = await getPackageBySlug(slug);
  if (!pkg) notFound();
  const v = pkg.currentVersion!;
  const departureCities = arr(v.departureCities);
  const highlights = arr(v.highlights);
  const inclusions = arr(v.inclusions);
  const exclusions = arr(v.exclusions);
  const reviewRequired = v.pricingStatus === "PRICE_REVIEW_REQUIRED";

  const allow: [string, boolean][] = [
    ["Departure city", true], ["Travel date", v.allowDateChange], ["Hotel", v.allowHotelChange],
    ["Room", v.allowHotelChange], ["Flight", v.allowFlightChange], ["Activities", v.allowActivityChange],
    ["Transfers", v.allowTransferChange], ["Meals", v.allowMealChange], ["Add-ons", v.allowAddons],
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 print:max-w-none print:px-0 print:py-0">
      {/* Document header */}
      <div className="flex items-start justify-between gap-4 border-b-2 border-brand-blue pb-4">
        <div>
          <Logo size="lg" href={null} />
          <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-brand-orange">Holiday Package · Itinerary</p>
        </div>
        <div className="text-right text-xs text-ink-muted">
          <p className="font-mono font-semibold text-brand-navy">{pkg.code ?? pkg.slug}</p>
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
        {v.summary && <p className="mt-3 text-sm text-ink">{v.summary}</p>}
      </div>

      {/* Quick facts */}
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Fact label="Recommended for" value={v.bestFor} />
        <Fact label="Travel window" value={v.travelWindows} />
        <Fact label="Flight sector" value={v.flightSector} />
        <Fact label="Hotel category" value={v.roomCategory} />
        <Fact label="Meal plan" value={v.mealPlan} />
        <Fact label="Baggage" value={v.baggage} />
        <Fact label="Availability" value={v.availabilityStatus?.replace(/_/g, " ")} />
        <Fact label="Travellers" value={`${v.minTravellers}–${v.maxTravellers}`} />
      </div>

      {v.overview && <Section title="Overview"><p className="leading-relaxed text-ink-muted">{v.overview}</p></Section>}

      {highlights.length > 0 && (
        <Section title="Highlights">
          <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {highlights.map((h, i) => <li key={i} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {h}</li>)}
          </ul>
        </Section>
      )}

      <Section title="Departure & travel">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Fact label="Departure cities" value={departureCities.join(", ") || "On request"} />
          <Fact label="Travel window" value={v.travelWindows} />
        </div>
      </Section>

      <Section title="Flight">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-lg border border-surface-border p-3"><Plane className="h-4 w-4 text-brand-blue" /> Return economy flights included</div>
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

      <Section title="Transfers">
        <div className="flex items-center gap-2 rounded-lg border border-surface-border p-3"><Car className="h-4 w-4 text-brand-blue" /> Airport ⇄ hotel and sightseeing transfers as per itinerary</div>
      </Section>

      <Section title="Day-by-day itinerary">
        <Itinerary days={v.days} />
      </Section>

      <Section title="Pricing">
        {reviewRequired ? (
          <div className="rounded-lg border border-surface-border bg-surface-muted/60 p-3">
            <p className="font-semibold text-brand-navy">Price on request</p>
            <p className="mt-1 text-ink-muted">This package is priced against a verified market benchmark (target = benchmark + ₹550). Our team confirms the final price before booking.</p>
          </div>
        ) : (
          <p>Starting from a competitive, transparently-calculated price. Final price is confirmed on our servers before payment.</p>
        )}
      </Section>

      <Section title="Customization">
        <div className="flex flex-wrap gap-1.5">
          {allow.map(([label, on]) => (
            <span key={label} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${on ? "bg-[#E7F6EC] text-success" : "bg-surface-muted text-ink-faint"}`}>
              {on ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} {label}
            </span>
          ))}
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
        <span>This document is generated by ExpertzTrip for the package above. Inclusions, availability and pricing are confirmed at the time of booking. © {new Date().getFullYear()} ExpertzTrip.</span>
      </div>
    </div>
  );
}
