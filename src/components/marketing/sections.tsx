import {
  Rocket,
  Search,
  Wallet,
  BadgeIndianRupee,
  Ticket,
  RotateCcw,
  Headphones,
  UserPlus,
  Plane,
  TrendingUp,
  ArrowDown,
} from "lucide-react";
import { SectionHeading, Eyebrow } from "@/components/ui/section";
import { inr } from "@/lib/utils";

/* ── Launching Soon ─────────────────────────────────────────── */
export function LaunchingSoon() {
  return (
    <section className="container py-16">
      <div className="relative overflow-hidden rounded-2xl border border-surface-border navy-wash px-6 py-14 text-center sm:px-12">
        <div className="mx-auto max-w-2xl">
          <div className="flex justify-center">
            <span className="eyebrow rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-white backdrop-blur">
              <Rocket size={13} className="text-orange" />
              Launching Soon
            </span>
          </div>
          <h2 className="mt-5 text-3xl font-extrabold text-white sm:text-4xl">
            Something better is <span className="text-orange">taking off.</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-blue-100">
            ExpertzTrip is building a smarter flight booking platform for travel agents —
            competitive fares, a secure prepaid wallet and transparent earnings, all in
            one clean workspace.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3 text-sm font-bold text-white/90">
            <span className="rounded-full bg-white/10 px-3.5 py-1.5">Flights first</span>
            <span className="rounded-full bg-white/10 px-3.5 py-1.5">Prepaid wallet</span>
            <span className="rounded-full bg-white/10 px-3.5 py-1.5">Transparent earnings</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── How It Works ───────────────────────────────────────────── */
const STEPS = [
  { n: "01", icon: UserPlus, title: "Register", desc: "Complete your business KYC and create your agent account." },
  { n: "02", icon: Wallet, title: "Add Funds", desc: "Add money securely to your ExpertzWallet." },
  { n: "03", icon: Plane, title: "Book Flights", desc: "Search, compare and book flights through ExpertzTrip." },
  { n: "04", icon: TrendingUp, title: "Grow Your Business", desc: "Access better tools, transparent earnings and future purchasing power." },
];

export function HowItWorks() {
  return (
    <section id="how" className="border-y border-surface-border bg-surface-muted py-16">
      <div className="container">
        <SectionHeading
          eyebrow="Simple by design"
          title="How ExpertzTrip Works"
          subtitle="From registration to your first ticket in four clear steps."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="relative rounded-xl border border-surface-border bg-white p-6 shadow-card"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-extrabold text-blue-100">{s.n}</span>
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-blue-50 text-blue">
                  <s.icon size={20} />
                </span>
              </div>
              <h3 className="mt-4 text-lg font-extrabold text-navy">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Why + Built for Travel Agents ──────────────────────────── */
const AGENT_CARDS = [
  { icon: Search, title: "Better Flight Search", desc: "Compare available flight options through our connected supplier network." },
  { icon: Wallet, title: "ExpertzWallet", desc: "Secure prepaid balance for flight bookings." },
  { icon: BadgeIndianRupee, title: "Transparent Earnings", desc: "Make the economics of every booking clear to the agent." },
  { icon: Ticket, title: "Fast Ticketing", desc: "A simple booking and ticketing workflow." },
  { icon: RotateCcw, title: "Refund Tracking", desc: "Clearly see cancellation and refund status." },
  { icon: Headphones, title: "Dedicated Support", desc: "Help when agents need it." },
];

export function AgentBenefits() {
  return (
    <section id="agents" className="py-16">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center" id="why">
          <div className="mb-3 flex justify-center">
            <Eyebrow tone="orange">Built for the trade</Eyebrow>
          </div>
          <h2 className="text-[1.75rem] leading-tight sm:text-[2.1rem]">
            Built for Travel Agents
          </h2>
          <p className="mt-3 text-[0.98rem] leading-relaxed text-ink-muted">
            Everything a professional agent needs to search, book and manage flights —
            without the clutter of a consumer travel site.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {AGENT_CARDS.map((c) => (
            <div
              key={c.title}
              className="group rounded-xl border border-surface-border bg-white p-6 shadow-card transition-shadow hover:shadow-cardHover"
            >
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-blue-50 text-blue transition-colors group-hover:bg-blue group-hover:text-white">
                <c.icon size={20} />
              </span>
              <h3 className="mt-4 text-lg font-extrabold text-navy">{c.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── ExpertzWallet preview ──────────────────────────────────── */
export function WalletPreview() {
  const txns = [
    { label: "Wallet Top-up", amt: 25000, credit: true },
    { label: "Flight Booking", amt: 18500, credit: false },
    { label: "Refund", amt: 4200, credit: true },
  ];
  return (
    <section id="wallet" className="border-y border-surface-border bg-surface-muted py-16">
      <div className="container grid items-center gap-10 lg:grid-cols-2">
        <div>
          <Eyebrow>ExpertzWallet</Eyebrow>
          <h2 className="mt-3 text-[1.75rem] leading-tight sm:text-[2.1rem]">
            Your Travel Business Wallet
          </h2>
          <p className="mt-3 max-w-md text-[0.98rem] leading-relaxed text-ink-muted">
            A secure prepaid balance built for booking flights. Top up once, book
            confidently, and track every rupee — top-ups, bookings and refunds in
            one clear ledger.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Prepaid balance — you always know what you can spend",
              "Funds are held before a booking and only debited on a confirmed ticket",
              "Every transaction tracked with a running balance",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-sm font-semibold text-navy">
                <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-success/15 text-success">
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-6 inline-flex rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue">
            Prepaid in V1 — credit is a future feature, never extended automatically.
          </p>
        </div>

        {/* Realistic wallet dashboard */}
        <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-pop">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-ink-muted">ExpertzWallet</p>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue">
              Prepaid
            </span>
          </div>
          <p className="mt-2 text-xs font-bold uppercase tracking-wide text-ink-faint">
            Available Balance
          </p>
          <p className="text-4xl font-extrabold text-navy">{inr(52450)}</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-surface-border bg-surface-muted p-3">
              <p className="text-[0.7rem] font-bold uppercase text-ink-faint">Today&apos;s Bookings</p>
              <p className="mt-1 text-lg font-extrabold text-navy">{inr(18500)}</p>
            </div>
            <div className="rounded-lg border border-surface-border bg-surface-muted p-3">
              <p className="text-[0.7rem] font-bold uppercase text-ink-faint">Pending Refunds</p>
              <p className="mt-1 text-lg font-extrabold text-orange">{inr(4200)}</p>
            </div>
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-wide text-ink-faint">
            Recent Transactions
          </p>
          <div className="mt-2 divide-y divide-surface-border">
            {txns.map((t) => (
              <div key={t.label} className="flex items-center justify-between py-2.5">
                <span className="text-sm font-semibold text-navy">{t.label}</span>
                <span
                  className={`text-sm font-extrabold ${t.credit ? "text-success" : "text-ink"}`}
                >
                  {t.credit ? "+ " : "- "}
                  {inr(t.amt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── ExpertzCredit (future) ─────────────────────────────────── */
const LADDER = [
  "New Agent",
  "Build Booking History",
  "Build Payment History",
  "Become Eligible",
  "Higher Purchasing Power",
];

export function ExpertzCredit() {
  return (
    <section className="py-16">
      <div className="container">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <span className="eyebrow rounded-full bg-orange-50 px-3 py-1.5 text-orange">
              <span className="h-1.5 w-1.5 rounded-full bg-orange" />
              Coming Soon
            </span>
            <h2 className="mt-4 text-[1.75rem] leading-tight sm:text-[2.1rem]">
              ExpertzCredit
            </h2>
            <p className="mt-2 text-lg font-bold text-blue">
              Build your history. Unlock greater purchasing power.
            </p>
            <p className="mt-4 max-w-md text-[0.98rem] leading-relaxed text-ink-muted">
              Agents who build a strong booking and payment history may become eligible
              for future credit facilities, subject to eligibility and applicable
              requirements.
            </p>
            <p className="mt-5 inline-flex rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-xs font-semibold text-ink-muted">
              A future feature. Not a guarantee of credit.
            </p>
          </div>

          {/* Progression ladder */}
          <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
            <div className="space-y-2">
              {LADDER.map((step, i) => (
                <div key={step}>
                  <div
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                      i === LADDER.length - 1
                        ? "border-orange/30 bg-orange-50"
                        : "border-surface-border bg-surface-muted"
                    }`}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-extrabold ${
                        i === LADDER.length - 1
                          ? "bg-orange text-white"
                          : "bg-blue text-white"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        i === LADDER.length - 1 ? "text-orange-700" : "text-navy"
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                  {i < LADDER.length - 1 && (
                    <div className="flex justify-center py-0.5 text-ink-faint">
                      <ArrowDown size={16} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
