import Link from "next/link";
import {
  ArrowRight, Star, Tag, Wallet, TrendingUp, CreditCard,
  ShieldCheck, BadgeCheck, Headset, ReceiptText, LogIn,
  UserPlus, PhoneCall, IndianRupee, PlaneTakeoff, LineChart,
  Building2, Lock, Sparkles,
} from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { AirplaneWindow } from "@/components/marketing/airplane-window";
import { formatINR } from "@/lib/utils";

export const metadata = {
  title: "ExpertzTrip — India's Smarter B2B Travel Platform for Agents",
  description:
    "Find better flights, earn more and grow your agency. Powerful tools, competitive fares, a prepaid wallet and a simpler booking experience built for India's travel agents.",
};

/* ── Section 7 · Four benefit cards ──────────────────────────────────────── */
const BENEFITS = [
  { icon: Tag, title: "Best Fares", body: "Compare and book the best available flight options in one place." },
  { icon: Wallet, title: "Prepaid Wallet", body: "Add funds and use your available balance for instant bookings." },
  { icon: TrendingUp, title: "Higher Earnings", body: "See clear booking economics and your applicable agent earnings." },
  { icon: CreditCard, title: "Future Credit", body: "Build history now for future credit eligibility.", soon: true },
];

/* ── Section 8 · Trust strip ─────────────────────────────────────────────── */
const TRUST = [
  { icon: ShieldCheck, label: "Secure & Reliable Booking" },
  { icon: BadgeCheck, label: "Quick KYC Verification" },
  { icon: Headset, label: "Dedicated Agent Support" },
  { icon: ReceiptText, label: "Transparent Pricing" },
];

/* ── Section 5 · How it works ────────────────────────────────────────────── */
const STEPS = [
  { icon: UserPlus, step: "01", title: "Register", body: "Create your agency profile with business details." },
  { icon: PhoneCall, step: "02", title: "Verify", body: "Confirm your mobile and email, then complete KYC." },
  { icon: IndianRupee, step: "03", title: "Add Funds", body: "Top up your prepaid wallet securely to start booking." },
  { icon: PlaneTakeoff, step: "04", title: "Book", body: "Search fares, book flights and issue confirmed tickets." },
  { icon: LineChart, step: "05", title: "Grow", body: "Track earnings and scale your travel business." },
];

/* ── Section 12 · Why ExpertzTrip ────────────────────────────────────────── */
const WHY = [
  { icon: Tag, title: "Competitive fares", body: "Search across airlines and book the best available option for your customer — without juggling multiple portals." },
  { icon: Wallet, title: "A real prepaid wallet", body: "Every rupee is tracked in an auditable ledger. Balances move only when a payment or booking actually clears." },
  { icon: ShieldCheck, title: "Confirmed tickets only", body: "A ticket is shown as confirmed only once the airline/supplier confirms it — never a fake PNR, never a guess." },
  { icon: TrendingUp, title: "Transparent earnings", body: "Clear booking economics on every transaction, so you always know your applicable agent earnings." },
];

export default function HomePage() {
  return (
    <>
      {/* ───────────────────────── HERO ───────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hero-wash" aria-hidden />
        <Container className="relative py-14 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
            {/* Left — copy + CTAs */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-blueLight bg-brand-blueLight px-3.5 py-1.5 text-sm font-semibold text-brand-blue">
                <Star className="h-4 w-4 fill-current" />
                India&apos;s Smarter B2B Travel Platform
              </span>

              <h1 className="mt-5 text-[2.75rem] font-extrabold leading-[1.03] tracking-tight sm:text-6xl">
                <span className="block text-brand-navy">Find Better Flights.</span>
                <span className="block text-brand-orange">Earn More.</span>
                <span className="block text-brand-navy">Grow Your Business.</span>
              </h1>

              <p className="mt-5 max-w-lg text-lg text-ink-muted">
                Powerful tools, competitive fares and a simpler booking experience
                built for travel agents.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className={buttonVariants({ variant: "orange", size: "lg", className: "sm:min-w-[15rem]" })}>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="flex items-center gap-2 text-base font-extrabold">
                      Register Your Agency <ArrowRight className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-medium text-white/85">Join thousands of travel agents</span>
                  </div>
                </Link>
                <Link href="/partner-login" className={buttonVariants({ variant: "outline", size: "lg", className: "border-brand-blueLight bg-white text-brand-blue hover:border-brand-blue hover:text-brand-blue sm:min-w-[13rem]" })}>
                  <span className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blueLight text-brand-blue"><Lock className="h-4 w-4" /></span>
                    <span className="flex flex-col items-start leading-tight">
                      <span className="text-base font-extrabold">Partner Login</span>
                      <span className="text-xs font-medium text-ink-muted">Access your dashboard</span>
                    </span>
                  </span>
                </Link>
              </div>
            </div>

            {/* Right — airplane-window visual */}
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <AirplaneWindow />
            </div>
          </div>
        </Container>
      </section>

      {/* ─────────────────── FOUR BENEFIT CARDS ─────────────────── */}
      <Section id="benefits" className="pt-4 sm:pt-6">
        <Container>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="group relative rounded-2xl border border-surface-border bg-white p-6 shadow-card transition-shadow hover:shadow-cardHover"
              >
                {b.soon && (
                  <span className="absolute right-4 top-4 rounded-full bg-brand-orangeLight px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-orangeDark">
                    Soon
                  </span>
                )}
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue">
                  <b.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-base font-extrabold text-brand-navy">{b.title}</h3>
                <p className="mt-1.5 text-sm text-ink-muted">{b.body}</p>
              </div>
            ))}
          </div>

          {/* ─────────────── SMALL TRUST STRIP ─────────────── */}
          <div className="mt-5 rounded-2xl border border-surface-border bg-white px-2 py-1 shadow-card">
            <div className="grid grid-cols-1 divide-y divide-surface-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
              {TRUST.map((t) => (
                <div key={t.label} className="flex items-center justify-center gap-2.5 px-4 py-3.5">
                  <t.icon className="h-5 w-5 shrink-0 text-brand-orange" />
                  <span className="text-sm font-semibold text-brand-navy">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* ───────────────────── WHY EXPERTZTRIP ───────────────────── */}
      <Section id="why" className="bg-surface-muted/50">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-orange">Why ExpertzTrip</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Built for serious travel agents</h2>
            <p className="mt-3 text-ink-muted">
              A financially responsible platform — real money, real tickets, real
              accountability — designed to help your agency grow.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((f) => (
              <div key={f.title} className="rounded-2xl border border-surface-border bg-white p-6 shadow-card transition-shadow hover:shadow-cardHover">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-bold text-brand-navy">{f.title}</h3>
                <p className="mt-1.5 text-sm text-ink-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ─────────────────────── HOW IT WORKS ─────────────────────── */}
      <Section id="how-it-works">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-orange">Simple &amp; transparent</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">How it works</h2>
            <p className="mt-3 text-ink-muted">From registration to your first confirmed ticket — five clear steps.</p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s) => (
              <div key={s.step} className="relative rounded-2xl border border-surface-border bg-white p-6 shadow-card">
                <span className="text-sm font-extrabold text-brand-orange">{s.step}</span>
                <span className="mt-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue">
                  <s.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-bold text-brand-navy">{s.title}</h3>
                <p className="mt-1.5 text-sm text-ink-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ─────────────────────── WALLET PREVIEW ─────────────────────── */}
      <Section id="wallet" className="bg-surface-muted/50">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-orange">Prepaid wallet</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">One balance. Every booking. Fully auditable.</h2>
              <p className="mt-3 text-ink-muted">
                Top up securely and book in seconds. Every credit and debit is written
                to a transaction ledger, so your balance is always reconciled — funds
                move only when a payment or booking actually clears.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Secure top-ups through a real payment gateway",
                  "Balance on hold during booking, released if it fails",
                  "Complete, exportable transaction history",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm font-medium text-brand-navy">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" /> {t}
                  </li>
                ))}
              </ul>
              <Link href="/register" className={buttonVariants({ variant: "orange", className: "mt-7" })}>
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Wallet card mock — clearly illustrative sample figures */}
            <div className="rounded-3xl border border-surface-border bg-white p-6 shadow-cardHover sm:p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink-muted">
                  <Wallet className="h-4 w-4 text-brand-blue" /> Available balance
                </div>
                <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-ink-faint">Sample</span>
              </div>
              <p className="mt-1 text-4xl font-extrabold tracking-tight text-brand-navy">{formatINR(24500)}<span className="text-lg text-ink-faint">.00</span></p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-brand-blueLight px-4 py-3 text-center text-sm font-bold text-brand-blue">Add Money</div>
                <div className="rounded-xl border border-surface-border px-4 py-3 text-center text-sm font-bold text-ink">Transactions</div>
              </div>
              <div className="mt-6 space-y-3">
                {[
                  { label: "Wallet top-up", amt: 5000, kind: "credit", state: "SUCCESS" },
                  { label: "Flight booking", amt: -3250, kind: "debit", state: "CONFIRMED" },
                  { label: "Refund", amt: 1100, kind: "credit", state: "CREDITED" },
                ].map((tx) => (
                  <div key={tx.label} className="flex items-center justify-between rounded-xl border border-surface-border px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-brand-navy">{tx.label}</p>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{tx.state}</p>
                    </div>
                    <p className={tx.kind === "credit" ? "text-sm font-extrabold text-success" : "text-sm font-extrabold text-brand-navy"}>
                      {tx.kind === "credit" ? "+ " : "− "}{formatINR(Math.abs(tx.amt))}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-center text-[11px] text-ink-faint">Illustrative sample — not real account activity.</p>
            </div>
          </div>
        </Container>
      </Section>

      {/* ─────────────────────── FUTURE CREDIT ─────────────────────── */}
      <Section id="credit">
        <Container>
          <div className="overflow-hidden rounded-3xl border border-surface-border bg-white shadow-card">
            <div className="grid items-center gap-6 p-8 sm:p-10 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-orangeLight px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-orangeDark">
                  <Sparkles className="h-3.5 w-3.5" /> Coming soon
                </span>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-brand-navy sm:text-3xl">Future credit for growing agencies</h2>
                <p className="mt-3 max-w-xl text-ink-muted">
                  Build your ExpertzTrip history today for future purchasing-power
                  opportunities. Eligibility may depend on business verification,
                  booking activity, payment history and applicable requirements.
                  Approval is never guaranteed.
                </p>
              </div>
              <div className="rounded-2xl bg-brand-blueLight/70 p-6">
                <CreditCard className="h-8 w-8 text-brand-blue" />
                <p className="mt-3 text-sm font-semibold text-brand-navy">
                  Start with a verified agency and an active prepaid wallet — the two
                  building blocks of future eligibility.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ─────────────────── TRUST / PARTNERS (neutral) ─────────────────── */}
      <Section className="bg-surface-muted/50 py-14">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-orange">Trusted foundation</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Built for India&apos;s travel-agent network</h2>
            <p className="mt-3 text-ink-muted">
              A secure, financially responsible platform designed for agencies across
              India. Supplier and airline integrations are shown only where a real
              relationship exists.
            </p>
          </div>
          <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: ShieldCheck, label: "Secure by design" },
              { icon: Building2, label: "Business-verified agents" },
              { icon: ReceiptText, label: "Auditable transactions" },
              { icon: Headset, label: "Dedicated support" },
            ].map((c) => (
              <div key={c.label} className="flex flex-col items-center gap-2 rounded-2xl border border-surface-border bg-white p-5 text-center shadow-card">
                <c.icon className="h-6 w-6 text-brand-blue" />
                <span className="text-sm font-semibold text-brand-navy">{c.label}</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ─────────────────── REGISTER YOUR AGENCY CTA ─────────────────── */}
      <Section className="pb-16">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-blue to-brand-blueDark p-8 text-center sm:p-14">
            <div className="mx-auto max-w-2xl">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Ready to grow your travel business?</h2>
              <p className="mt-3 text-white/85">
                Register your agency, complete a quick verification and start booking
                better fares with a prepaid wallet built for agents.
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/register" className={buttonVariants({ variant: "orange", size: "lg" })}>
                  Register Your Agency <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/partner-login" className={buttonVariants({ variant: "outline", size: "lg", className: "border-white/30 bg-white/10 text-white hover:border-white hover:bg-white/15 hover:text-white" })}>
                  <LogIn className="h-4 w-4" /> Partner Login
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
