import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { BreadcrumbJsonLd } from "@/components/layout/structured-data";
import { SmartImage } from "@/components/ui/smart-image";
import { EmptyState } from "@/components/ui/states";
import { buttonVariants } from "@/components/ui/button";
import { getAndamanDestinations } from "@/lib/queries";
import { getSiteSettings } from "@/lib/site-settings";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    title: "Andaman destinations",
    description: "Port Blair, Havelock and Neil Island, plus Radhanagar, Kalapathar, Ross Island, North Bay and the Cellular Jail — the places an Andaman holiday takes you.",
    alternates: { canonical: "/destinations" },
    openGraph: { title: `Andaman destinations · ${s.brandName}`, url: "/destinations" },
  };
}

export default async function DestinationsPage() {
  const destinations = await getAndamanDestinations();

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Destinations", href: "/destinations" },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={crumbs} />
      <PageHeader
        eyebrow="Explore"
        title="Where an Andaman holiday takes you"
        description="Three islands you sleep on, and a handful of places you will remember long after you have left. Every one of them sits on at least one of our itineraries."
        breadcrumbs={crumbs}
        image={destinations[0]?.heroImage ?? null}
        imageAlt="An Andaman island shoreline"
      />

      <Section>
        <Container>
          {destinations.length ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {destinations.map((d, i) => (
                <Link
                  key={d.id}
                  href={`/destinations/${d.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-surface-border bg-white shadow-card transition-shadow hover:shadow-cardHover"
                >
                  <div className="relative aspect-[16/10]">
                    <SmartImage
                      src={d.thumbnail}
                      alt={`${d.name}, Andaman Islands`}
                      sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                      priority={i < 3}
                      imgClassName="transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 photo-scrim-soft" aria-hidden />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <h2 className="text-lg font-extrabold text-white">{d.name}</h2>
                      <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-white/80">
                        <MapPin className="h-3.5 w-3.5" /> {d.region}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-ink-muted">{d.shortSummary}</p>
                    <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-blue">
                      {d.packageCount > 0
                        ? `${d.packageCount} package${d.packageCount > 1 ? "s" : ""} visit here`
                        : "See our packages"}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No destinations published yet"
              description="Our island guides will appear here shortly."
              action={{ label: "Browse holiday packages", href: "/packages" }}
            />
          )}

          <div className="mt-14 rounded-2xl bg-brand-navy px-6 py-11 text-center sm:px-12">
            <h2 className="text-2xl text-white sm:text-3xl">Not sure which islands to pick?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">
              Tell us how many nights you have and we will tell you honestly what fits — and what is worth leaving for next time.
            </p>
            <Link href="/contact" className={buttonVariants({ variant: "orange", size: "lg", className: "mt-7" })}>
              Ask us <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
