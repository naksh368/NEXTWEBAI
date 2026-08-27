import Link from "next/link";
import {
  ShieldCheck, BadgeCheck, Users, ArrowRight, Plane, Wallet,
  LayoutDashboard, FileBarChart, FileCheck2, CreditCard, Headset,
  ReceiptText, Building2, RefreshCcw, Layers, Sparkles,
  Lock, KeyRound, ServerCog, ScrollText,
} from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { PortalPreview } from "@/components/home/portal-preview";

export const metadata = {
  title: "India's Smarter B2B Travel Platform",
};

/* ── Core feature cards (spec §7) ── */
const FEATURES = [
  { icon: Plane, title: "Flight Booking", body: "Search and book available flight options with fares revalidated before you pay." },
  { icon: Wallet, title: "Prepaid Booking Balance", body: "Add verified funds and use your available booking balance across the portal." },
  { icon: LayoutDashboard, title: "Bookings Dashboard", body: "Track bookings, PNRs, tickets and status from one organised dashboard." },
  { icon: FileBarChart, title: "Reports & Exports", body: "Understand business activity and export reports whenever you need them." },
  { icon: FileCheck2, title: "Quick KYC", body: "Complete a guided agency verification process with clear progress." },
  { icon: CreditCard, title: "ExpertzCredit", body: "Build history toward future purchasing-power eligibility.", soon: true },
];

/* ── Trust strip (spec §8) — honest capability claims, no fabricated metrics ── */
const TRUST = [
  { icon: ShieldCheck, label: "Secure & Reliable Booking" },
  { icon: BadgeCheck, label: "Verified Payments" },
  { icon: FileCheck2, label: "Quick KYC Process" },
  { icon: Headset, label: "Dedicated Agent Support" },
  { icon: ReceiptText, label: "Transparent Transactions" },
];

/* ── Why ExpertzTrip benefit groups (spec §9) ── */
const BENEFITS = [
  { icon: Wallet, title: "One Prepaid Balance", body: "Manage eligible bookings from a single balance you control." },
  { icon: ReceiptText, title: "Clear Transactions", body: "Every wallet and payment movement has a reference you can trace." },
  { icon: Building2, title: "Your Agency Branding", body: "Your agency logo appears inside your own partner portal." },
  { icon: LayoutDashboard, title: "Booking History", body: "Keep your booking activity organised and searchable." },
  { icon: RefreshCcw, title: "Refund Tracking", body: "Track post-booking financial activity end to end." },
  { icon: FileBarChart, title: "Reports & Exports", body: "Access business information whenever you need it." },
  { icon: Headset, title: "Support Management", body: "Keep your support requests organised in one place." },
  { icon: Layers, title: "Built for Scale", body: "Architecture designed for your future expansion." },
];

/* ── How it works (spec §10) ── */
const STEPS = [
  { n: "01", title: "Register", body: "Create your agency account in minutes." },
  { n: "02", title: "Verify", body: "Complete business and KYC verification." },
  { n: "03", title: "Add Balance", body: "Top up your prepaid booking balance securely." },
  { n: "04", title: "Search & Book", body: "Find available flights and complete the booking." },
  { n: "05", title: "Grow", body: "Track your business, earnings and activity." },
];

/* ── Illustrative flight routes (spec §27) ── */
const ROUTES = [
  { from: "Delhi", to: "Mumbai", stops: "Non-stop", fare: "₹4,299" },
  { from: "Mumbai", to: "Dubai", stops: "1 stop", fare: "₹18,750" },
  { from: "Hyderabad", to: "Goa", stops: "Non-stop", fare: "₹3,150" },
];

export default function HomePage() {
  return (
    <>
      {/* ───────────────────────── HERO ───────────────────────── */}
      <section className="b2b-hero relative overflow-hidden">
        <Container className="relative py-12 sm:py-16 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            {/* left */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue/15 bg-white/70 px-3.5 py-1.5 text-sm font-semibold text-brand-blue shadow-sm backdrop-blur">
                <Sparkles className="h-4 w-4" /> India&apos;s Smarter B2B Travel Platform
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.25rem]">
                <span className="text-brand-blue">Find Better Flights.</span>
                <br />
                <span className="text-brand-orange">Earn More.</span>
                <br />
                <span className="text-brand-blue">Grow Your Business.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-ink-muted">
                Powerful tools, smarter booking workflows and transparent business tools built for travel agents.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/register" className={buttonVariants({ variant: "orange", size: "lg" })}>
                  Register Your Agency <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/login" className={buttonVariants({ variant: "primary", size: "lg" })}>
                  Login <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-ink">
                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-blue" /> Secure Platform</span>
                <span className="hidden text-ink-faint sm:inline">·</span>
                <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-brand-blue" /> Quick Verification</span>
                <span className="hidden text-ink-faint sm:inline">·</span>
                <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-brand-blue" /> Built for Travel Agents</span>
              </div>
            </div>

            {/* right — portal preview */}
            <div className="lg:pl-4">
              <PortalPreview />
            </div>
          </div>
        </Container>
      </section>

      {/* ───────────────────── CORE FEATURES ───────────────────── */}
      <Section id="features" className="py-14">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-orange">Core platform</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Everything you need to book and grow</h2>
            <p className="mt-3 text-ink-muted">A focused toolset built around how travel agents actually work.</p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="group relative rounded-2xl border border-surface-border bg-white p-6 transition-shadow hover:shadow-card">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-white">
                    <f.icon className="h-5 w-5" />
                  </span>
                  {f.soon && (
                    <span className="rounded-full bg-brand-orangeLight px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-orange">Soon</span>
                  )}
                </div>
                <h3 className="mt-4 text-base font-bold text-brand-navy">{f.title}</h3>
                <p className="mt-1.5 text-sm text-ink-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ─────────────────────── TRUST STRIP ─────────────────────── */}
      <div className="border-y border-surface-border bg-surface-muted/60">
        <Container className="py-5">
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center">
            {TRUST.map((t) => (
              <li key={t.label} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-navy">
                <t.icon className="h-4 w-4 text-brand-blue" /> {t.label}
              </li>
            ))}
          </ul>
        </Container>
      </div>

      {/* ───────────────────── WHY EXPERTZTRIP ───────────────────── */}
      <Section id="why" className="grid-bg py-16">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-orange">Why ExpertzTrip</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Everything your agency needs to run smarter.
              </h2>
              <p className="mt-4 text-ink-muted">
                One platform for bookings, prepaid balance, reporting, support and future growth — built for the way travel agents run their business.
              </p>
              <Link href="/register" className={buttonVariants({ variant: "orange", className: "mt-7" })}>
                Register Your Agency <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {BENEFITS.map((b) => (
                <div key={b.title} className="rounded-2xl border border-surface-border bg-white p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue">
                    <b.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3.5 text-[15px] font-bold text-brand-navy">{b.title}</h3>
                  <p className="mt-1 text-sm text-ink-muted">{b.body}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* ─────────────────────── HOW IT WORKS ─────────────────────── */}
      <Section id="how-it-works" className="py-16">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-orange">How it works</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">From sign-up to your first booking</h2>
          </div>
          <div className="relative mt-12">
            {/* connecting line */}
            <div className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-brand-blue/25 to-transparent lg:block" aria-hidden />
            <ol className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {STEPS.map((s) => (
                <li key={s.n} className="relative text-center lg:text-left">
                  <span className="relative z-10 mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-brand-blue/20 bg-white text-sm font-extrabold text-brand-blue shadow-sm lg:mx-0">
                    {s.n}
                  </span>
                  <h3 className="mt-4 font-bold text-brand-navy">{s.title}</h3>
                  <p className="mt-1 text-sm text-ink-muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      {/* ───────────────────────── EXPERTZWALLET ───────────────────────── */}
      <Section id="wallet" className="py-6">
        <Container>
          <div className="overflow-hidden rounded-3xl border border-surface-border bg-gradient-to-br from-brand-blue to-brand-blueDark">
            <div className="grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-2">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-white/70">ExpertzWallet</p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Your money. Your visibility.</h2>
                <p className="mt-4 text-white/80">
                  A prepaid booking balance with a clear ledger. Top up securely, hold funds for bookings, and see every movement with a reference.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/register" className={buttonVariants({ variant: "orange" })}>Add Money</Link>
                  <Link href="/login" className={buttonVariants({ variant: "outline", className: "!border-white/30 !bg-white/10 !text-white hover:!bg-white/20 hover:!text-white" })}>
                    View Transactions
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: "Available", value: "₹25,450", tone: "text-brand-navy" },
                    { label: "On Hold", value: "₹4,500", tone: "text-warning" },
                    { label: "Total", value: "₹29,950", tone: "text-brand-blue" },
                  ].map((c) => (
                    <div key={c.label} className="rounded-xl border border-surface-border bg-surface-muted/50 p-3">
                      <p className={`text-lg font-extrabold ${c.tone}`}>{c.value}</p>
                      <p className="mt-0.5 text-[11px] font-medium text-ink-muted">{c.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  {[
                    { label: "Wallet Top-up", amount: "+₹10,000", status: "SUCCESS", tone: "text-success" },
                    { label: "Flight Booking", amount: "−₹4,500", status: "CONFIRMED", tone: "text-ink" },
                    { label: "Refund", amount: "+₹1,200", status: "CREDITED", tone: "text-brand-blue" },
                  ].map((t) => (
                    <div key={t.label} className="flex items-center justify-between rounded-xl border border-surface-border px-3.5 py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-brand-navy">{t.label}</p>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">{t.status}</p>
                      </div>
                      <span className={`text-sm font-bold ${t.tone}`}>{t.amount}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-center text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                  Illustrative preview · production shows real authenticated data
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ───────────────────── FLIGHT BOOKING PREVIEW ───────────────────── */}
      <Section id="flights" className="py-16">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-orange">Search. Compare. Book.</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Live fares inside your Partner Portal</h2>
            <p className="mt-3 text-ink-muted">A preview of the routes agents book every day.</p>
          </div>
          <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border border-surface-border bg-white">
            {ROUTES.map((r, i) => (
              <div key={`${r.from}-${r.to}`} className={`flex items-center gap-4 p-4 sm:px-6 ${i > 0 ? "border-t border-surface-border" : ""}`}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue">
                  <Plane className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-brand-navy">
                    {r.from} <ArrowRight className="inline h-3.5 w-3.5 text-ink-faint" /> {r.to}
                  </p>
                  <p className="text-xs text-ink-muted">{r.stops}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold text-brand-navy">{r.fare}</p>
                  <p className="text-[11px] text-ink-faint">from</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs font-medium text-ink-faint">
            Illustrative preview · live fares available inside the Partner Portal.
          </p>
        </Container>
      </Section>

      {/* ───────────────────────── SECURITY ───────────────────────── */}
      <Section className="bg-surface-muted/50 py-16">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-orange">Security first</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Serious infrastructure for serious business</h2>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Lock, title: "Server-verified payments", body: "Wallet credits happen only after trusted server-side verification." },
              { icon: KeyRound, title: "Role-based access", body: "Every action is authorised on the server, per agency and per role." },
              { icon: ServerCog, title: "Tenant isolation", body: "Your wallet, bookings and documents are visible only to your agency." },
              { icon: ScrollText, title: "Audit logs", body: "Sensitive actions are recorded so nothing is a black box." },
            ].map((s) => (
              <div key={s.title} className="rounded-2xl border border-surface-border bg-white p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue">
                  <s.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-bold text-brand-navy">{s.title}</h3>
                <p className="mt-1.5 text-sm text-ink-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ─────────────────── EXPERTZCREDIT — COMING SOON ─────────────────── */}
      <Section className="py-6">
        <Container>
          <div className="rounded-3xl border border-dashed border-brand-blue/25 bg-brand-blueLight/40 p-8 text-center sm:p-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-blue shadow-sm">
              <CreditCard className="h-3.5 w-3.5" /> ExpertzCredit · Coming Soon
            </span>
            <h2 className="mx-auto mt-4 max-w-2xl text-2xl font-extrabold tracking-tight sm:text-3xl">
              Build your history toward future purchasing-power eligibility
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-ink-muted">
              As you book and pay through ExpertzTrip, you build the payment history that supports future eligibility — subject to eligibility and applicable requirements. No credit limits are offered today.
            </p>
          </div>
        </Container>
      </Section>

      {/* ───────────────────────── FINAL CTA ───────────────────────── */}
      <Section className="py-16">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-orange">Built for India&apos;s travel agent network</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Your agency. One smarter platform.</h2>
            <p className="mt-3 text-ink-muted">Secure booking · verified payments · prepaid booking balance · dedicated support.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/register" className={buttonVariants({ variant: "orange", size: "lg" })}>
                Register Your Agency <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className={buttonVariants({ variant: "primary", size: "lg" })}>
                Login <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
