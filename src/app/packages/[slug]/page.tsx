import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Plane, BedDouble, Ticket, Utensils, Clock, MapPin, Ship, CalendarCheck,
  Check, X, Info, ShieldCheck, Download, FileText, Star, Users, Luggage, Sparkles, ChevronDown,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { Accordion } from "@/components/ui/accordion";
import { SmartImage } from "@/components/ui/smart-image";
import { Itinerary } from "@/components/package/itinerary";
import { CustomizationPanel, type OptionVM } from "@/components/package/customization-panel";
import { BookNowButton } from "@/components/package/booking-wizard";
import { EnquireButton } from "@/components/package/enquire-button";
import { PackageCard } from "@/components/package/package-card";
import { RecordView, RecentlyViewedRail } from "@/components/package/recently-viewed";
import { BreadcrumbJsonLd } from "@/components/layout/structured-data";
import { getPackageBySlug, getSimilarPackages } from "@/lib/queries";
import { getCurrentCustomer } from "@/lib/auth";
import { getSiteSettings, promoIsActive } from "@/lib/site-settings";
import { TIER_LABEL } from "@/components/package/package-card";
import { formatINR, formatDate, getSiteUrl } from "@/lib/utils";

export const revalidate = 300;

/**
 * No `loading.tsx` for this route on purpose.
 *
 * A loading file wraps the page in a Suspense boundary, which flushes the
 * response shell — and therefore commits HTTP 200 — before the page can call
 * `notFound()`. That turned an unpublished or unknown package into a soft 404:
 * the right content, but a 200 status that search engines would index.
 * Rendering straight through keeps the status code honest.
 */

const AVAILABILITY_META: Record<string, { label: string; tone: "success" | "warning" | "info" | "danger" }> = {
  AVAILABLE: { label: "Available", tone: "success" },
  LIMITED: { label: "Limited availability", tone: "warning" },
  ON_REQUEST: { label: "Confirmed on request", tone: "info" },
  UNAVAILABLE: { label: "Currently unavailable", tone: "danger" },
};

/** schema.org availability that matches what we actually claim on the page. */
const SCHEMA_AVAILABILITY: Record<string, string> = {
  AVAILABLE: "https://schema.org/InStock",
  LIMITED: "https://schema.org/LimitedAvailability",
  ON_REQUEST: "https://schema.org/PreOrder",
  UNAVAILABLE: "https://schema.org/OutOfStock",
};

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? (v.filter((x) => typeof x === "string") as string[]) : [];
}

function quickFactsOn(kind: string, kinds: Set<string>, cats: Set<string>): boolean {
  return kinds.has(kind) || cats.has(kind);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [pkg, settings] = await Promise.all([getPackageBySlug(slug), getSiteSettings()]);
  if (!pkg) return { title: "Package not found", robots: { index: false, follow: false } };
  const v = pkg.currentVersion!;
  const description =
    v.seoDescription ??
    v.summary ??
    `${pkg.name} — a ${v.durationNights}N / ${v.durationDays}D Andaman holiday covering ${pkg.destination.name}, with accommodation, sightseeing and island transfers arranged by ${settings.brandName}.`;
  const image = v.images[0]?.url;
  const canonical = `/packages/${slug}`;
  return {
    title: v.seoTitle ?? pkg.name,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title: `${pkg.name} · ${settings.brandName}`,
      description,
      images: image ? [{ url: image, alt: pkg.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${pkg.name} · ${settings.brandName}`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PackageDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [pkg, settings] = await Promise.all([getPackageBySlug(slug), getSiteSettings()]);
  if (!pkg) notFound();

  const v = pkg.currentVersion!;
  const promoLive = promoIsActive(settings);
  const tierLabel = pkg.theme ? TIER_LABEL[pkg.theme] ?? null : null;
  const reviewRequired = v.pricingStatus === "PRICE_REVIEW_REQUIRED";
  // Enquiry-only OR price-on-request → the CTA is "Enquire", never online booking.
  const enquireOnly = reviewRequired || pkg.enquiryOnly;
  const images = v.images;
  const highlights = asStringArray(v.highlights);
  const inclusions = asStringArray(v.inclusions);
  const exclusions = asStringArray(v.exclusions);

  const kinds = new Set(v.days.flatMap((d) => d.items.map((i) => i.kind)));
  const cats = new Set(v.options.map((o) => o.category));

  const optionsVM: OptionVM[] = v.options.map((o) => ({
    id: o.id, category: o.category, groupKey: o.groupKey, label: o.label,
    description: o.description, priceDelta: o.priceDelta, perPerson: o.perPerson, isDefault: o.isDefault,
  }));
  const departuresVM = v.departures.map((d) => ({ id: d.id, date: d.date.toISOString(), priceDelta: d.priceDelta }));
  const departureCities = asStringArray(v.departureCities);
  const wizardDepartures = v.departures.map((d) => ({ date: d.date.toISOString(), seatsLeft: d.seatsLeft }));

  // Real, data-backed only — never fabricated.
  const reviews = pkg.reviews ?? [];
  const reviewCount = reviews.length;
  const avgRating = reviewCount ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10 : null;
  const bestFor = (v.bestFor ?? "").split(",").map((part) => part.trim()).filter(Boolean);
  const availability = AVAILABILITY_META[v.availabilityStatus] ?? null;
  const similar = await getSimilarPackages(pkg.destinationId, pkg.theme, pkg.id, 3);

  // Prefill the enquiry form for signed-in customers — never re-ask their details.
  const customer = await getCurrentCustomer();
  const enquiryDefaults = customer
    ? { defaultName: customer.fullName, defaultEmail: customer.email, defaultPhone: customer.mobile }
    : {};

  // "At a glance" reads only from saved data. Where a package has not been
  // given a value, we say so rather than implying something is included.
  const inclusionText = inclusions.join(" · ").toLowerCase();
  const glance = [
    { icon: Clock, label: "Duration", value: `${v.durationNights}N / ${v.durationDays}D` },
    { icon: BedDouble, label: "Accommodation", value: v.roomCategory || `${v.durationNights} nights` },
    { icon: Utensils, label: "Meals", value: v.mealPlan || (quickFactsOn("MEAL", kinds, cats) ? "As per itinerary" : "Not specified") },
    { icon: Ticket, label: "Sightseeing", value: quickFactsOn("ACTIVITY", kinds, cats) ? "As per itinerary" : "Not specified" },
    {
      icon: Ship,
      label: "Island transfers",
      value: /ferry|inter-island/.test(inclusionText) ? "Included" : "Not included",
    },
    { icon: Users, label: "Group size", value: `Minimum ${v.minTravellers} ${v.minTravellers === 1 ? "traveller" : "travellers"}` },
    ...(v.flightSector ? [{ icon: Plane, label: "Flights", value: v.flightSector }] : []),
    ...(v.baggage ? [{ icon: Luggage, label: "Baggage", value: v.baggage }] : []),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pkg.name,
    description: v.summary,
    image: images.map((i) => i.url),
    brand: { "@type": "Brand", name: settings.brandName },
    ...(avgRating !== null && reviewCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: avgRating, reviewCount } }
      : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: v.currency,
      price: v.basePrice,
      url: `${getSiteUrl()}/packages/${pkg.slug}`,
      // Mirrors what the page claims — never "in stock" for an on-request trip.
      availability: SCHEMA_AVAILABILITY[v.availabilityStatus] ?? "https://schema.org/PreOrder",
      ...(promoLive ? { priceValidUntil: settings.promoValidTo } : {}),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BreadcrumbJsonLd
        items={[
          { label: "Home", href: "/" },
          { label: "Holiday packages", href: "/packages" },
          { label: pkg.name, href: `/packages/${pkg.slug}` },
        ]}
      />
      <Container className="py-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Packages", href: "/packages" },
            { label: pkg.destination.name, href: `/destinations/${pkg.destination.slug}` },
            { label: pkg.name },
          ]}
        />

        {/* Gallery */}
        <div className="mt-4 grid grid-cols-4 gap-2.5 overflow-hidden rounded-3xl sm:h-[480px]">
          <div className="relative col-span-4 aspect-[16/10] overflow-hidden rounded-3xl sm:col-span-2 sm:aspect-auto sm:row-span-2 sm:rounded-2xl">
            <SmartImage src={images[0]?.url} alt={pkg.name} sizes="(max-width:640px) 100vw, 50vw" priority className="h-full" imgClassName="transition-transform duration-700 hover:scale-105" />
          </div>
          {images.slice(1, 5).map((im, i) => (
            <div key={im.id} className="relative hidden overflow-hidden rounded-2xl sm:block">
              <SmartImage src={im.url} alt={`${pkg.name} — photo ${i + 2}`} sizes="25vw" imgClassName="transition-transform duration-700 hover:scale-105" />
            </div>
          ))}
          {images.length < 3 && (
            <div className="relative hidden rounded-2xl bg-gradient-to-br from-brand-blueLight to-brand-orangeLight sm:block" aria-hidden />
          )}
        </div>

        {/* Header */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
              <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 text-brand-orange" /> {pkg.destination.name}, {pkg.destination.country}</span>
              <span className="text-ink-faint">·</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> {v.durationNights}N / {v.durationDays}D</span>
              {tierLabel && (
                <Badge tone="brand"><Sparkles className="h-3 w-3" /> {tierLabel}</Badge>
              )}
              {v.minTravellers > 1 && <Badge tone="warning"><Users className="h-3 w-3" /> Min {v.minTravellers} pax</Badge>}
              {availability && (availability.tone === "warning" || availability.tone === "info") && (
                <Badge tone={availability.tone}>{availability.label}</Badge>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{pkg.name}</h1>

            {pkg.isChecked && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-success/25 bg-success/[0.06] px-3 py-1.5">
                <ShieldCheck className="h-4 w-4 text-success" />
                <span className="text-sm font-semibold text-success">Reviewed by our team</span>
                <span className="hidden text-xs text-ink-muted sm:inline">· inclusions, itinerary and pricing checked</span>
              </div>
            )}

            {/* Real rating — only when genuine published reviews exist */}
            {avgRating !== null && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="flex items-center gap-0.5 text-brand-orange">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={i < Math.round(avgRating) ? "h-4 w-4 fill-current" : "h-4 w-4 text-surface-border"} />
                  ))}
                </span>
                <span className="font-bold text-brand-navy">{avgRating.toFixed(1)}</span>
                <span className="text-ink-muted">· {reviewCount} review{reviewCount > 1 ? "s" : ""}</span>
              </div>
            )}

            {/* Best for — only when the package specifies it */}
            {bestFor.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink-muted"><Users className="h-4 w-4 text-brand-blue" /> Best for:</span>
                {bestFor.map((b) => (
                  <span key={b} className="rounded-full bg-brand-blueLight px-2.5 py-0.5 text-xs font-semibold text-brand-blue">{b}</span>
                ))}
              </div>
            )}

            {v.summary && <p className="mt-3 max-w-2xl text-ink-muted">{v.summary}</p>}
          </div>
          <div className="shrink-0 rounded-xl bg-surface-muted px-4 py-3 sm:text-right">
            {reviewRequired ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Pricing</p>
                <p className="text-xl font-extrabold text-brand-navy">Price on request</p>
                <p className="text-xs text-ink-muted">confirmed by our team</p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Starting from</p>
                <p className="tabular text-3xl font-extrabold text-brand-navy">{formatINR(v.basePrice)}</p>
                <p className="text-xs text-ink-muted">
                  {v.perPersonPricing ? "per person · twin sharing" : "for the whole group"}
                  {v.minTravellers > 1 ? ` · min ${v.minTravellers} pax` : ""}
                </p>
                {v.pricingStatus === "INDICATIVE" && (
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-brand-orangeDark">
                    Indicative rate
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* At a glance */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {glance.map((g) => (
            <div key={g.label} className="rounded-xl border border-surface-border bg-white p-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blueLight text-brand-blue"><g.icon className="h-4 w-4" /></span>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{g.label}</p>
              <p className="text-sm font-semibold text-brand-navy">{g.value}</p>
            </div>
          ))}
        </div>

        {/* Validity + pricing basis — stated before anyone enquires, never after. */}
        <div className="mt-4 flex flex-col gap-2.5 rounded-xl border border-surface-border bg-surface-muted p-4 text-sm sm:flex-row sm:items-start sm:gap-5">
          {promoLive ? (
            <p className="flex items-start gap-2 font-semibold text-brand-orangeDark">
              <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0" />
              Valid for travel {formatDate(settings.promoValidFrom)} – {formatDate(settings.promoValidTo)}
            </p>
          ) : (
            <p className="flex items-start gap-2 font-semibold text-ink-muted">
              <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0" />
              This promotional window has closed — ask us for current rates on your dates.
            </p>
          )}
          <p className="flex-1 leading-relaxed text-ink-muted">{settings.priceDisclaimer}</p>
        </div>

        {/* Not sure yet? Talk to an expert — high-intent enquiry, right on the package page */}
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-brand-blue/20 bg-brand-blueLight/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-brand-navy">Not sure yet?</p>
            <p className="text-sm text-ink-muted">Talk to our team about dates, hotels, upgrades and anything special you need.</p>
          </div>
          <div className="shrink-0 sm:w-56">
            <EnquireButton packageName={pkg.name} packageSlug={pkg.slug} {...enquiryDefaults} label="Talk to an expert" />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <a
            href={`/packages/${pkg.slug}/itinerary.pdf`}
            download
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-brand-blue/30 bg-brand-blueLight px-4 text-sm font-bold text-brand-blueDark transition-colors hover:bg-brand-blue hover:text-white"
          >
            <Download className="h-4 w-4" /> Download itinerary (PDF)
          </a>
          <Link
            href={`/packages/${pkg.slug}/itinerary`}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-surface-border px-4 text-sm font-bold text-ink transition-colors hover:border-brand-blue hover:text-brand-blue"
          >
            <FileText className="h-4 w-4" /> View the full itinerary
          </Link>
        </div>

        {/* Body */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left content */}
          <div className="space-y-10 lg:col-span-2">
            {v.overview && (
              <section>
                <h2 className="text-xl font-bold">Overview</h2>
                <p className="mt-3 leading-relaxed text-ink-muted">{v.overview}</p>
              </section>
            )}

            {highlights.length > 0 && (
              <section>
                <h2 className="text-xl font-bold">Highlights</h2>
                <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {h}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section id="itinerary">
              <h2 className="text-xl font-bold">Day-by-day itinerary</h2>
              <p className="mt-1 text-sm text-ink-muted">{v.days.length} days across Port Blair, Havelock and Neil.</p>
              <div className="mt-5">
                <Itinerary days={v.days} images={images.map((i) => i.url)} />
              </div>
            </section>

            {/* Hotel & flight details — real data only */}
            {(v.roomCategory || v.mealPlan || v.flightSector || v.baggage) && (
              <section>
                <h2 className="text-xl font-bold">Hotel &amp; flight details</h2>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {v.roomCategory && (
                    <div className="flex items-start gap-3 rounded-xl border border-surface-border p-4">
                      <BedDouble className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />
                      <div><p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Room</p><p className="font-semibold text-brand-navy">{v.roomCategory}</p></div>
                    </div>
                  )}
                  {v.mealPlan && (
                    <div className="flex items-start gap-3 rounded-xl border border-surface-border p-4">
                      <Utensils className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />
                      <div><p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Meal plan</p><p className="font-semibold text-brand-navy">{v.mealPlan}</p></div>
                    </div>
                  )}
                  {v.flightSector && (
                    <div className="flex items-start gap-3 rounded-xl border border-surface-border p-4">
                      <Plane className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />
                      <div><p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Flight sector</p><p className="font-semibold text-brand-navy">{v.flightSector}</p></div>
                    </div>
                  )}
                  {v.baggage && (
                    <div className="flex items-start gap-3 rounded-xl border border-surface-border p-4">
                      <Luggage className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />
                      <div><p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Baggage</p><p className="font-semibold text-brand-navy">{v.baggage}</p></div>
                    </div>
                  )}
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {inclusions.length > 0 && (
                <section className="rounded-2xl border border-success/20 bg-success/[0.04] p-5">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-brand-navy">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/15 text-success"><Check className="h-4 w-4" /></span>
                    {reviewRequired ? "What's included" : "What your price includes"}
                  </h2>
                  <ul className="mt-4 space-y-2.5">
                    {inclusions.map((inc, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-ink">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {inc}
                      </li>
                    ))}
                    {!reviewRequired && (
                      <li className="flex items-start gap-2.5 text-sm text-ink">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> Applicable taxes &amp; fees
                      </li>
                    )}
                  </ul>
                </section>
              )}
              {exclusions.length > 0 && (
                <section className="rounded-2xl border border-surface-border bg-surface-muted/40 p-5">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-brand-navy">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-danger/10 text-danger"><X className="h-4 w-4" /></span>
                    Not included
                  </h2>
                  <ul className="mt-4 space-y-2.5">
                    {exclusions.map((exc, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-ink-muted">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-danger/70" /> {exc}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {v.cancellationPolicy && (
              <section>
                <h2 className="text-lg font-bold">Cancellation policy</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{v.cancellationPolicy}</p>
              </section>
            )}

            {v.importantInfo && (
              <section className="rounded-xl border border-surface-border bg-surface-muted/60 p-5">
                <h2 className="flex items-center gap-2 text-base font-bold"><Info className="h-4 w-4 text-brand-blue" /> Important information</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{v.importantInfo}</p>
              </section>
            )}

            {/* Guest reviews — only real, published reviews */}
            {reviewCount > 0 && (
              <section>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">Guest reviews</h2>
                  {avgRating !== null && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-orangeLight px-2.5 py-1 text-sm font-bold text-brand-orangeDark">
                      <Star className="h-3.5 w-3.5 fill-current" /> {avgRating.toFixed(1)} · {reviewCount}
                    </span>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {reviews.slice(0, 4).map((r) => (
                    <div key={r.id} className="rounded-2xl border border-surface-border bg-white p-5">
                      <div className="flex gap-0.5 text-brand-orange">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={i < r.rating ? "h-4 w-4 fill-current" : "h-4 w-4 text-surface-border"} />
                        ))}
                      </div>
                      {r.title && <h3 className="mt-2 font-semibold text-brand-navy">{r.title}</h3>}
                      {r.body && <p className="mt-1 text-sm text-ink-muted">{r.body}</p>}
                      <p className="mt-3 text-sm font-medium text-brand-navy">{r.customer.fullName ?? "Verified traveller"}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {pkg.faqs.length > 0 && (
              <section>
                <h2 className="text-xl font-bold">Frequently asked questions</h2>
                <div className="mt-4">
                  <Accordion items={pkg.faqs.map((f) => ({ question: f.question, answer: f.answer }))} />
                </div>
              </section>
            )}
          </div>

          {/* Right sticky panel — Book Now + Enquire (dual CTA) */}
          <div className="lg:col-span-1" id="customize">
            <div className="lg:sticky lg:top-20">
              <Card>
                <CardBody>
                  {reviewRequired ? (
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-lg font-bold">Get your price</h2>
                        <Badge tone="warning">On request</Badge>
                      </div>
                      <p className="text-sm text-ink-muted">
                        This holiday is priced by our team before booking. Share your dates and group size and we will come back with an itinerary and a written quotation.
                      </p>
                      <ul className="mt-4 space-y-2 text-sm text-ink">
                        <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-blue" /> Fully customizable itinerary</li>
                        <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-blue" /> Written quotation before you pay anything</li>
                        <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-blue" /> Expert support, no obligation</li>
                      </ul>
                      <div className="mt-5">
                        <EnquireButton packageName={pkg.name} packageSlug={pkg.slug} {...enquiryDefaults} variant="solid" size="lg" label="Enquire now" className="!bg-brand-orange hover:!bg-brand-orangeDark" />
                      </div>
                      <p className="mt-2 text-center text-xs text-ink-muted">No login needed — talk to us directly.</p>
                    </div>
                  ) : pkg.enquiryOnly ? (
                    <div>
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-ink-faint">Starting from</p>
                          <p className="text-2xl font-extrabold text-brand-navy">
                            {formatINR(v.basePrice)} <span className="text-sm font-normal text-ink-muted">/ person</span>
                          </p>
                        </div>
                        <Badge tone="brand">Enquire</Badge>
                      </div>
                      <p className="mb-4 text-xs leading-relaxed text-ink-muted">Tell us your dates and group size. We confirm the hotels and ferries by hand, then send you an itinerary and a written quotation — an enquiry books nothing.</p>
                      <EnquireButton packageName={pkg.name} packageSlug={pkg.slug} {...enquiryDefaults} variant="solid" size="lg" label="Enquire now" className="!bg-brand-orange hover:!bg-brand-orangeDark" />
                      <ul className="mt-4 space-y-2 text-sm text-ink">
                        <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-blue" /> Fully customizable itinerary</li>
                        <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-blue" /> Final price confirmed in writing</li>
                        <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-blue" /> Expert support, no obligation</li>
                      </ul>
                    </div>
                  ) : (
                    <>
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-ink-faint">Starting from</p>
                          <p className="text-2xl font-extrabold text-brand-navy">
                            {formatINR(v.basePrice)} <span className="text-sm font-normal text-ink-muted">/ person</span>
                          </p>
                        </div>
                        <Badge tone="info"><ShieldCheck className="h-3 w-3" /> Live price</Badge>
                      </div>
                      <p className="mb-4 text-xs text-ink-muted">Pick your city, dates &amp; travellers in a few taps.</p>
                      <BookNowButton
                        packageSlug={pkg.slug}
                        packageName={pkg.name}
                        versionId={v.id}
                        basePrice={v.basePrice}
                        minTravellers={v.minTravellers}
                        maxTravellers={v.maxTravellers}
                        departureCities={departureCities}
                        departures={wizardDepartures}
                        nights={v.durationNights}
                        days={v.durationDays}
                      />
                      <details className="group mt-4 border-t border-surface-border pt-4">
                        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-brand-navy">
                          Customise &amp; get a live price
                          <ChevronDown className="h-4 w-4 text-ink-muted transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="mt-4">
                          <CustomizationPanel
                            versionId={v.id}
                            packageSlug={pkg.slug}
                            basePrice={v.basePrice}
                            currency={v.currency}
                            minTravellers={v.minTravellers}
                            maxTravellers={v.maxTravellers}
                            allow={{
                              hotel: v.allowHotelChange, flight: v.allowFlightChange,
                              transfer: v.allowTransferChange, meal: v.allowMealChange,
                              activity: v.allowActivityChange, addons: v.allowAddons, date: v.allowDateChange,
                            }}
                            options={optionsVM}
                            departures={departuresVM}
                          />
                        </div>
                      </details>
                      <div className="mt-4 border-t border-surface-border pt-4">
                        <p className="mb-2 text-center text-xs text-ink-muted">Prefer to speak to an expert first?</p>
                        <EnquireButton packageName={pkg.name} packageSlug={pkg.slug} {...enquiryDefaults} label="Talk to our team" />
                      </div>
                    </>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        </div>

        {/* Similar holidays */}
        {similar.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-bold sm:text-2xl">Other Andaman packages</h2>
            <p className="mt-1 text-sm text-ink-muted">Other Andaman itineraries from our team.</p>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((p) => <PackageCard key={p.id} pkg={p} />)}
            </div>
          </section>
        )}

        <RecordView slug={pkg.slug} />
        <RecentlyViewedRail exclude={pkg.slug} />
      </Container>

      {/* Mobile sticky CTA — fluid so it never overflows a 320px screen. */}
      <div className="sticky bottom-0 z-30 border-t border-surface-border bg-white/95 p-3 shadow-sticky backdrop-blur lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="min-w-0 shrink">
            {reviewRequired ? (
              <p className="text-sm font-extrabold leading-tight text-brand-navy">On request</p>
            ) : (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">From</p>
                <p className="tabular whitespace-nowrap text-base font-extrabold leading-tight text-brand-navy">
                  {formatINR(v.basePrice)}
                  <span className="text-[10px] font-semibold text-ink-muted">/pp</span>
                </p>
              </>
            )}
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            {enquireOnly ? (
              <div className="min-w-0 flex-1">
                <EnquireButton
                  packageName={pkg.name}
                  packageSlug={pkg.slug}
                  {...enquiryDefaults}
                  variant="solid"
                  label={reviewRequired ? "Get a quote" : "Enquire now"}
                  className="!h-11 !bg-brand-orange text-sm hover:!bg-brand-orangeDark"
                />
              </div>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <EnquireButton packageName={pkg.name} packageSlug={pkg.slug} {...enquiryDefaults} label="Enquire" className="!h-11 text-sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <BookNowButton
                    packageSlug={pkg.slug}
                    packageName={pkg.name}
                    versionId={v.id}
                    basePrice={v.basePrice}
                    minTravellers={v.minTravellers}
                    maxTravellers={v.maxTravellers}
                    departureCities={departureCities}
                    departures={wizardDepartures}
                    nights={v.durationNights}
                    days={v.durationDays}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
