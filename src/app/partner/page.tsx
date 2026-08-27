import Link from "next/link";
import {
  Wallet, PlaneTakeoff, LifeBuoy, ArrowRight, Clock, CheckCircle2,
  AlertCircle, ShieldCheck,
} from "lucide-react";
import { getCurrentAgent } from "@/lib/agent-auth";
import { getWalletSummary, listTransactions } from "@/lib/wallet";
import { formatPaise } from "@/lib/money";

const STATUS_META: Record<string, { label: string; tone: string; icon: typeof Clock; note: string }> = {
  PENDING: { label: "Pending verification", tone: "text-warning bg-warning/10", icon: Clock, note: "Complete verification and business details to move into review." },
  UNDER_REVIEW: { label: "Under review", tone: "text-brand-blue bg-brand-blueLight", icon: Clock, note: "Our team is reviewing your KYC. Wallet unlocks once approved." },
  APPROVED: { label: "Approved", tone: "text-success bg-success/10", icon: CheckCircle2, note: "Your agency is active. Add funds and start booking." },
  REJECTED: { label: "Rejected", tone: "text-danger bg-danger/10", icon: AlertCircle, note: "Your application was not approved. Contact support." },
  SUSPENDED: { label: "Suspended", tone: "text-danger bg-danger/10", icon: AlertCircle, note: "This account is suspended. Contact support." },
};

const TXN_LABEL: Record<string, string> = {
  TOPUP: "Wallet top-up", BOOKING_DEBIT: "Flight booking", HOLD_RELEASE: "Hold released",
  REFUND: "Refund", MANUAL_CREDIT: "Manual credit", MANUAL_DEBIT: "Manual debit", REVERSAL: "Reversal", BOOKING_HOLD: "Booking hold",
};

export default async function PartnerDashboard() {
  const agent = await getCurrentAgent();
  if (!agent) return null;
  const [summary, txns] = await Promise.all([getWalletSummary(agent.id), listTransactions(agent.id, 6)]);
  const status = STATUS_META[agent.status] ?? STATUS_META.PENDING;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy">Welcome, {agent.agencyName}</h1>
        <p className="mt-1 text-sm text-ink-muted">Here&apos;s an overview of your ExpertzTrip account.</p>
      </div>

      {/* Status banner */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-surface-border bg-white p-4 shadow-card">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${status.tone}`}>
          <status.icon className="h-4 w-4" /> {status.label}
        </span>
        <p className="text-sm text-ink-muted">{status.note}</p>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-muted"><Wallet className="h-4 w-4 text-brand-blue" /> Available balance</div>
          <p className="mt-1 text-2xl font-extrabold text-brand-navy">{formatPaise(summary.availablePaise)}</p>
          <Link href="/partner/wallet" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:underline">Manage wallet <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
          <div className="text-sm font-semibold text-ink-muted">On hold</div>
          <p className="mt-1 text-2xl font-extrabold text-brand-navy">{formatPaise(summary.heldPaise)}</p>
          <p className="mt-2 text-xs text-ink-faint">Reserved during in-flight bookings.</p>
        </div>
        <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
          <div className="text-sm font-semibold text-ink-muted">Total balance</div>
          <p className="mt-1 text-2xl font-extrabold text-brand-navy">{formatPaise(summary.balancePaise)}</p>
          <p className="mt-2 text-xs text-ink-faint">Ledger-derived, fully auditable.</p>
        </div>
        <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
          <div className="text-sm font-semibold text-ink-muted">KYC</div>
          <p className="mt-1 flex items-center gap-1.5 text-lg font-extrabold text-brand-navy"><ShieldCheck className="h-5 w-5 text-brand-blue" /> {agent.mobileVerified ? "Mobile verified" : "Verify mobile"}</p>
          <p className="mt-2 text-xs text-ink-faint">{agent.emailVerified ? "Email verified" : "Business review in progress"}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/partner/wallet" className="group flex items-center gap-3 rounded-2xl border border-surface-border bg-white p-5 shadow-card transition-shadow hover:shadow-cardHover">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue"><Wallet className="h-5 w-5" /></span>
          <span><span className="block font-bold text-brand-navy">Add money</span><span className="text-sm text-ink-muted">Top up your wallet</span></span>
        </Link>
        <div className="flex items-center gap-3 rounded-2xl border border-surface-border bg-white p-5 opacity-70 shadow-card">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-muted text-ink-faint"><PlaneTakeoff className="h-5 w-5" /></span>
          <span><span className="block font-bold text-brand-navy">Search flights</span><span className="text-sm text-ink-faint">Coming soon</span></span>
        </div>
        <Link href="/support" className="group flex items-center gap-3 rounded-2xl border border-surface-border bg-white p-5 shadow-card transition-shadow hover:shadow-cardHover">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orangeLight text-brand-orangeDark"><LifeBuoy className="h-5 w-5" /></span>
          <span><span className="block font-bold text-brand-navy">Support</span><span className="text-sm text-ink-muted">Get help</span></span>
        </Link>
      </div>

      {/* Recent transactions */}
      <div className="rounded-2xl border border-surface-border bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <h2 className="font-bold text-brand-navy">Recent transactions</h2>
          <Link href="/partner/wallet" className="text-sm font-semibold text-brand-blue hover:underline">View all</Link>
        </div>
        {txns.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-muted">No transactions yet. Add money to get started.</p>
        ) : (
          <ul className="divide-y divide-surface-border">
            {txns.map((t) => {
              const credit = t.amountPaise > 0n;
              return (
                <li key={t.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-semibold text-brand-navy">{TXN_LABEL[t.type] ?? t.type}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{t.status} · {new Date(t.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                  <p className={credit ? "text-sm font-extrabold text-success" : "text-sm font-extrabold text-brand-navy"}>
                    {credit ? "+ " : "− "}{formatPaise(t.amountPaise < 0n ? -t.amountPaise : t.amountPaise)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
