import Link from "next/link";
import { Wallet, Plane, TrendingUp, IndianRupee, Search, PlusCircle, ListChecks, LifeBuoy, ArrowRight } from "lucide-react";
import { requireApprovedAgent } from "@/lib/agent-auth";
import { db } from "@/lib/db";
import { getWalletSummary, listTransactions } from "@/lib/services/wallet-service";
import { AgencyLogo } from "@/components/b2b/agency-logo";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatDate } from "@/lib/utils";
import { WALLET_TX_META } from "@/lib/agent-constants";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default async function AgentDashboard() {
  const agent = await requireApprovedAgent();
  const [wallet, bookings, ticketed, txns] = await Promise.all([
    getWalletSummary(agent.id),
    db.flightBooking.count({ where: { agentId: agent.id } }),
    db.flightBooking.findMany({ where: { agentId: agent.id, status: "TICKETED" }, select: { totalAmount: true } }),
    listTransactions(agent.id, 5),
  ]);
  const sales = ticketed.reduce((s, b) => s + b.totalAmount, 0);
  const firstName = agent.fullName.split(/\s+/)[0];

  const stats = [
    { icon: Wallet, label: "Wallet Balance", value: formatINR(wallet.available), sub: wallet.onHold > 0 ? `${formatINR(wallet.onHold)} on hold` : "Available to book", href: "/agent/wallet" },
    { icon: Plane, label: "Bookings", value: String(bookings), sub: "All time", href: "/agent/bookings" },
    { icon: IndianRupee, label: "Sales", value: formatINR(sales, { compact: true }), sub: "Ticketed value", href: "/agent/reports" },
    { icon: TrendingUp, label: "Earnings", value: "—", sub: "Applicable earnings", href: "/agent/reports" },
  ];

  const actions = [
    { icon: Search, label: "Search Flights", href: "/agent/flights" },
    { icon: PlusCircle, label: "Add Money", href: "/agent/wallet" },
    { icon: ListChecks, label: "My Bookings", href: "/agent/bookings" },
    { icon: LifeBuoy, label: "Support", href: "/agent/support" },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AgencyLogo logoDocumentId={agent.logoDocumentId} agencyName={agent.agencyName} size={52} />
          <div>
            <h1 className="text-2xl font-extrabold">{greeting()}, {firstName}</h1>
            <p className="text-sm text-ink-muted">{agent.agencyName} · ExpertzTrip Partner Portal</p>
          </div>
        </div>
        <Badge tone="success">KYC {agent.kycStatus === "APPROVED" ? "Approved" : "Verified"}</Badge>
      </div>

      {/* Stats */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-faint">Your Business at a Glance</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Link key={s.label} href={s.href} className="rounded-2xl border border-surface-border bg-white p-5 shadow-card transition-shadow hover:shadow-cardHover">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue"><s.icon size={19} /></span>
              <p className="mt-3 text-2xl font-extrabold text-ink">{s.value}</p>
              <p className="text-sm font-semibold text-ink">{s.label}</p>
              <p className="text-xs text-ink-faint">{s.sub}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-faint">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((a) => (
            <Link key={a.label} href={a.href} className="flex items-center gap-3 rounded-xl border border-surface-border bg-white p-4 font-semibold text-ink shadow-card transition-shadow hover:shadow-cardHover">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-orangeLight text-brand-orange"><a.icon size={17} /></span>
              {a.label}
              <ArrowRight size={16} className="ml-auto text-ink-faint" />
            </Link>
          ))}
        </div>
      </section>

      {/* Recent activity */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
          <h3 className="text-base font-bold">Recent Bookings</h3>
          <div className="mt-4">
            {bookings === 0 ? (
              <EmptyRow title="No bookings yet" body="Your first booking will appear here." />
            ) : (
              <RecentBookings agentId={agent.id} />
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
          <h3 className="text-base font-bold">Recent Wallet Transactions</h3>
          <div className="mt-4 space-y-2">
            {txns.length === 0 ? (
              <EmptyRow title="No wallet transactions yet" body="Add funds to get started." />
            ) : (
              txns.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 border-b border-surface-border/60 pb-2 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{WALLET_TX_META[t.type]?.label ?? t.type}</p>
                    <p className="text-xs text-ink-faint">{formatDate(t.createdAt, { hour: "2-digit", minute: "2-digit" })} · {t.reference}</p>
                  </div>
                  <span className={`shrink-0 text-sm font-bold ${t.direction === "CREDIT" ? "text-success" : "text-ink"}`}>
                    {t.direction === "CREDIT" ? "+" : "−"}{formatINR(t.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function EmptyRow({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-surface-border bg-surface-muted/40 px-4 py-8 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-0.5 text-xs text-ink-muted">{body}</p>
    </div>
  );
}

async function RecentBookings({ agentId }: { agentId: string }) {
  const rows = await db.flightBooking.findMany({ where: { agentId }, orderBy: { createdAt: "desc" }, take: 5 });
  const { FLIGHT_BOOKING_STATUS_META } = await import("@/lib/agent-constants");
  return (
    <div className="space-y-2">
      {rows.map((b) => {
        const meta = FLIGHT_BOOKING_STATUS_META[b.status];
        return (
          <Link key={b.id} href={`/agent/bookings/${b.id}`} className="flex items-center justify-between gap-3 border-b border-surface-border/60 pb-2 last:border-0">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{b.origin} → {b.destination}</p>
              <p className="text-xs text-ink-faint">{b.reference} · {formatDate(b.departDate)}</p>
            </div>
            <Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? b.status}</Badge>
          </Link>
        );
      })}
    </div>
  );
}
