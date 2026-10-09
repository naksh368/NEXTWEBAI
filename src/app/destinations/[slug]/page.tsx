import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, Info, MapPin, Wallet } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { BreadcrumbJsonLd } from "@/components/layout/structured-data";
import { Accordion } from "@/components/ui/accordion";
import { EmptyState } from "@/components/ui/states";
import { buttonVariants } from "@/components/ui/button";
import { PackageCard } from "@/components/package/package-card";
import { getDestinationBySlug, getPackagesForDestinationOrHub } from "@/lib/queries";
import { formatINR } from "@/lib/utils";

export const revalidate = 600;

/** travelInfo keys that steer the UI rather than describe the place. */
const INTERNAL_TRAVEL_INFO_KEYS = new Set(["hubSlug"]);

const TRAVEL_INFO_LABEL: Record<string, string> = {
  gettingThere: "Getting there",
  ferry: "Ferries",
  permits: "Permits",
  staying: "Where to stay",
  beaches: "Beaches",
  bestFor: "Best for",
  location: "Location",
  activities: "Activities",
  show: "Light & Sound Show",
  note: "Good to know",
  currency: "Currency",
  language: "Languages",
  timezone: "Time zone",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = await getDestinationBySlug(slug);
  if (!d) return { title: "Destination not found", robots: { index: false, follow: false } };
  return {
    title: `${d.name}, Andaman Islands`,
    description: d.shortSummary ?? undefined,
    alternates: { canonical: `/destinations/${d.slug}` },
    openGraph: {
      title: `${d.name}, Andaman Islands`,
      description: d.shortSummary ?? undefined,
      url: `/destinations/${d.slug}`,
      images: d.heroImage ? [d.heroImage] : undefined,
    },
  };
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = await getDestinationBySlug(slug);
  if (!d) notFound();

  const { items: packages, viaRoute } = await getPackagesForDestinationOrHub(slug, d.travelInfo, d.name);

  const travelInfo = Object.entries((d.travelInfo ?? {}) as Record<string, string>).filter(
    ([k, v]) => !INTERNAL_TRAVEL_INFO_KEYS.has(k) && typeof v === "string" && v.trim()
  );

  // Derived from the real catalogue — never a guessed "from" price.
  const priced = packages.filter((p) => p.pricingStatus !== "PRICE_REVIEW_REQUIRED");
  const fromPrice = priced.length ? Math.min(...priced.map((p) => p.basePrice)) : null;
  const nights = packages.map((p) => p.nights).filter((n) => n > 0);
  const nightRange = nights.length ? { min: Math.min(...nights), max: Math.max(...nights) } : null;

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Destinations", href: "/destinations" },
    { label: d.name, href: `/destinations/${d.slug}` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={crumbs} />
      <PageHeader
        eyebrow="Andaman & Nicobar Islands"
        title={d.name}
        description={d.shortSummary ?? undefined}
        breadcrumbs={crumbs}
        image={d.heroImage}
        imageAlt={`${d.name}, Andaman Islands`}
      >
        <Link
          href={packages.length ? "#packages" : "/packages"}
          className={buttonVariants({ variant: "orange" })}
        >
          {packages.length ? `See ${packages.length} package${packages.length > 1 ? "s" : ""}` : "Browse all packages"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </PageHeader>

      <Section className="pt-10">
        <Container>
          <div className="grid gap-9 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {d.overview && (
                <>
                  <h2 className="text-2xl sm:text-3xl">About {d.name}</h2>
                  <p className="mt-4 text-[15px] leading-relaxed text-ink-muted sm:text-base">{d.overview}</p>
                </>
              )}

              {d.categories.length > 0 && (
                <ul className="mt-6 flex flex-wrap gap-2">
                  {d.categories.map(({ category }) => (
                    <li
                      key={category.id}
                      className="rounded-full bg-brand-turquoiseLight px-3 py-1.5 text-xs font-bold text-brand-turquoiseDark"
                    >
                      {category.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <aside className="space-y-4">
              {(fromPrice !== null || nightRange) && (
                <div className="rounded-2xl border border-brand-blue/20 bg-brand-blueLight p-5">
                  <h3 className="text-sm font-bold text-brand-navy">Plan a trip here</h3>
                  <dl className="mt-3 space-y-2.5 text-sm">
                    {nightRange && (
                      <div className="flex items-start gap-2.5 text-ink">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
                        <span>
                          Our itineraries run{" "}
                          <b>
                            {nightRange.min === nightRange.max
                              ? `${nightRange.min} nights`
                              : `${nightRange.min}–${nightRange.max} nights`}
                          </b>
                        </span>
                      </div>
                    )}
                    {fromPrice !== null && (
                      <div className="flex items-start gap-2.5 text-ink">
                        <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
                        <span>
                          From <b className="tabular">{formatINR(fromPrice)}</b> per person
                        </span>
                      </div>
                    )}
                  </dl>
                  <Link href="/contact" className={buttonVariants({ variant: "orange", size: "sm", className: "mt-4 w-full" })}>
                    Plan my trip
                  </Link>
                </div>
              )}

              {d.bestTimeToVisit && (
                <div className="rounded-2xl border border-surface-border bg-white p-5">
                  <h3 className="flex items-center gap-2 text-sm font-bold">
                    <CalendarDays className="h-4 w-4 text-brand-orange" /> Best time to visit
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{d.bestTimeToVisit}</p>
                </div>
              )}

              {travelInfo.length > 0 && (
                <div className="rounded-2xl border border-surface-border bg-white p-5">
                  <h3 className="flex items-center gap-2 text-sm font-bold">
                    <Info className="h-4 w-4 text-brand-blue" /> Travel information
                  </h3>
                  <dl className="mt-3 space-y-3 text-sm">
                    {travelInfo.map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-xs font-bold uppercase tracking-wide text-ink-faint">
                          {TRAVEL_INFO_LABEL[k] ?? k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}
                        </dt>
                        <dd className="mt-0.5 leading-relaxed text-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </aside>
          </div>
        </Container>
      </Section>

      <Section id="packages" className="bg-surface-muted">
        <Container>
          <SectionHeading
            eyebrow={`Holidays that include ${d.name}`}
            title={viaRoute ? `Packages that visit ${d.name}` : `${d.name} packages`}
            description={
              viaRoute
                ? `${d.name} is part of these itineraries rather than a place you stay, so these are the packages whose route covers it.`
                : undefined
            }
            action={
              <Link href="/packages" className={buttonVariants({ variant: "outline", size: "sm" })}>
                All packages
              </Link>
            }
          />
          {packages.length ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {packages.slice(0, 6).map((p, i) => (
                <PackageCard key={p.id} pkg={p} priority={i < 3} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<MapPin className="h-5 w-5" />}
              title={`No ${d.name} packages published yet`}
              description="Tell us your dates and we will build an itinerary that includes it."
              action={{ label: "Send an enquiry", href: "/contact" }}
            />
          )}
        </Container>
      </Section>

      {d.faqs.length > 0 && (
        <Section>
          <Container className="max-w-3xl">
            <SectionHeading align="center" title={`${d.name} questions`} />
            <Accordion items={d.faqs.map((f) => ({ question: f.question, answer: f.answer }))} />
          </Container>
        </Section>
      )}
    </>
  );
}
