import { Wallet } from "lucide-react";
import { getCurrentAgent } from "@/lib/agent-auth";
import { getWalletSummary, listTransactions } from "@/lib/wallet";
import { formatPaise } from "@/lib/money";
import { AddMoney } from "@/components/partner/add-money";

export const metadata = { title: "Wallet" };

const TXN_LABEL: Record<string, string> = {
  TOPUP: "Wallet top-up", BOOKING_DEBIT: "Flight booking", HOLD_RELEASE: "Hold released",
  REFUND: "Refund", MANUAL_CREDIT: "Manual credit", MANUAL_DEBIT: "Manual debit", REVERSAL: "Reversal", BOOKING_HOLD: "Booking hold",
};

export default async function WalletPage() {
  const agent = await getCurrentAgent();
  if (!agent) return null;
  const [summary, txns] = await Promise.all([getWalletSummary(agent.id), listTransactions(agent.id, 50)]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy">Prepaid wallet</h1>
        <p className="mt-1 text-sm text-ink-muted">Add funds and view every transaction. Balances are derived from an auditable ledger.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-surface-border bg-gradient-to-br from-brand-blue to-brand-blueDark p-6 text-white shadow-card">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/80"><Wallet className="h-4 w-4" /> Available balance</div>
            <p className="mt-1 text-4xl font-extrabold tracking-tight">{formatPaise(summary.availablePaise)}</p>
            <div className="mt-4 flex gap-6 text-sm">
              <div><p className="text-white/70">On hold</p><p className="font-bold">{formatPaise(summary.heldPaise)}</p></div>
              <div><p className="text-white/70">Total</p><p className="font-bold">{formatPaise(summary.balancePaise)}</p></div>
            </div>
          </div>
          <AddMoney approved={agent.status === "APPROVED"} />
        </div>

        <div className="rounded-2xl border border-surface-border bg-white shadow-card">
          <div className="border-b border-surface-border px-5 py-4">
            <h2 className="font-bold text-brand-navy">Transactions</h2>
          </div>
          {txns.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-ink-muted">No transactions yet.</p>
          ) : (
            <ul className="divide-y divide-surface-border">
              {txns.map((t) => {
                const credit = t.amountPaise > 0n;
                return (
                  <li key={t.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-brand-navy">{TXN_LABEL[t.type] ?? t.type}</p>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                        {t.status} · {new Date(t.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={credit ? "text-sm font-extrabold text-success" : "text-sm font-extrabold text-brand-navy"}>
                        {credit ? "+ " : "− "}{formatPaise(t.amountPaise < 0n ? -t.amountPaise : t.amountPaise)}
                      </p>
                      <p className="text-[11px] text-ink-faint">Bal {formatPaise(t.balanceAfterPaise)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
