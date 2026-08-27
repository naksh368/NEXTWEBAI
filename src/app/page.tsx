import Link from "next/link";
import {
  Plane, Wallet, TrendingUp, Clock, ShieldCheck, BadgeCheck, Headset, ReceiptText,
  ArrowRight, UserPlus, CreditCard, Search, Ticket, LayoutDashboard, BarChart3,
  LifeBuoy, Check, Building2,
} from "lucide-react";
import { SiteHeader } from "@/components/b2b/site-header";
import { SiteFooter } from "@/components/b2b/site-footer";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  { icon: Plane, title: "Flight Booking", body: "Search and book available flight options with clear, transparent pricing.", soon: false },
  { icon: Wallet, title: "Prepaid Wallet", body: "Add funds securely and use your available balance for eligible bookings.", soon: false },
  { icon: LayoutDashboard, title: "Bookings Dashboard", body: "Track every booking, PNR and status in one organised place.", soon: false },
  { icon: BarChart3, title: "Reports & Exports", body: "See real business figures and export your ledger to CSV anytime.", soon: false },
  { icon: BadgeCheck, title: "Quick KYC", body: "A simple, guided verification to get your agency approved fast.", soon: false },
  { icon: Clock, title: "Future Credit", body: "Build history toward future purchasing-power eligibility.", soon: true },
];

const TRUST_STRIP = [
  { icon: ShieldCheck, label: "Secure & Reliable Booking" },
  { icon: BadgeCheck, label: "Quick KYC Verification" },
  { icon: Headset, label: "Dedicated Agent Support" },
  { icon: ReceiptText, label: "Transparent Pricing" },
];

const VALUE = [
  "One prepaid balance for all your bookings",
  "Clear booking economics and applicable earnings",
  "Every transaction recorded with a reference",
  "Your own agency logo across the portal",
  "Support tickets tracked end-to-end",
  "Reports and CSV exports on demand",
];

const STEPS = [
  { icon: UserPlus, title: "Register your agency", body: "Create your account, verify your email and complete a simple KYC." },
  { icon: CreditCard, title: "Add prepaid balance", body: "Top up your wallet securely and see your available balance instantly." },
  { icon: Search, title: "Search & compare", body: "Find available flight options with clear, transparent pricing." },
  { icon: Ticket, title: "Book & earn", body: "Confirm bookings from your balance and track applicable earnings." },
];

const FAQS = [
  { q: "Who can register on ExpertzTrip?", a: "ExpertzTrip is built for travel agencies and agents in India. You register your agency, complete a quick KYC, and once approved you get access to the partner portal." },
  { q: "How does the prepaid balance work?", a: "You add funds to your agency wallet through a secure payment. Your available balance is credited only after the payment is verified on our servers, and every transaction is recorded with a reference." },
  { q: "How long does approval take?", a: "After you submit your application it moves to KYC review. Our team reviews your documents and updates your status — you'll be notified by email at every step." },
  { q: "Is my data and are my documents secure?", a: "Yes. Your KYC documents are stored privately and are only accessible to you and our review team. Payments are verified server-side and your account is protected with secure sessions." },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        {/* HERO */}
        <section className="hero-wash border-b border-surface-border">
          <div className="mx-auto grid w-full max-w-[1200px] items-center gap-10 px-5 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24 lg:px-8">
            <div className="text-center lg:text-left">
              <Badge tone="info" className="uppercase tracking-wide">India&apos;s Smarter B2B Travel Platform</Badge>
              <h1 className="mx-auto mt-5 max-w-xl text-[2rem] font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:mx-0">
                <span className="text-brand-blue">Find Better Flights.</span>{" "}
                <span className="text-brand-orange">Earn More.</span>{" "}
                <span className="text-brand-blue">Grow Your Business.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-lg text-base text-ink-muted sm:text-lg lg:mx-0">
                Powerful tools, competitive fares and a simpler booking experience built for travel agents.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-start justify-center">
                <Link href="/register" className={buttonVariants({ variant: "orange", size: "lg", className: "w-full sm:w-auto" })}>
                  Register Your Agency <ArrowRight size={18} />
                </Link>
                <Link href="/login" className={buttonVariants({ variant: "primary", size: "lg", className: "w-full sm:w-auto" })}>
                  Login <ArrowRight size={18} />
                </Link>
              </div>
              <p className="mt-5 text-sm text-ink-faint">No setup fees · Quick KYC · Dedicated support</p>
            </div>

            {/* Premium honest visual — a flight-route motif, no fares/prices */}
            <div id="flights" className="relative mx-auto w-full max-w-md scroll-mt-24">
              <RouteCard />
            </div>
          </div>
        </section>

        {/* TRUST STRIP */}
        <section className="border-b border-surface-border bg-white">
          <div className="mx-auto grid w-full max-w-[1200px] gap-4 px-5 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
            {TRUST_STRIP.map((t) => (
              <div key={t.label} className="flex items-center gap-2.5 text-sm font-semibold text-ink">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-orangeLight text-brand-orange"><t.icon size={18} /></span>
                {t.label}
              </div>
            ))}
          </div>
        </section>

        {/* FEATURE CARDS */}
        <section id="why" className="mx-auto w-full max-w-[1200px] px-5 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-wide text-brand-orange">Why ExpertzTrip</p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Everything you need to run your travel business</h2>
            <p className="mt-3 text-ink-muted">A single platform for booking, payments, reporting and support.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-surface-border bg-white p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-cardHover">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-white">
                    <f.icon size={22} />
                  </span>
                  {f.soon && <Badge tone="brand">SOON</Badge>}
                </div>
                <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-ink-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* VALUE / SPLIT SECTION */}
        <section id="for-agents" className="border-y border-surface-border bg-surface-muted/40">
          <div className="mx-auto grid w-full max-w-[1200px] items-center gap-10 px-5 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-brand-orange">Built for agencies</p>
              <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">A professional operating system for your agency</h2>
              <p className="mt-3 text-ink-muted">Run bookings, payments and reporting from one place — with your own branding and transparent transactions throughout.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/register" className={buttonVariants({ variant: "orange" })}>Register Your Agency <ArrowRight size={18} /></Link>
              </div>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {VALUE.map((v) => (
                <li key={v} className="flex items-start gap-2.5 rounded-xl border border-surface-border bg-white p-3.5 text-sm font-medium text-ink shadow-card">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-blue text-white"><Check size={12} /></span>
                  {v}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="mx-auto w-full max-w-[1200px] px-5 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-wide text-brand-orange">How It Works</p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">From registration to your first booking</h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl border border-surface-border bg-white p-6 shadow-card">
                <span className="absolute right-5 top-4 text-3xl font-extrabold text-brand-blueLight">{i + 1}</span>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-orangeLight text-brand-orange"><s.icon size={22} /></span>
                <h3 className="mt-4 text-base font-bold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-ink-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-surface-border bg-surface-muted/40">
          <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-wide text-brand-orange">FAQ</p>
              <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Questions, answered</h2>
            </div>
            <div className="mt-8 space-y-3">
              {FAQS.map((f) => (
                <details key={f.q} className="group rounded-xl border border-surface-border bg-white p-4 shadow-card">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold text-ink">
                    {f.q}
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blueLight text-brand-blue transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-ink-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* TRUST BAND */}
        <section className="border-y border-surface-border bg-brand-blue">
          <div className="mx-auto w-full max-w-[1200px] px-5 py-16 text-center sm:px-6 lg:px-8">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/70">Built for India&apos;s Travel Agent Network</p>
            <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-extrabold text-white">A serious platform for serious travel businesses</h2>
            <div className="mx-auto mt-8 flex max-w-4xl flex-wrap items-center justify-center gap-2.5">
              {["Built for Travel Agents", "Secure Booking", "Prepaid Booking Balance", "Fast Support", "Transparent Transactions"].map((p) => (
                <span key={p} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20">
                  <Building2 size={15} className="text-white/90" /> {p}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="mx-auto w-full max-w-[1200px] px-5 py-20 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Ready to grow your travel business?</h2>
          <p className="mx-auto mt-3 max-w-md text-ink-muted">Register your agency today and start booking with a platform built for agents.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/register" className={buttonVariants({ variant: "orange", size: "lg", className: "w-full sm:w-auto" })}>
              Register Your Agency <ArrowRight size={18} />
            </Link>
            <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg", className: "w-full sm:w-auto !text-brand-blue !border-brand-blue/30" })}>
              <LifeBuoy size={18} /> Partner Login
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

/** Honest premium hero visual: a flight-route motif (no fares, no balances). */
function RouteCard() {
  return (
    <div className="rounded-3xl border border-surface-border bg-white p-6 shadow-card sm:p-8">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-sm font-bold text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blueLight text-brand-blue"><Plane size={16} /></span>
          Your partner portal
        </span>
        <Badge tone="success">Live</Badge>
      </div>

      {/* Route arc */}
      <div className="relative mt-6">
        <svg viewBox="0 0 320 120" className="w-full" role="img" aria-label="Flight route from Delhi to Dubai">
          <defs>
            <linearGradient id="arc" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#2340D9" />
              <stop offset="1" stopColor="#FF6A1A" />
            </linearGradient>
          </defs>
          <path d="M30 95 Q160 -10 290 95" fill="none" stroke="url(#arc)" strokeWidth="2.5" strokeDasharray="6 7" strokeLinecap="round" />
          <circle cx="30" cy="95" r="7" fill="#2340D9" />
          <circle cx="290" cy="95" r="7" fill="#FF6A1A" />
          <g transform="translate(152,18) rotate(35)">
            <path d="M2 12 L22 4 L18 12 L22 20 Z" fill="#16171C" />
          </g>
        </svg>
        <div className="flex items-center justify-between px-1 text-xs font-bold text-ink">
          <span>DEL <span className="font-medium text-ink-faint">New Delhi</span></span>
          <span>DXB <span className="font-medium text-ink-faint">Dubai</span></span>
        </div>
      </div>

      {/* Portal chips (structure only — no numbers) */}
      <div className="mt-6 grid grid-cols-2 gap-2.5">
        {[
          { icon: Wallet, label: "Wallet" },
          { icon: Plane, label: "Flights" },
          { icon: LayoutDashboard, label: "Bookings" },
          { icon: BarChart3, label: "Reports" },
        ].map((c) => (
          <div key={c.label} className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-muted/50 px-3 py-2.5 text-sm font-semibold text-ink">
            <c.icon size={16} className="text-brand-blue" /> {c.label}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-3 text-white">
        <TrendingUp size={16} /> <span className="text-sm font-semibold">Everything in one place</span>
      </div>
    </div>
  );
}
