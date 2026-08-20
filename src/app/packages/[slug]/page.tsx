import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Plane, BedDouble, Car, Ticket, Utensils, Clock, MapPin,
  Check, X, Info, ShieldCheck, Download,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { Accordion } from "@/components/ui/accordion";
import { SmartImage } from "@/components/ui/smart-image";
import { Itinerary } from "@/components/package/itinerary";
import { CustomizationPanel, type OptionVM } from "@/components/package/customization-panel";
import { EnquireButton } from "@/components/package/enquire-button";
import { getPackageBySlug } from "@/lib/queries";
import { formatINR } from "@/lib/utils";

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? (v.filter((x) => typeof x === "string") as string[]) : [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getPackageBySlug(slug);
  if (!pkg) return { title: "Package not found" };
  const v = pkg.currentVersion!;
  return {
    title: pkg.name,
    description: v.summary ?? undefined,
    openGraph: {
      title: pkg.name,
      description: v.summary ?? undefined,
      images: v.images[0]?.url ? [v.images[0].url] : undefined,
    },
  };
}

export default async function PackageDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pkg = await getPackageBySlug(slug);
  if (!pkg) notFound();

  const v = pkg.currentVersion!;
  const reviewRequired = v.pricingStatus === "PRICE_REVIEW_REQUIRED";
  const images = v.images;
  const highlights = asStringArray(v.highlights);
  const inclusions = asStringArray(v.inclusions);
  const exclusions = asStringArray(v.exclusions);

  const kinds = new Set(v.days.flatMap((d) => d.items.map((i) => i.kind)));
  const cats = new Set(v.options.map((o) => o.category));
  const quickFacts = [
    { icon: Plane, label: "Return flights", on: kinds.has("FLIGHT") || cats.has("FLIGHT") },
    { icon: BedDouble, label: `${v.durationNights} nights hotel`, on: true },
    { icon: Car, label: "Airport transfers", on: kinds.has("TRANSFER") || cats.has("TRANSFER") },
    { icon: Ticket, label: "Activities", on: kinds.has("ACTIVITY") || cats.has("ACTIVITY") },
    { icon: Utensils, label: "Daily breakfast", on: kinds.has("MEAL") || cats.has("MEAL") },
  ];

  const optionsVM: OptionVM[] = v.options.map((o) => ({
    id: o.id, category: o.category, groupKey: o.groupKey, label: o.label,
    description: o.description, priceDelta: o.priceDelta, perPerson: o.perPerson, isDefault: o.isDefault,
  }));
  const departuresVM = v.departures.map((d) => ({ id: d.id, date: d.date.toISOString(), priceDelta: d.priceDelta }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pkg.name,
    description: v.summary,
    image: images.map((i) => i.url),
    brand: { "@type": "Brand", name: "ExpertzTrip" },
    offers: {
      "@type": "Offer",
      priceCurrency: v.currency,
      price: v.basePrice,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
        <div className="mt-4 grid grid-cols-4 gap-2 overflow-hidden rounded-2xl sm:h-[420px]">
          <div className="relative col-span-4 aspect-[16/10] sm:col-span-2 sm:aspect-auto sm:row-span-2">
            <SmartImage src={images[0]?.url} alt={pkg.name} sizes="(max-width:640px) 100vw, 50vw" priority className="h-full rounded-2xl sm:rounded-none" />
          </div>
          {images.slice(1, 5).map((im, i) => (
            <div key={im.id} className={`relative hidden aspect-[4/3] sm:block ${i >= 2 ? "" : ""}`}>
              <SmartImage src={im.url} alt={`${pkg.name} ${i + 2}`} sizes="25vw" />
            </div>
          ))}
          {images.length < 3 && (
            <div className="relative hidden bg-gradient-to-br from-brand-blueLight to-brand-orangeLight sm:block" aria-hidden />
          )}
        </div>

        {/* Header */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-ink-muted">
              <MapPin className="h-4 w-4 text-brand-orange" /> {pkg.destination.name}, {pkg.destination.country}
              <span className="text-ink-faint">·</span>
              <Clock className="h-4 w-4" /> {v.durationNights}N / {v.durationDays}D
            </div>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{pkg.name}</h1>
            {v.summary && <p className="mt-2 max-w-2xl text-ink-muted">{v.summary}</p>}
          </div>
          <div className="shrink-0 rounded-xl bg-surface-muted px-4 py-3 text-right">
            {reviewRequired ? (
              <>
                <p className="text-xs uppercase tracking-wide text-ink-faint">Pricing</p>
                <p className="text-xl font-bold text-brand-navy">Price on request</p>
                <p className="text-xs text-ink-muted">confirmed by our team</p>
              </>
            ) : (
              <>
                <p className="text-xs uppercase tracking-wide text-ink-faint">Starting from</p>
                <p className="text-2xl font-bold text-brand-navy">{formatINR(v.basePrice)}</p>
                <p className="text-xs text-ink-muted">per person</p>
              </>
            )}
          </div>
        </div>

        {/* Quick facts */}
        <div className="mt-5 flex flex-wrap gap-2">
          {quickFacts.filter((f) => f.on).map((f) => (
            <span key={f.label} className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-white px-3 py-1.5 text-sm font-medium text-ink">
              <f.icon className="h-4 w-4 text-brand-blue" /> {f.label}
            </span>
          ))}
        </div>
        <div className="mt-3">
          <Link href={`/packages/${pkg.slug}/itinerary`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:underline">
            <Download className="h-4 w-4" /> View &amp; download full itinerary
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
              <p className="mt-1 text-sm text-ink-muted">{v.days.length} days of curated experiences.</p>
              <div className="mt-5">
                <Itinerary days={v.days} />
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {inclusions.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold">What&apos;s included</h2>
                  <ul className="mt-3 space-y-2">
                    {inclusions.map((inc, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-ink">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {inc}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {exclusions.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold">Not included</h2>
                  <ul className="mt-3 space-y-2">
                    {exclusions.map((exc, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-ink-muted">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-danger" /> {exc}
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

            {pkg.faqs.length > 0 && (
              <section>
                <h2 className="text-xl font-bold">Frequently asked questions</h2>
                <div className="mt-4">
                  <Accordion items={pkg.faqs.map((f) => ({ question: f.question, answer: f.answer }))} />
                </div>
              </section>
            )}
          </div>

          {/* Right sticky panel */}
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
                        This holiday is priced against a verified market benchmark before we publish a live rate. Tell us your dates and travellers and our experts confirm the best price — usually within a few hours.
                      </p>
                      <ul className="mt-4 space-y-2 text-sm text-ink">
                        <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-blue" /> No booking until you approve the price</li>
                        <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-blue" /> Fully customizable itinerary</li>
                      </ul>
                      <div className="mt-5">
                        <EnquireButton packageName={pkg.name} variant="solid" label="Enquire & get a quote" className="!bg-brand-orange hover:!bg-brand-orangeDark" />
                      </div>
                      <p className="mt-2 text-center text-xs text-ink-muted">No login needed — talk to us directly.</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-bold">Make this holiday yours</h2>
                        <Badge tone="info"><ShieldCheck className="h-3 w-3" /> Live price</Badge>
                      </div>
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
                      <div className="mt-4 border-t border-surface-border pt-4">
                        <p className="mb-2 text-center text-xs text-ink-muted">Prefer to plan with an expert?</p>
                        <EnquireButton packageName={pkg.name} />
                      </div>
                    </>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </Container>

      {/* Mobile sticky CTA */}
      <div className="sticky bottom-0 z-30 border-t border-surface-border bg-white/95 p-3 shadow-sticky backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            {reviewRequired ? (
              <p className="text-lg font-bold text-brand-navy">Price on request</p>
            ) : (
              <>
                <p className="text-xs text-ink-muted">From</p>
                <p className="text-lg font-bold text-brand-navy">{formatINR(v.basePrice)} <span className="text-xs font-normal text-ink-muted">/person</span></p>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-[130px]">
              <EnquireButton packageName={pkg.name} label="Enquire" />
            </div>
            <Link href="#customize" className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-orange px-5 font-semibold text-white">
              {reviewRequired ? "Get a quote" : "Book now"}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
