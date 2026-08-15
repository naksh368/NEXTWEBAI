import Link from "next/link";
import {
  ShieldCheck, Wallet, Headset, Sparkles, Search, SlidersHorizontal,
  BadgeCheck, CreditCard, MapPin, ArrowRight, Star, Plane, Building2,
} from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { SmartImage } from "@/components/ui/smart-image";
import { Accordion } from "@/components/ui/accordion";
import { EmptyState } from "@/components/ui/states";
import { PackageCard } from "@/components/package/package-card";
import { SearchBox } from "@/components/home/search-box";
import { Newsletter } from "@/components/home/newsletter";
import {
  getPopularDestinations, getFeaturedPackages, getActiveOffers,
  getGlobalFaqs, getPublishedReviews,
} from "@/lib/queries";
import { formatINR } from "@/lib/utils";

const CATEGORIES = [
  { label: "Honeymoon", theme: "HONEYMOON", icon: Star, blurb: "Romantic getaways" },
  { label: "Family", theme: "FAMILY", icon: Building2, blurb: "Fun for all ages" },
  { label: "Beach", theme: "BEACH", icon: MapPin, blurb: "Sun, sand & sea" },
  { label: "Luxury", theme: "LUXURY", icon: Sparkles, blurb: "Premium escapes" },
  { label: "Adventure", theme: "ADVENTURE", icon: Plane, blurb: "Thrills & nature" },
];

export default async function HomePage() {
  const [destinations, featured, offers, faqs, reviews] = await Promise.all([
    getPopularDestinations(),
    getFeaturedPackages(6),
    getActiveOffers(),
    getGlobalFaqs(),
    getPublishedReviews(6),
  ]);

  return (
    <>
      {/* HERO — clean light background, no photo */}
      <section className="relative overflow-hidden dotted-bg">
        <div className="absolute inset-0 hero-wash" aria-hidden />
        <Container className="relative py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-orange">
              Complete holiday packages
            </p>
            <h1 className="mt-4 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
              <span className="text-brand-blue">Your holiday.</span>{" "}
              <span className="text-brand-orange">Your way.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-ink-muted">
              Real holiday packages. Clear pricing. Expert support.
            </p>
            <div className="mx-auto mt-9 max-w-2xl">
              <SearchBox />
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-medium text-ink">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-blue" /> 100% real packages</span>
              <span className="hidden text-ink-faint sm:inline">·</span>
              <span className="inline-flex items-center gap-2"><Wallet className="h-4 w-4 text-brand-blue" /> Transparent pricing</span>
              <span className="hidden text-ink-faint sm:inline">·</span>
              <span className="inline-flex items-center gap-2"><Headset className="h-4 w-4 text-brand-blue" /> 24×7 expert support</span>
            </div>
          </div>
        </Container>
      </section>

      {/* POPULAR DESTINATIONS */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="Where to next"
            title="Popular destinations"
            description="Handpicked places our travellers love most."
            action={<Link href="/destinations" className={buttonVariants({ variant: "outline", size: "sm" })}>All destinations</Link>}
          />
          <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-6">
            {destinations.map((d) => (
              <Link
                key={d.id}
                href={`/destinations/${d.slug}`}
                className="group relative w-40 shrink-0 snap-start overflow-hidden rounded-2xl sm:w-auto"
              >
                <div className="relative aspect-[3/4]">
                  <SmartImage src={d.thumbnail} alt={d.name} sizes="(max-width:640px) 40vw, 16vw" imgClassName="transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" aria-hidden />
                  <div className="absolute bottom-0 left-0 p-3">
                    <p className="font-semibold text-white">{d.name}</p>
                    <p className="text-xs text-white/80">{d._count.packages} packages</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* HOLIDAY CATEGORIES */}
      <Section className="bg-surface-muted/60 py-12">
        <Container>
          <SectionHeading eyebrow="Browse by style" title="Holiday categories" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map((c) => (
              <Link
                key={c.theme}
                href={`/packages?theme=${c.theme}`}
                className="group flex flex-col items-start gap-3 rounded-2xl border border-surface-border bg-white p-5 transition-shadow hover:shadow-card"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-white">
                  <c.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-brand-navy">{c.label}</p>
                  <p className="text-xs text-ink-muted">{c.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* FEATURED PACKAGES */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="Ready to book"
            title="Featured packages"
            description="Complete holidays you can customize to your taste."
            action={<Link href="/packages" className={buttonVariants({ variant: "outline", size: "sm" })}>View all packages</Link>}
          />
          {featured.length ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p, i) => (
                <PackageCard key={p.id} pkg={p} priority={i < 3} />
              ))}
            </div>
          ) : (
            <EmptyState title="No packages published yet" description="Once packages are published they'll appear here." action={{ label: "Browse destinations", href: "/destinations" }} />
          )}
        </Container>
      </Section>

      {/* WHY EXPERTZTRIP */}
      <Section id="why" className="bg-surface-muted/60 py-14">
        <Container>
          <SectionHeading eyebrow="Why ExpertzTrip" title="Travel with confidence" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              { icon: BadgeCheck, title: "Real, complete packages", body: "Every trip includes flights, hotels, transfers and activities — no hidden surprises." },
              { icon: Wallet, title: "Clear, server-verified pricing", body: "The price you see is calculated and confirmed on our servers before you ever pay." },
              { icon: Headset, title: "Expert human support", body: "Real travel experts help before, during and after your holiday." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-surface-border bg-white p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orangeLight text-brand-orange">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-ink-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* HOW IT WORKS */}
      <Section id="how-it-works">
        <Container>
          <SectionHeading eyebrow="Simple & transparent" title="How it works" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Search, step: "01", title: "Discover", body: "Search destinations or browse curated holiday packages." },
              { icon: SlidersHorizontal, step: "02", title: "Customize", body: "Make it yours — upgrade hotels, add activities, pick dates." },
              { icon: ShieldCheck, step: "03", title: "Verify & pay", body: "Confirm with a mobile OTP and pay securely via Razorpay." },
              { icon: CreditCard, step: "04", title: "Travel", body: "Get e-tickets & vouchers, then enjoy your trip with support on call." },
            ].map((s) => (
              <div key={s.step} className="relative rounded-2xl border border-surface-border bg-white p-6">
                <span className="text-sm font-bold text-brand-orange">{s.step}</span>
                <span className="mt-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue">
                  <s.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-ink-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* EXPERTZTRIP AI */}
      <Section className="py-6">
        <Container>
          <div className="overflow-hidden rounded-3xl border border-surface-border bg-gradient-to-br from-brand-blue to-brand-blueDark p-8 sm:p-12">
            <div className="grid items-center gap-8 md:grid-cols-2">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white">
                  <Sparkles className="h-4 w-4" /> ExpertzTrip AI
                </span>
                <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">Describe your dream trip. We&apos;ll find the real match.</h2>
                <p className="mt-3 text-white/80">
                  &ldquo;A 6-day Dubai holiday for 2 under ₹1.5 lakh&rdquo; — our assistant searches only real, published packages and shows you the best match, best value and premium options. No made-up prices, ever.
                </p>
                <Link href="/ai" className={buttonVariants({ variant: "orange", className: "mt-6" })}>
                  Try ExpertzTrip AI <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
                <div className="space-y-3 text-sm">
                  <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-white px-4 py-2.5 text-ink">
                    6-day Dubai trip for 2, under ₹1.5 lakh
                  </div>
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white/20 px-4 py-2.5 text-white">
                    Found 2 real matches. &ldquo;Dubai Extravaganza&rdquo; (5N/6D) fits from {formatINR(45000)}/person — want me to open it?
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* OFFERS */}
      {offers.length > 0 && (
        <Section>
          <Container>
            <SectionHeading eyebrow="Save more" title="Current offers" action={<Link href="/offers" className={buttonVariants({ variant: "outline", size: "sm" })}>All offers</Link>} />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {offers.slice(0, 3).map((o) => (
                <Link key={o.id} href={o.ctaHref ?? "/packages"} className="group relative overflow-hidden rounded-2xl border border-surface-border">
                  <div className="relative aspect-[16/10]">
                    <SmartImage src={o.image} alt={o.title} sizes="(max-width:640px) 100vw, 33vw" imgClassName="transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" aria-hidden />
                  </div>
                  <div className="absolute bottom-0 p-5 text-white">
                    {o.badge && <span className="mb-2 inline-block rounded-full bg-brand-orange px-2.5 py-0.5 text-xs font-semibold">{o.badge}</span>}
                    <h3 className="text-lg font-bold">{o.title}</h3>
                    <p className="text-sm text-white/85">{o.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* REAL REVIEWS (only when available) */}
      <Section className="bg-surface-muted/60 py-14">
        <Container>
          <SectionHeading eyebrow="Traveller stories" title="Real reviews" description="Verified reviews from real ExpertzTrip customers." />
          {reviews.length ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-surface-border bg-white p-6">
                  <div className="flex gap-0.5 text-brand-orange">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={i < r.rating ? "h-4 w-4 fill-current" : "h-4 w-4 text-surface-border"} />
                    ))}
                  </div>
                  {r.title && <h3 className="mt-3 font-semibold">{r.title}</h3>}
                  <p className="mt-1.5 text-sm text-ink-muted">{r.body}</p>
                  <p className="mt-4 text-sm font-medium text-brand-navy">{r.customer.fullName ?? "Verified traveller"}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Star className="h-5 w-5" />}
              title="Reviews coming soon"
              description="We only show genuine reviews from verified travellers — they'll appear here as trips complete."
            />
          )}
        </Container>
      </Section>

      {/* FAQ */}
      {faqs.length > 0 && (
        <Section id="faq">
          <Container className="max-w-3xl">
            <SectionHeading eyebrow="Good to know" title="Frequently asked questions" />
            <Accordion items={faqs.map((f) => ({ question: f.question, answer: f.answer }))} />
          </Container>
        </Section>
      )}

      {/* NEWSLETTER */}
      <Section className="pt-0">
        <Container>
          <Newsletter />
        </Container>
      </Section>
    </>
  );
}
