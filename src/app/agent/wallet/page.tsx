import { requireApprovedAgent } from "@/lib/agent-auth";
import { getWalletSummary, listTransactions } from "@/lib/services/wallet-service";
import { isRazorpayConfigured } from "@/lib/services/razorpay-service";
import { AddMoney } from "@/components/b2b/add-money";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatDate } from "@/lib/utils";
import { WALLET_TX_META } from "@/lib/agent-constants";

export const metadata = { title: "Wallet" };
export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const agent = await requireApprovedAgent();
  const [wallet, txns] = await Promise.all([getWalletSummary(agent.id), listTransactions(agent.id, 50)]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold">Wallet</h1>
        <p className="text-sm text-ink-muted">Your prepaid booking balance</p>
      </div>

      {/* Balances */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-brand-blue p-5 text-white shadow-card">
          <p className="text-sm font-semibold text-white/80">Available Balance</p>
          <p className="mt-1 text-3xl font-extrabold">{formatINR(wallet.available)}</p>
        </div>
        <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
          <p className="text-sm font-semibold text-ink-muted">On Hold</p>
          <p className="mt-1 text-3xl font-extrabold text-ink">{formatINR(wallet.onHold)}</p>
        </div>
        <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
          <p className="text-sm font-semibold text-ink-muted">Total Balance</p>
          <p className="mt-1 text-3xl font-extrabold text-ink">{formatINR(wallet.total)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Add money */}
        <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
          <h2 className="text-base font-bold">Add Money</h2>
          <p className="mb-4 text-sm text-ink-muted">Top up your prepaid balance securely.</p>
          <AddMoney configured={isRazorpayConfigured()} />
        </div>

        {/* Ledger */}
        <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
          <h2 className="text-base font-bold">Transactions</h2>
          <div className="mt-4">
            {txns.length === 0 ? (
              <div className="rounded-xl border border-dashed border-surface-border bg-surface-muted/40 px-4 py-10 text-center">
                <p className="text-sm font-semibold text-ink">No wallet transactions yet</p>
                <p className="mt-0.5 text-xs text-ink-muted">Add funds to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border text-left text-xs font-semibold uppercase tracking-wide text-ink-faint">
                      <th className="pb-2 pr-3">Type</th>
                      <th className="pb-2 pr-3">Reference</th>
                      <th className="pb-2 pr-3">Date</th>
                      <th className="pb-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txns.map((t) => (
                      <tr key={t.id} className="border-b border-surface-border/50">
                        <td className="py-2.5 pr-3">
                          <span className="font-semibold text-ink">{WALLET_TX_META[t.type]?.label ?? t.type}</span>
                          {t.description && <p className="text-xs text-ink-faint">{t.description}</p>}
                        </td>
                        <td className="py-2.5 pr-3 font-mono text-xs text-ink-muted">{t.reference}</td>
                        <td className="py-2.5 pr-3 text-xs text-ink-muted">{formatDate(t.createdAt, { hour: "2-digit", minute: "2-digit" })}</td>
                        <td className={`py-2.5 text-right font-bold ${t.direction === "CREDIT" ? "text-success" : "text-ink"}`}>
                          {t.direction === "CREDIT" ? "+" : "−"}{formatINR(t.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-ink-faint">
        <Badge tone="neutral">Prepaid Booking Balance</Badge>{" "}
        This balance is used for eligible bookings and is not a regulated deposit, PPI or escrow account.
      </p>
    </div>
  );
}
