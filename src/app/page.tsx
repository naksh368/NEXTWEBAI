import Link from "next/link";
import {
  ArrowRight, Ship, Palmtree, Waves, Compass, BedDouble, Headset, CalendarCheck,
  Camera, Star, MapPin, Quote, Phone, MessageCircle, ShieldCheck, Sparkles,
} from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { SmartImage } from "@/components/ui/smart-image";
import { Accordion } from "@/components/ui/accordion";
import { EmptyState } from "@/components/ui/states";
import { PackageCard } from "@/components/package/package-card";
import { TripPlanner } from "@/components/enquiry/trip-planner";
import { RecentlyViewedRail } from "@/components/package/recently-viewed";
import { GoogleRating } from "@/components/ui/google-rating";
import { IslandMap } from "@/components/home/island-map";
import { AskAshaButton } from "@/components/ai/ask-asha-button";
import {
  getAndamanDestinations, getFeaturedPackages, getGlobalFaqs,
  getPublishedTestimonials, getGalleryItems, listPackages,
} from "@/lib/queries";
import { getSiteSettings, promoIsActive, telLinkFor, whatsappLinkFor } from "@/lib/site-settings";
import { formatINR, formatDate } from "@/lib/utils";

export const revalidate = 300;

/** Soft, slowly drifting clouds over the sea. Purely decorative. */
function Clouds() {
  const cloud = "M10 30 Q10 16 26 16 Q30 4 46 6 Q60 0 70 12 Q86 10 90 24 Q100 26 98 34 Q96 40 86 40 L18 40 Q8 40 10 30 Z";
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {[
        { top: "8%", left: "4%", w: 150, o: 0.75 },
        { top: "30%", left: "46%", w: 110, o: 0.55 },
        { top: "64%", left: "8%", w: 120, o: 0.5 },
        { top: "14%", left: "84%", w: 170, o: 0.7 },
        { top: "78%", left: "70%", w: 140, o: 0.45 },
      ].map((c, i) => (
        <svg key={i} viewBox="0 0 100 44" className="cloud-drift absolute" style={{ top: c.top, left: c.left, width: c.w, opacity: c.o, animationDelay: `${-i * 7}s` }}>
          <path d={cloud} fill="#ffffff" />
        </svg>
      ))}
    </div>
  );
}

/** What JST arranges. Shown as capability, never as a per-package promise. */
const EXPERIENCES = [
  { icon: Waves, title: "Beautiful beaches", body: "Radhanagar, Kalapathar, Bharatpur and Laxmanpur — the sand the islands are known for." },
  { icon: Compass, title: "Snorkelling & water sports", body: "Reef snorkelling, glass-bottom boats, sea walking and scuba, through licensed operators." },
  { icon: Palmtree, title: "Island hopping", body: "Port Blair, Havelock and Neil on one trip, with every connection planned for you." },
  { icon: BedDouble, title: "Resort & hotel stays", body: "Budget guesthouses through to 4-star beach resorts, chosen to fit your group." },
  { icon: Camera, title: "Sightseeing", body: "Cellular Jail and the Light & Sound Show, Ross Island, North Bay and Corbyn's Cove." },
  { icon: Ship, title: "Inter-island transfers", body: "Ferry seats booked and re-booked for you when the sea changes the schedule." },
];

export default async function HomePage() {
  const [settings, destinations, featured, allPackages, faqs, testimonials, gallery] = await Promise.all([
    getSiteSettings(),
    getAndamanDestinations(),
    getFeaturedPackages(6),
    listPackages({ page: 1, sort: "price-asc" }),
    getGlobalFaqs(),
    getPublishedTestimonials(6),
    getGalleryItems(),
  ]);

  const packages = featured.length ? featured : allPackages.items;
  const planner = allPackages.items.map((p) => ({ slug: p.slug, name: p.name }));
  const plannerPlaces = ["Andaman Islands", ...destinations.map((d) => d.name)];

  const priced = allPackages.items.filter((p) => p.pricingStatus !== "PRICE_REVIEW_REQUIRED");
  const fromPrice = priced.length ? Math.min(...priced.map((p) => p.basePrice)) : null;
  const promoLive = promoIsActive(settings);

  const tel = telLinkFor(settings);
  const wa = whatsappLinkFor(settings, `Hello ${settings.brandName}, I would like to plan an Andaman holiday.`);
  const heroImage = settings.heroImage || gallery[0]?.url || destinations[0]?.heroImage || null;
  const heroAlt = settings.heroImage ? `${settings.brandName} — Andaman Islands` : gallery[0]?.alt ?? "A white sand Andaman beach meeting turquoise water";

  return (
    <>
      {/* ── HERO: illustrated island map ─────────────────────── */}
      <section className="sea-waves relative isolate overflow-hidden border-b border-surface-border">
        <Clouds />
        <Container className="relative grid items-center gap-6 pb-6 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-10 lg:py-10">
          <div className="animate-fade-in-slow lg:max-w-xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-brand-turquoiseDark sm:text-sm">
              {settings.heroEyebrow}
            </p>
            <h1 className="mt-4 text-[2.4rem] font-extrabold text-brand-navy sm:text-6xl">{settings.heroHeading}</h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-muted sm:text-lg">{settings.heroSubheading}</p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={settings.heroCtaPrimaryHref} className={buttonVariants({ variant: "orange", size: "lg" })}>
                {settings.heroCtaPrimaryLabel} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#plan" className={buttonVariants({ variant: "outline", size: "lg" })}>
                {settings.heroCtaSecondaryLabel}
              </Link>
            </div>

            <ul className="mt-7 flex flex-wrap gap-2.5 text-sm font-bold text-brand-navy">
              {fromPrice !== null && (
                <li className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-surface-border">
                  <Sparkles className="h-4 w-4 text-brand-orange" /> From <span className="tabular">{formatINR(fromPrice)}</span> pp
                </li>
              )}
              {settings.reviewScore !== null && settings.reviewUrl && (
                <li>
                  <GoogleRating score={settings.reviewScore} count={settings.reviewCount} url={settings.reviewUrl} size="chip" />
                </li>
              )}
              <li className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-surface-border">
                <MapPin className="h-4 w-4 text-brand-turquoiseDark" /> Port Blair · Havelock · Neil
              </li>
              <li className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-surface-border">
                <Headset className="h-4 w-4 text-brand-turquoiseDark" /> Local team on the islands
              </li>
            </ul>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <AskAshaButton prompt="Can you plan a customised Andaman trip for us?" />
              <span className="text-xs font-semibold text-ink-muted">or tap any place on the map</span>
            </div>
          </div>

          <div
            className="relative mx-auto w-full"
            style={{
              // The left-hand labels hang outside the map's box; the 72px keeps them on screen on phones.
              width: "min(calc(100% - 72px), 470px, calc((100svh - 150px) * 0.56))",
              minWidth: "min(calc(100% - 72px), 300px)",
            }}
          >
            <IslandMap />
            <p className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-ink-muted">
              <span className="inline-flex items-center gap-2 whitespace-nowrap">
                <span className="inline-block h-0 w-6 border-t-2 border-dashed border-brand-blue/60" aria-hidden="true" /> Ferry &amp; boat routes
              </span>
              <span className="whitespace-nowrap text-ink-faint">· map simplified, not to scale for navigation</span>
            </p>
          </div>
        </Container>
      </section>

      {/* ── PLAN MY TRIP: photo + enquiry ────────────────────── */}
      <section id="plan" className="relative isolate scroll-mt-24 overflow-hidden bg-brand-navy">
        <div className="absolute inset-0">
          <SmartImage src={heroImage} alt={heroAlt} sizes="100vw" className="h-full" />
        </div>
        {/* Phones stack the text over the brightest part of the photo, so they get a near-solid wash. */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-navy/95 via-brand-navy/90 to-brand-navy/80 lg:hidden" aria-hidden />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-brand-navy/95 via-brand-navy/70 to-brand-navy/40 lg:block" aria-hidden />
        <Container className="relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1fr_minmax(0,460px)] lg:gap-14">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-brand-turquoise sm:text-sm">Plan my trip</p>
            <h2 className="mt-3 max-w-xl text-3xl text-white sm:text-5xl">Tell us your dates. We&apos;ll plan the rest.</h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">
              Hotels, ferries, sightseeing and transfers arranged by a team based in Port Blair. You get a written itinerary and
              quotation — nothing is booked until you say yes.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "onPhoto", size: "lg" })}>
                  <MessageCircle className="h-4 w-4" /> WhatsApp us
                </a>
              )}
              {tel && (
                <a href={tel} className={buttonVariants({ variant: "onPhoto", size: "lg" })}>
                  <Phone className="h-4 w-4" /> {settings.phonePrimary}
                </a>
              )}
            </div>
          </div>
          <TripPlanner destinations={plannerPlaces} packages={planner} />
        </Container>
      </section>

      {/* ── TRUST STRIP ──────────────────────────────────────── */}
      <section className="border-b border-surface-border bg-white">
        <Container className="grid gap-x-6 gap-y-6 py-9 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: CalendarCheck, title: "Personalised holiday planning", body: "Every itinerary is built around your dates, your group and your budget." },
            { icon: BedDouble, title: "Accommodation options", body: "Budget guesthouses to 4-star resorts, across all three islands." },
            { icon: Compass, title: "Island sightseeing", body: "The beaches, the reef and the heritage sites, arranged end to end." },
            { icon: Ship, title: "Transfers & travel assistance", body: "Airport pick-up, ferries and a team on the ground while you are here." },
          ].map((f) => (
            <div key={f.title} className="flex gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-turquoiseLight text-brand-turquoiseDark">
                <f.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-[15px] font-bold leading-snug">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{f.body}</p>
              </div>
            </div>
          ))}
        </Container>

        {/* Social proof renders only for figures an administrator actually entered. */}
        {(settings.reviewScore !== null || settings.travellersServed !== null || settings.registrationInfo) && (
          <div className="border-t border-surface-border bg-surface-muted">
            <Container className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 py-4 text-sm font-semibold text-ink">
              <GoogleRating score={settings.reviewScore} count={settings.reviewCount} url={settings.reviewUrl} />
              {settings.travellersServed !== null && (
                <span className="inline-flex items-center gap-2">
                  <Palmtree className="h-4 w-4 text-brand-turquoiseDark" />
                  <span className="tabular">{settings.travellersServed.toLocaleString("en-IN")}</span> travellers hosted
                </span>
              )}
              {settings.registrationInfo && (
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-brand-turquoiseDark" /> {settings.registrationInfo}
                </span>
              )}
            </Container>
          </div>
        )}
      </section>

      {/* ── FEATURED PACKAGES ────────────────────────────────── */}
      <Section id="packages">
        <Container>
          <SectionHeading
            eyebrow="Holiday packages"
            title="Find your perfect Andaman escape"
            description={`Five nights, six days across Port Blair, Havelock and Neil — pick the hotel category that suits your group. ${settings.priceDisclaimer}`}
            action={
              <Link href="/packages" className={buttonVariants({ variant: "outline", size: "sm" })}>
                All packages <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />

          {promoLive && (
            <p className="mb-6 inline-flex flex-wrap items-center gap-2 rounded-xl bg-brand-orangeLight px-4 py-2.5 text-sm font-semibold text-brand-orangeDark">
              <CalendarCheck className="h-4 w-4 shrink-0" />
              Promotional rates valid for travel {formatDate(settings.promoValidFrom)} – {formatDate(settings.promoValidTo)} · minimum {settings.defaultMinTravellers} travellers
            </p>
          )}

          {packages.length ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((p, i) => (
                <PackageCard key={p.id} pkg={p} priority={i < 3} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No packages published yet"
              description="Our holiday packages will appear here as soon as they are published."
              action={{ label: "Send us an enquiry", href: "/contact" }}
            />
          )}
        </Container>
      </Section>

      {/* ── DESTINATIONS ─────────────────────────────────────── */}
      {destinations.length > 0 && (
        <Section className="bg-surface-muted">
          <Container>
            <SectionHeading
              eyebrow="Explore the islands"
              title="Where your Andaman holiday takes you"
              description="Three islands, a handful of unforgettable beaches, and the heritage that made these islands matter."
              action={
                <Link href="/destinations" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  All destinations <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {destinations.slice(0, 8).map((d, i) => (
                <Link
                  key={d.id}
                  href={`/destinations/${d.slug}`}
                  className="group relative block overflow-hidden rounded-2xl shadow-card transition-shadow hover:shadow-cardHover"
                >
                  <div className="relative aspect-[4/5]">
                    <SmartImage
                      src={d.thumbnail}
                      alt={`${d.name}, Andaman Islands`}
                      sizes="(max-width:640px) 45vw, (max-width:1024px) 30vw, 22vw"
                      priority={i < 4}
                      imgClassName="transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 photo-scrim" aria-hidden />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="text-base font-extrabold leading-tight text-white">{d.name}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs font-medium text-white/80">{d.shortSummary}</p>
                      {d.packageCount > 0 && (
                        <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand-turquoise">
                          {d.packageCount} package{d.packageCount > 1 ? "s" : ""} <ArrowRight className="h-3 w-3" />
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ── EXPERIENCES ──────────────────────────────────────── */}
      <Section>
        <Container>
          <SectionHeading
            align="center"
            eyebrow="What we arrange"
            title="Everything an island holiday needs"
            description="These are the services we plan and coordinate. What is included in your trip depends on the package you choose — each package page lists its own inclusions in full."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EXPERIENCES.map((e) => (
              <div key={e.title} className="rounded-2xl border border-surface-border bg-white p-6 transition-shadow hover:shadow-card">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue">
                  <e.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-bold">{e.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{e.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── GALLERY PREVIEW ──────────────────────────────────── */}
      {gallery.length > 0 && (
        <Section className="bg-brand-navy py-14 sm:py-20">
          <Container>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-xl">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-turquoise">Gallery</p>
                <h2 className="mt-2.5 text-[1.75rem] text-white sm:text-4xl">The Andamans, as you will find them</h2>
              </div>
              <Link href="/gallery" className={buttonVariants({ variant: "onPhoto", size: "sm" })}>
                View the gallery <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {gallery.slice(0, 8).map((g, i) => (
                <Link
                  key={g.id}
                  href="/gallery"
                  className={`group relative overflow-hidden rounded-xl ${i === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"}`}
                >
                  <SmartImage
                    src={g.url}
                    alt={g.alt}
                    sizes={i === 0 ? "(max-width:640px) 100vw, 50vw" : "(max-width:640px) 50vw, 25vw"}
                    imgClassName="transition-transform duration-500 group-hover:scale-105"
                  />
                  {g.caption && (
                    <>
                      <div className="absolute inset-0 photo-scrim-soft opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                      <p className="absolute inset-x-0 bottom-0 p-3 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                        {g.caption}
                      </p>
                    </>
                  )}
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ── RECENTLY VIEWED (per-viewer; renders nothing when empty) ── */}
      <Section className="py-0">
        <Container>
          <RecentlyViewedRail limit={4} />
        </Container>
      </Section>

      {/* ── TESTIMONIALS — hidden entirely until real ones are published ── */}
      {testimonials.length > 0 && (
        <Section className="bg-surface-muted">
          <Container>
            <SectionHeading align="center" eyebrow="Traveller stories" title="What our guests say" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t) => (
                <figure key={t.id} className="flex flex-col rounded-2xl border border-surface-border bg-white p-6">
                  <Quote className="h-7 w-7 shrink-0 text-brand-turquoise" aria-hidden />
                  {t.rating !== null && (
                    <div className="mt-3 flex gap-0.5" aria-label={`${t.rating} out of 5`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={i < t.rating! ? "h-4 w-4 fill-brand-orange text-brand-orange" : "h-4 w-4 text-surface-border"} />
                      ))}
                    </div>
                  )}
                  <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink-muted">{t.body}</blockquote>
                  <figcaption className="mt-5 border-t border-surface-border pt-4">
                    <p className="text-sm font-bold text-brand-navy">{t.displayName}</p>
                    <p className="text-xs text-ink-muted">
                      {[t.location, t.packageName, t.reviewDate ? formatDate(t.reviewDate) : null].filter(Boolean).join(" · ")}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ── FAQ ──────────────────────────────────────────────── */}
      {faqs.length > 0 && (
        <Section id="faq">
          <Container className="max-w-3xl">
            <SectionHeading
              align="center"
              eyebrow="Good to know"
              title="Frequently asked questions"
              action={
                <Link href="/faq" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  All questions
                </Link>
              }
            />
            <Accordion items={faqs.slice(0, 6).map((f) => ({ question: f.question, answer: f.answer }))} />
          </Container>
        </Section>
      )}

      {/* ── CLOSING CTA ──────────────────────────────────────── */}
      <Section className="pb-20 pt-0">
        <Container>
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-blue to-brand-navy px-6 py-12 text-center sm:px-12 sm:py-16">
            <h2 className="mx-auto max-w-2xl text-2xl text-white sm:text-4xl">Tell us when you want to travel</h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/80">
              Send us your dates and group size and we will come back with an itinerary and a written quotation — no obligation.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className={buttonVariants({ variant: "orange", size: "lg" })}>
                Plan my trip <ArrowRight className="h-4 w-4" />
              </Link>
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "onPhoto", size: "lg" })}>
                  <MessageCircle className="h-4 w-4" /> WhatsApp us
                </a>
              )}
              {tel && (
                <a href={tel} className={buttonVariants({ variant: "onPhoto", size: "lg" })}>
                  <Phone className="h-4 w-4" /> {settings.phonePrimary}
                </a>
              )}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
