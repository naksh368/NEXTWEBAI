import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Info, Plane, ArrowRight, Clock, Wallet } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Accordion } from "@/components/ui/accordion";
import { EmptyState } from "@/components/ui/states";
import { buttonVariants } from "@/components/ui/button";
import { SmartImage } from "@/components/ui/smart-image";
import { PackageCard } from "@/components/package/package-card";
import { getDestinationBySlug, getPackagesForDestination } from "@/lib/queries";
import { formatINR, holidayCountLabel } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = await getDestinationBySlug(slug);
  if (!d) return { title: "Destination not found" };
  return {
    title: `${d.name} holiday packages`,
    description: d.shortSummary ?? undefined,
    openGraph: { title: `${d.name} holidays`, description: d.shortSummary ?? undefined, images: d.heroImage ? [d.heroImage] : undefined },
  };
}

const THEME_SECTIONS: { theme: string; title: string }[] = [
  { theme: "HONEYMOON", title: "Honeymoon packages" },
  { theme: "FAMILY", title: "Family packages" },
  { theme: "LUXURY", title: "Luxury packages" },
];

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = await getDestinationBySlug(slug);
  if (!d) notFound();

  const allPackages = await getPackagesForDestination(slug);
  const travelInfo = (d.travelInfo ?? {}) as Record<string, string>;

  // Real, derived "plan your trip" facts (never fabricated).
  const priced = allPackages.filter((p) => p.pricingStatus !== "PRICE_REVIEW_REQUIRED");
  const fromPrice = priced.length ? Math.min(...priced.map((p) => p.basePrice)) : null;
  const nightsList = allPackages.map((p) => p.nights).filter((n) => n > 0);
  const nightRange = nightsList.length ? { min: Math.min(...nightsList), max: Math.max(...nightsList) } : null;

  const breadcrumbs = [{ label: "Home", href: "/" }, { label: "Destinations", href: "/destinations" }, { label: d.name }];
  const ctaLabel = allPackages.length ? `See ${holidayCountLabel(allPackages.length)}` : "Browse all holidays";
  const ctaHref = allPackages.length ? `/packages?destination=${d.slug}` : "/packages";

  return (
    <>
      {d.heroImage ? (
        <>
          <div className="border-b border-surface-border bg-white"><Container className="py-3"><Breadcrumbs items={breadcrumbs} /></Container></div>
          <section className="relative overflow-hidden">
            <div className="absolute inset-0"><SmartImage src={d.heroImage} alt={d.name} sizes="100vw" priority className="h-full" /></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/25" aria-hidden />
            <Container className="relative py-20 sm:py-28">
              {d.region && <p className="text-sm font-bold uppercase tracking-[0.16em] text-white/85">{d.region} · Holiday packages</p>}
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{d.name}</h1>
              <p className="mt-1 text-white/85">{d.country}</p>
              {d.shortSummary && <p className="mt-4 max-w-2xl text-lg text-white/90">{d.shortSummary}</p>}
              <Link href={ctaHref} className={buttonVariants({ variant: "orange", className: "mt-6" })}>
                {ctaLabel} <ArrowRight className="h-4 w-4" />
              </Link>
            </Container>
          </section>
        </>
      ) : (
        <section className="relative overflow-hidden dotted-bg border-b border-surface-border">
          <div className="absolute inset-0 hero-wash" aria-hidden />
          <Container className="relative py-12 sm:py-16">
            <Breadcrumbs items={breadcrumbs} />
            {d.region && <p className="mt-5 text-sm font-bold uppercase tracking-[0.16em] text-brand-orange">{d.region} · Holiday packages</p>}
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-brand-navy sm:text-5xl">{d.name}</h1>
            <p className="mt-1 text-ink-muted">{d.country}</p>
            {d.shortSummary && <p className="mt-4 max-w-2xl text-lg text-ink-muted">{d.shortSummary}</p>}
            <Link href={ctaHref} className={buttonVariants({ variant: "orange", className: "mt-6" })}>
                {ctaLabel} <ArrowRight className="h-4 w-4" />
              </Link>
          </Container>
        </section>
      )}

      <Container className="py-10">
        {/* Overview + travel info */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {d.overview && (
              <section>
                <h2 className="text-xl font-bold">About {d.name}</h2>
                <p className="mt-3 leading-relaxed text-ink-muted">{d.overview}</p>
              </section>
            )}
          </div>
          <aside className="space-y-4">
            {(fromPrice !== null || nightRange) && (
              <div className="rounded-2xl border border-brand-blue/20 bg-brand-blueLight/40 p-5">
                <h3 className="text-sm font-bold text-brand-navy">Plan your {d.name} trip</h3>
                <dl className="mt-2.5 space-y-2 text-sm">
                  {nightRange && (
                    <div className="flex items-center gap-2 text-ink">
                      <Clock className="h-4 w-4 shrink-0 text-brand-blue" />
                      <span>Recommended stay: <b>{nightRange.min === nightRange.max ? `${nightRange.min} nights` : `${nightRange.min}–${nightRange.max} nights`}</b></span>
                    </div>
                  )}
                  {fromPrice !== null && (
                    <div className="flex items-center gap-2 text-ink">
                      <Wallet className="h-4 w-4 shrink-0 text-brand-blue" />
                      <span>Packages from <b>{formatINR(fromPrice)}</b> / person</span>
                    </div>
                  )}
                </dl>
              </div>
            )}
            {d.bestTimeToVisit && (
              <div className="rounded-2xl border border-surface-border bg-white p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold"><CalendarDays className="h-4 w-4 text-brand-orange" /> Best time to visit</h3>
                <p className="mt-1.5 text-sm text-ink-muted">{d.bestTimeToVisit}</p>
              </div>
            )}
            {Object.keys(travelInfo).length > 0 && (
              <div className="rounded-2xl border border-surface-border bg-white p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold"><Info className="h-4 w-4 text-brand-blue" /> Travel information</h3>
                <dl className="mt-2 space-y-1.5 text-sm">
                  {Object.entries(travelInfo).map(([k, val]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="capitalize text-ink-faint">{k.replace(/([A-Z])/g, " $1")}</dt>
                      <dd className="text-right font-medium text-ink">{val}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </aside>
        </div>
      </Container>

      {/* Popular packages */}
      <Section className="bg-surface-muted/60 py-12">
        <Container>
          <SectionHeading eyebrow={`Holidays in ${d.name}`} title="Popular packages" />
          {allPackages.length ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {allPackages.slice(0, 6).map((p, i) => <PackageCard key={p.id} pkg={p} priority={i < 3} />)}
            </div>
          ) : (
            <EmptyState icon={<Plane className="h-5 w-5" />} title={`No ${d.name} packages yet`} description="Check back soon — new holidays are added regularly." action={{ label: "Browse all packages", href: "/packages" }} />
          )}
        </Container>
      </Section>

      {/* Themed sections */}
      {THEME_SECTIONS.map(({ theme, title }) => {
        const items = allPackages.filter((p) => p.theme === theme);
        if (!items.length) return null;
        return (
          <Section key={theme}>
            <Container>
              <SectionHeading title={title} />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((p) => <PackageCard key={p.id} pkg={p} />)}
              </div>
            </Container>
          </Section>
        );
      })}

      {/* FAQs */}
      {d.faqs.length > 0 && (
        <Section className="pt-0">
          <Container className="max-w-3xl">
            <SectionHeading title={`${d.name} travel FAQs`} />
            <Accordion items={d.faqs.map((f) => ({ question: f.question, answer: f.answer }))} />
          </Container>
        </Section>
      )}
    </>
  );
}
