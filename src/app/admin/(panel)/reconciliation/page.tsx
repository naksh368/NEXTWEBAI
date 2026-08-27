import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatDate } from "@/lib/utils";

export const metadata = { title: "Reconciliation" };
export const dynamic = "force-dynamic";

/**
 * Payment reconciliation — surfaces gateway vs wallet mismatches so finance can
 * investigate. Flags: gateway success without a wallet credit, a wallet credit
 * without gateway confirmation, and stuck/failed top-ups.
 */
export default async function ReconciliationPage() {
  await requireAdmin();
  const payments = await db.agentPayment.findMany({
    where: { status: { not: "INITIATED" } },
    include: { agent: { select: { fullName: true, email: true, agency: { select: { agencyName: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const rows = payments.map((p) => {
    let flag: { tone: "danger" | "warning" | "success" | "neutral"; label: string };
    if (p.status === "SUCCESS" && !p.walletTransactionId) flag = { tone: "danger", label: "Gateway paid · wallet NOT credited" };
    else if (p.walletTransactionId && p.status !== "SUCCESS") flag = { tone: "danger", label: "Wallet credited · gateway not confirmed" };
    else if (p.status === "SUCCESS" && p.walletTransactionId) flag = { tone: "success", label: "Reconciled" };
    else if (p.status === "FAILED") flag = { tone: "warning", label: "Failed" };
    else flag = { tone: "neutral", label: p.status };
    return { p, flag };
  });

  const mismatches = rows.filter((r) => r.flag.tone === "danger").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Payment Reconciliation</h1>
        <p className="text-sm text-ink-muted">Wallet top-ups · gateway vs ledger</p>
      </div>

      <div className="flex gap-3">
        <div className="rounded-2xl border border-surface-border bg-white px-5 py-3">
          <p className="text-xs font-semibold text-ink-muted">Payments</p>
          <p className="text-xl font-extrabold text-brand-navy">{payments.length}</p>
        </div>
        <div className={`rounded-2xl border px-5 py-3 ${mismatches ? "border-danger/30 bg-[#FCE9E9]" : "border-surface-border bg-white"}`}>
          <p className="text-xs font-semibold text-ink-muted">Mismatches</p>
          <p className={`text-xl font-extrabold ${mismatches ? "text-danger" : "text-brand-navy"}`}>{mismatches}</p>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-border bg-surface-muted/40 px-6 py-16 text-center">
          <p className="text-sm font-semibold text-brand-navy">No payments yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-surface-border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left text-xs font-semibold uppercase tracking-wide text-ink-faint">
                <th className="p-3">Agency</th><th className="p-3">Order ID</th><th className="p-3">Payment ID</th>
                <th className="p-3 text-right">Amount</th><th className="p-3">Gateway</th><th className="p-3">Wallet</th><th className="p-3">Reconciliation</th><th className="p-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ p, flag }) => (
                <tr key={p.id} className="border-b border-surface-border/50">
                  <td className="p-3"><p className="font-medium">{p.agent.agency?.agencyName ?? p.agent.fullName}</p><p className="text-xs text-ink-faint">{p.agent.email}</p></td>
                  <td className="p-3 font-mono text-xs">{p.providerOrderId ?? "—"}</td>
                  <td className="p-3 font-mono text-xs">{p.providerPaymentId ?? "—"}</td>
                  <td className="p-3 text-right font-bold">{formatINR(p.amount)}</td>
                  <td className="p-3">{p.status}</td>
                  <td className="p-3">{p.walletTransactionId ? "Credited" : "—"}</td>
                  <td className="p-3"><Badge tone={flag.tone}>{flag.label}</Badge></td>
                  <td className="p-3 text-xs text-ink-muted">{formatDate(p.createdAt, { hour: "2-digit", minute: "2-digit" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
