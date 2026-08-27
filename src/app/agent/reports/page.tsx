import { requireApprovedAgent } from "@/lib/agent-auth";
import { db } from "@/lib/db";
import { getWalletSummary } from "@/lib/services/wallet-service";
import { formatINR } from "@/lib/utils";
import { Download } from "lucide-react";

export const metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const agent = await requireApprovedAgent();
  const [wallet, bookingsCount, ticketed, topups, refunds] = await Promise.all([
    getWalletSummary(agent.id),
    db.flightBooking.count({ where: { agentId: agent.id } }),
    db.flightBooking.aggregate({ where: { agentId: agent.id, status: "TICKETED" }, _sum: { totalAmount: true }, _count: true }),
    db.walletTransaction.aggregate({ where: { agentId: agent.id, type: "TOPUP" }, _sum: { amount: true } }),
    db.walletTransaction.aggregate({ where: { agentId: agent.id, type: "REFUND" }, _sum: { amount: true } }),
  ]);

  const cards = [
    { label: "Total Bookings", value: String(bookingsCount) },
    { label: "Ticketed", value: String(ticketed._count) },
    { label: "Sales (ticketed)", value: formatINR(ticketed._sum.totalAmount ?? 0) },
    { label: "Wallet Top-ups", value: formatINR(topups._sum.amount ?? 0) },
    { label: "Refunds", value: formatINR(refunds._sum.amount ?? 0) },
    { label: "Available Balance", value: formatINR(wallet.available) },
  ];

  const empty = bookingsCount === 0 && (topups._sum.amount ?? 0) === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Reports</h1>
          <p className="text-sm text-ink-muted">Your business activity — real figures only</p>
        </div>
        <a href="/api/agent/reports/export" className="inline-flex items-center gap-2 rounded-xl border border-surface-border bg-white px-4 py-2 text-sm font-bold text-ink shadow-card hover:text-brand-blue">
          <Download size={16} /> Export CSV
        </a>
      </div>

      {empty ? (
        <div className="rounded-2xl border border-dashed border-surface-border bg-surface-muted/40 px-6 py-16 text-center">
          <p className="text-base font-semibold text-ink">No reports yet</p>
          <p className="mt-1 text-sm text-ink-muted">Your business activity will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
              <p className="text-sm font-semibold text-ink-muted">{c.label}</p>
              <p className="mt-1 text-2xl font-extrabold text-ink">{c.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
