import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Info, Plane, ArrowRight } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SmartImage } from "@/components/ui/smart-image";
import { Accordion } from "@/components/ui/accordion";
import { EmptyState } from "@/components/ui/states";
import { buttonVariants } from "@/components/ui/button";
import { PackageCard } from "@/components/package/package-card";
import { getDestinationBySlug, getPackagesForDestination } from "@/lib/queries";

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

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-navy">
        <div className="absolute inset-0 opacity-40" aria-hidden>
          <SmartImage src={d.heroImage} alt={d.name} sizes="100vw" priority />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/60 to-brand-navy/30" aria-hidden />
        <Container className="relative py-16 sm:py-24">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Destinations", href: "/destinations" }, { label: d.name }]} />
          <h1 className="mt-4 text-4xl font-extrabold text-white sm:text-5xl">{d.name}</h1>
          <p className="mt-1 text-white/70">{d.country}</p>
          {d.shortSummary && <p className="mt-4 max-w-2xl text-lg text-white/85">{d.shortSummary}</p>}
          <Link href="/packages" className={buttonVariants({ variant: "orange", className: "mt-6" })}>
            See {allPackages.length} packages <ArrowRight className="h-4 w-4" />
          </Link>
        </Container>
      </section>

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
