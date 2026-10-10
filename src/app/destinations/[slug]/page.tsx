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
  note: "Please note",
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

  // Islands you sleep on are their own hub; sights point at the island they are visited from.
  const hubSlug = (d.travelInfo as Record<string, unknown> | null)?.hubSlug;
  const stayHere = !hubSlug || hubSlug === d.slug;
  const hubName = stayHere ? null : (await getDestinationBySlug(String(hubSlug)))?.name ?? null;

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
          <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
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

              {/* Facts sit beside the overview, so a short description never leaves a gap. */}
              {(d.bestTimeToVisit || travelInfo.length > 0) && (
                <div className="mt-8">
                  <h3 className="flex items-center gap-2 text-lg font-extrabold text-brand-navy">
                    <Info className="h-5 w-5 text-brand-blue" /> Good to know
                  </h3>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    {d.bestTimeToVisit && (
                      <div className="rounded-2xl border border-surface-border bg-white p-4">
                        <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-faint">
                          <CalendarDays className="h-3.5 w-3.5 text-brand-orange" /> Best time to visit
                        </dt>
                        <dd className="mt-1 text-sm leading-relaxed text-ink">{d.bestTimeToVisit}</dd>
                      </div>
                    )}
                    {travelInfo.map(([k, v]) => (
                      <div key={k} className="rounded-2xl border border-surface-border bg-white p-4">
                        <dt className="text-xs font-bold uppercase tracking-wide text-ink-faint">
                          {TRAVEL_INFO_LABEL[k] ?? k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}
                        </dt>
                        <dd className="mt-1 text-sm leading-relaxed text-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>

            <aside>
              <div className="rounded-2xl border border-brand-blue/20 bg-brand-blueLight p-5 lg:sticky lg:top-28">
                <h3 className="text-base font-extrabold text-brand-navy">Plan a trip to {d.name}</h3>
                {(fromPrice !== null || nightRange) && (
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
                )}
                <div className="mt-4 grid gap-2">
                  {packages.length > 0 && (
                    <Link href="#packages" className={buttonVariants({ variant: "orange", size: "sm", className: "w-full" })}>
                      See {packages.length} package{packages.length > 1 ? "s" : ""}
                    </Link>
                  )}
                  <Link
                    href="/#plan"
                    className={buttonVariants({ variant: packages.length ? "outline" : "orange", size: "sm", className: "w-full" })}
                  >
                    Plan my trip
                  </Link>
                </div>
              </div>
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
                ? stayHere
                  ? `Every one of these itineraries includes nights on ${d.name}.`
                  : `${d.name} is visited on a day out${hubName ? ` from ${hubName}` : ""}, so these are the packages that include it.`
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
