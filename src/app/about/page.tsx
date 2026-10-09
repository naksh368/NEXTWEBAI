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

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    title: "About us",
    description: `${s.brandName} is an Andaman travel agency based in Sri Vijaya Puram (Port Blair), planning island holidays across Port Blair, Havelock and Neil.`,
    alternates: { canonical: "/about" },
  };
}

const PRINCIPLES = [
  { icon: MapPin, title: "We are based here", body: "Our office is in Sri Vijaya Puram (Port Blair), not on the mainland. When a ferry is cancelled or a hotel changes a room, someone local is already on it." },
  { icon: Wallet, title: "Written quotations, no surprises", body: "Every quotation sets out what is included and what is not, before you pay anything. If a cost changes, we tell you before it is incurred." },
  { icon: Compass, title: "Itineraries built around you", body: "The packages on this site are a starting point. We change the nights, the islands and the hotel category to suit your group." },
  { icon: Ship, title: "The logistics are ours, not yours", body: "Airport pick-up, ferry seats, hotel check-ins and sightseeing are booked and re-booked by us, so you are not managing it from the jetty." },
  { icon: Headset, title: "A person on the ground", body: "You travel with a number that reaches someone on the islands, for the whole of your stay." },
  { icon: ShieldCheck, title: "Honest about what we control", body: "We do not promise weather, sea conditions or a sailing that has not been allotted. What we promise is a plan, and a team that fixes it when it moves." },
];

export default async function AboutPage() {
  const [settings, destinations, gallery] = await Promise.all([
    getSiteSettings(),
    getAndamanDestinations(),
    getGalleryItems(),
  ]);

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
              <h2 className="text-2xl sm:text-3xl">An Andaman specialist, and only Andaman</h2>
              <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-ink-muted">
                <p>
                  {settings.brandName} plans holidays in one place: the Andaman &amp; Nicobar Islands. We do not sell
                  Dubai, Bali or Europe. Everything we know is about getting the ferry timings right between Port Blair,
                  Havelock and Neil, which beach is worth the drive in the late afternoon, and which hotel actually
                  delivers what its photographs promise.
                </p>
                <p>
                  That focus is the whole point. An agency selling forty destinations is reading the same listings you
                  are. We are on the islands, so we book the sailings, confirm the rooms and send someone to the airport
                  — and when a sailing is cancelled, we are rearranging your day before you have finished reading the
                  message.
                </p>
                <p>
                  Our packages start at {" "}
                  <Link href="/packages" className="font-semibold text-brand-blue underline-offset-2 hover:underline">
                    five nights and six days
                  </Link>{" "}
                  across all three islands, in hotel categories from budget guesthouses to 4-star resorts. Each one is a
                  starting point we will happily rebuild around your dates, your group and your budget.
                </p>
              </div>

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
            eyebrow="How we work"
            title="What you can expect from us"
            description="Six things we hold ourselves to on every booking."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="rounded-2xl border border-surface-border bg-white p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-turquoiseLight text-brand-turquoiseDark">
                  <p.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-bold">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{p.body}</p>
              </div>
            ))}
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
            <h2 className="text-2xl text-white sm:text-3xl">Come and see them</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">
              Send us your dates and we will come back with an itinerary and a written quotation.
            </p>
            <Link href="/contact" className={buttonVariants({ variant: "orange", size: "lg", className: "mt-7" })}>
              Plan my trip <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
