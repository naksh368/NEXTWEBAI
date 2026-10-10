import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, Headset, MapPin, Ship, ShieldCheck, Wallet } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { BreadcrumbJsonLd } from "@/components/layout/structured-data";
import { buttonVariants } from "@/components/ui/button";
import { SmartImage } from "@/components/ui/smart-image";
import { getAndamanDestinations, getGalleryItems } from "@/lib/queries";
import { getSiteSettings } from "@/lib/site-settings";
import { fillTokens, getPageContent } from "@/lib/page-content";
import { RichBlocks } from "@/components/ui/rich-blocks";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    title: "About us",
    description: `${s.brandName} is an Andaman travel agency based in Sri Vijaya Puram (Port Blair), planning island holidays across Port Blair, Havelock and Neil.`,
    alternates: { canonical: "/about" },
  };
}

/** Icons for the "how we work" points, reused in order for however many there are. */
const PRINCIPLE_ICONS = [MapPin, Wallet, Compass, Ship, Headset, ShieldCheck];

export default async function AboutPage() {
  const [settings, destinations, gallery, about] = await Promise.all([
    getSiteSettings(),
    getAndamanDestinations(),
    getGalleryItems(),
    getPageContent("about"),
  ]);
  const fill = (t: string) => fillTokens(t, settings);

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "About us", href: "/about" },
  ];
  const sideImage = gallery[1]?.url ?? gallery[0]?.url ?? destinations[1]?.heroImage ?? null;
  const sideAlt = gallery[1]?.alt ?? gallery[0]?.alt ?? "An Andaman island beach";

  return (
    <>
      <BreadcrumbJsonLd items={crumbs} />
      <PageHeader
        eyebrow="About us"
        title={`${settings.brandName}`}
        description={settings.tagline}
        breadcrumbs={crumbs}
        image={gallery[0]?.url ?? null}
        imageAlt={gallery[0]?.alt}
      />

      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <h2 className="text-2xl sm:text-3xl">{fill(about.heading)}</h2>
              <RichBlocks text={fill(about.body)} className="mt-5 space-y-4" />

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/contact" className={buttonVariants({ variant: "orange" })}>
                  Plan my trip <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/packages" className={buttonVariants({ variant: "outline" })}>
                  See our packages
                </Link>
              </div>
            </div>

            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-card lg:aspect-auto lg:min-h-[420px]">
              <SmartImage src={sideImage} alt={sideAlt} sizes="(max-width:1024px) 100vw, 50vw" className="h-full" />
            </div>
          </div>
        </Container>
      </Section>

      <Section className="bg-surface-muted">
        <Container>
          <SectionHeading
            align="center"
            eyebrow={fill(about.principlesEyebrow)}
            title={fill(about.principlesTitle)}
            description={fill(about.principlesText) || undefined}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {about.principles.map((p, i) => {
              const Icon = PRINCIPLE_ICONS[i % PRINCIPLE_ICONS.length];
              return (
                <div key={i} className="rounded-2xl border border-surface-border bg-white p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-turquoiseLight text-brand-turquoiseDark">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-bold">{fill(p.title)}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{fill(p.body)}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading
            eyebrow="Where we take you"
            title="The islands we cover"
            action={<Link href="/destinations" className={buttonVariants({ variant: "outline", size: "sm" })}>All destinations</Link>}
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {destinations.slice(0, 4).map((d) => (
              <Link key={d.id} href={`/destinations/${d.slug}`} className="group relative block overflow-hidden rounded-2xl">
                <span className="relative block aspect-[3/4]">
                  <SmartImage src={d.thumbnail} alt={`${d.name}, Andaman Islands`} sizes="(max-width:640px) 45vw, 25vw" imgClassName="transition-transform duration-500 group-hover:scale-110" />
                  <span className="absolute inset-0 photo-scrim" aria-hidden />
                </span>
                <span className="absolute inset-x-0 bottom-0 p-4 text-sm font-extrabold text-white">{d.name}</span>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container>
          <div className="rounded-3xl bg-brand-navy px-6 py-12 text-center sm:px-12">
            <h2 className="text-2xl text-white sm:text-3xl">{fill(about.ctaTitle)}</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">{fill(about.ctaText)}</p>
            <Link href="/contact" className={buttonVariants({ variant: "orange", size: "lg", className: "mt-7" })}>
              Plan my trip <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
