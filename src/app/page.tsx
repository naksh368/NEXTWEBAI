import Link from "next/link";
import {
  Plane, Wallet, TrendingUp, Clock, ShieldCheck, BadgeCheck,
  Headset, ReceiptText, ArrowRight, UserPlus, LogIn, Search, CreditCard, Ticket,
} from "lucide-react";
import { SiteHeader } from "@/components/b2b/site-header";
import { SiteFooter } from "@/components/b2b/site-footer";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  { icon: Plane, title: "Best Fares", body: "Compare and book available flight options.", soon: false },
  { icon: Wallet, title: "Prepaid Wallet", body: "Add funds and use your available balance for eligible bookings.", soon: false },
  { icon: TrendingUp, title: "Higher Earnings", body: "See clear booking economics and applicable earnings.", soon: false },
  { icon: Clock, title: "Future Credit", body: "Build history for future credit eligibility.", soon: true },
];

const TRUST_STRIP = [
  { icon: ShieldCheck, label: "Secure & Reliable Booking" },
  { icon: BadgeCheck, label: "Quick KYC Verification" },
  { icon: Headset, label: "Dedicated Agent Support" },
  { icon: ReceiptText, label: "Transparent Pricing" },
];

const TRUST_POINTS = [
  { icon: Plane, label: "Built for Travel Agents" },
  { icon: ShieldCheck, label: "Secure Booking" },
  { icon: Wallet, label: "Prepaid Booking Balance" },
  { icon: Headset, label: "Fast Support" },
  { icon: ReceiptText, label: "Transparent Transactions" },
];

const STEPS = [
  { icon: UserPlus, title: "Register your agency", body: "Create your account, verify your email and complete a simple KYC." },
  { icon: CreditCard, title: "Add prepaid balance", body: "Top up your wallet securely and see your available balance instantly." },
  { icon: Search, title: "Search & compare", body: "Find available flight options with clear, transparent pricing." },
  { icon: Ticket, title: "Book & earn", body: "Confirm bookings from your balance and track applicable earnings." },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        {/* HERO */}
        <section className="dotted-bg border-b border-surface-border">
          <div className="mx-auto grid w-full max-w-[1200px] items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-24 lg:px-8">
            <div>
              <Badge tone="info" className="uppercase tracking-wide">India&apos;s Smarter B2B Travel Platform</Badge>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
                <span className="text-brand-blue">Find Better Flights.</span><br />
                <span className="text-brand-orange">Earn More.</span><br />
                <span className="text-brand-blue">Grow Your Business.</span>
              </h1>
              <p className="mt-5 max-w-lg text-lg text-ink-muted">
                Powerful tools, competitive fares and a simpler booking experience built for travel agents.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className={buttonVariants({ variant: "orange", size: "lg" })}>
                  Register Your Agency <ArrowRight size={18} />
                </Link>
                <Link href="/login" className={buttonVariants({ variant: "primary", size: "lg" })}>
                  Login <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            {/* Premium visual — a compact "fare board" card, restrained, no photo. */}
            <div className="relative mx-auto w-full max-w-md" id="flights">
              <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-ink">Available fares</p>
                  <Badge tone="success">Live pricing</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    { r: "DEL → BOM", t: "06:20 · Non-stop", p: "₹4,299" },
                    { r: "BLR → DXB", t: "23:05 · 1 stop", p: "₹18,750" },
                    { r: "HYD → GOI", t: "09:40 · Non-stop", p: "₹3,150" },
                  ].map((f) => (
                    <div key={f.r} className="flex items-center justify-between rounded-xl border border-surface-border bg-surface-muted/50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-blueLight text-brand-blue">
                          <Plane size={16} />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-ink">{f.r}</p>
                          <p className="text-xs text-ink-faint">{f.t}</p>
                        </div>
                      </div>
                      <p className="text-sm font-extrabold text-brand-blue">{f.p}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-brand-blue px-4 py-3 text-white">
                  <span className="text-sm font-semibold">Prepaid balance</span>
                  <span className="text-sm font-extrabold">Ready to book</span>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-ink-faint">Illustrative preview · real fares appear inside the portal</p>
            </div>
          </div>
        </section>

        {/* FEATURE CARDS */}
        <section id="why" className="mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-surface-border bg-white p-6 shadow-card transition-shadow hover:shadow-cardHover">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue">
                    <f.icon size={20} />
                  </span>
                  {f.soon && <Badge tone="brand">SOON</Badge>}
                </div>
                <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-ink-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TRUST STRIP */}
        <section className="border-y border-surface-border bg-surface-muted/50">
          <div className="mx-auto grid w-full max-w-[1200px] gap-4 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
            {TRUST_STRIP.map((t) => (
              <div key={t.label} className="flex items-center gap-2.5 text-sm font-semibold text-ink">
                <t.icon size={18} className="text-brand-orange" />
                {t.label}
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wide text-brand-orange">How It Works</p>
            <h2 className="mt-2 text-3xl font-extrabold">From registration to your first booking</h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl border border-surface-border bg-white p-6 shadow-card">
                <span className="absolute right-5 top-5 text-3xl font-extrabold text-brand-blueLight">{i + 1}</span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orangeLight text-brand-orange">
                  <s.icon size={20} />
                </span>
                <h3 className="mt-4 text-base font-bold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-ink-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TRUST SECTION — no fabricated stats (spec §2, §38) */}
        <section id="for-agents" className="border-y border-surface-border bg-brand-blue">
          <div className="mx-auto w-full max-w-[1200px] px-4 py-16 text-center sm:px-6 lg:px-8">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/70">Built for India&apos;s Travel Agent Network</p>
            <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-extrabold text-white">
              A serious platform for serious travel businesses
            </h2>
            <div className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-3">
              {TRUST_POINTS.map((p) => (
                <span key={p.label} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20">
                  <p.icon size={16} className="text-white/90" />
                  {p.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="mx-auto w-full max-w-[1200px] px-4 py-20 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Ready to grow your travel business?</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className={buttonVariants({ variant: "orange", size: "lg" })}>
              Register Your Agency <ArrowRight size={18} />
            </Link>
            <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg", className: "!text-brand-blue !border-brand-blue/30" })}>
              <LogIn size={18} /> Partner Login
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
