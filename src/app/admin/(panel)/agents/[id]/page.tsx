import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, Ban, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { getWalletSummary, listTransactions, reconcile } from "@/lib/wallet";
import { formatPaise } from "@/lib/money";
import { approveAgent, rejectAgent, suspendAgent, adjustWallet } from "../actions";

export const dynamic = "force-dynamic";

const TXN_LABEL: Record<string, string> = {
  TOPUP: "Wallet top-up", BOOKING_DEBIT: "Flight booking", HOLD_RELEASE: "Hold released",
  REFUND: "Refund", MANUAL_CREDIT: "Manual credit", MANUAL_DEBIT: "Manual debit", REVERSAL: "Reversal", BOOKING_HOLD: "Booking hold",
};

export default async function AdminAgentDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const agent = await db.agent.findUnique({ where: { id }, include: { kycDocuments: true } });
  if (!agent) notFound();

  const [summary, txns, recon] = await Promise.all([getWalletSummary(id), listTransactions(id, 50), reconcile(id)]);

  return (
    <div className="space-y-6">
      <Link href="/admin/agents" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to agents
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-navy">{agent.agencyName}</h1>
          <p className="mt-1 text-sm text-ink-muted">{agent.ownerName} · {agent.email} · {agent.mobile}</p>
        </div>
        <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-bold text-brand-navy">{agent.status.replace("_", " ")}</span>
      </div>

      {/* Approve / reject / suspend */}
      <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
        <h2 className="font-bold text-brand-navy">KYC decision</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <form action={approveAgent}>
            <input type="hidden" name="agentId" value={agent.id} />
            <button className="inline-flex items-center gap-1.5 rounded-xl bg-success px-4 py-2.5 text-sm font-bold text-white hover:brightness-95"><CheckCircle2 className="h-4 w-4" /> Approve</button>
          </form>
          <form action={rejectAgent} className="flex items-center gap-2">
            <input type="hidden" name="agentId" value={agent.id} />
            <input name="reason" placeholder="Rejection reason" className="rounded-xl border border-surface-border px-3 py-2.5 text-sm outline-none focus:border-brand-blue" />
            <button className="inline-flex items-center gap-1.5 rounded-xl bg-danger px-4 py-2.5 text-sm font-bold text-white hover:brightness-95"><XCircle className="h-4 w-4" /> Reject</button>
          </form>
          <form action={suspendAgent}>
            <input type="hidden" name="agentId" value={agent.id} />
            <button className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border px-4 py-2.5 text-sm font-bold text-ink hover:border-danger hover:text-danger"><Ban className="h-4 w-4" /> {agent.status === "SUSPENDED" ? "Un-suspend" : "Suspend"}</button>
          </form>
        </div>
        {agent.rejectionReason && <p className="mt-3 text-sm text-danger">Reason on file: {agent.rejectionReason}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Business + KYC */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
            <h2 className="font-bold text-brand-navy">Business details</h2>
            <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
              <Row k="Type" v={agent.businessType} />
              <Row k="PAN" v={agent.pan} />
              <Row k="GSTIN" v={agent.gstin} />
              <Row k="Address" v={agent.addressLine} />
              <Row k="City" v={agent.city} />
              <Row k="State" v={agent.state} />
              <Row k="PIN" v={agent.pincode} />
              <Row k="Mobile verified" v={agent.mobileVerified ? "Yes" : "No"} />
            </dl>
          </div>
          <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
            <h2 className="font-bold text-brand-navy">KYC documents</h2>
            {agent.kycDocuments.length === 0 ? (
              <p className="mt-2 text-sm text-ink-muted">No documents uploaded yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {agent.kycDocuments.map((d) => (
                  <li key={d.id} className="flex items-center justify-between rounded-lg border border-surface-border px-3 py-2">
                    <span className="font-medium text-brand-navy">{d.type}</span>
                    <span className="text-xs font-semibold uppercase text-ink-faint">{d.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Wallet */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-brand-navy">Wallet</h2>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${recon.ok ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                <ShieldCheck className="h-3.5 w-3.5" /> {recon.ok ? "Reconciled" : "Mismatch"}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-surface-muted p-3"><p className="text-xs text-ink-faint">Available</p><p className="font-extrabold text-brand-navy">{formatPaise(summary.availablePaise)}</p></div>
              <div className="rounded-xl bg-surface-muted p-3"><p className="text-xs text-ink-faint">On hold</p><p className="font-extrabold text-brand-navy">{formatPaise(summary.heldPaise)}</p></div>
              <div className="rounded-xl bg-surface-muted p-3"><p className="text-xs text-ink-faint">Total</p><p className="font-extrabold text-brand-navy">{formatPaise(summary.balancePaise)}</p></div>
            </div>

            <form action={adjustWallet} className="mt-4 space-y-2 border-t border-surface-border pt-4">
              <input type="hidden" name="agentId" value={agent.id} />
              <p className="text-sm font-semibold text-brand-navy">Manual adjustment (audited)</p>
              <div className="flex flex-wrap gap-2">
                <select name="direction" className="rounded-xl border border-surface-border px-3 py-2 text-sm outline-none focus:border-brand-blue">
                  <option value="CREDIT">Credit</option>
                  <option value="DEBIT">Debit</option>
                </select>
                <input name="amountRupees" type="number" min={1} placeholder="₹ amount" className="w-28 rounded-xl border border-surface-border px-3 py-2 text-sm outline-none focus:border-brand-blue" />
                <input name="reason" placeholder="Reason (required)" className="min-w-[10rem] flex-1 rounded-xl border border-surface-border px-3 py-2 text-sm outline-none focus:border-brand-blue" />
                <button className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-bold text-white hover:bg-brand-blueDark">Apply</button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-surface-border bg-white shadow-card">
            <div className="border-b border-surface-border px-5 py-3"><h2 className="font-bold text-brand-navy">Ledger</h2></div>
            {txns.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-muted">No transactions.</p>
            ) : (
              <ul className="max-h-80 divide-y divide-surface-border overflow-y-auto">
                {txns.map((t) => {
                  const credit = t.amountPaise > 0n;
                  return (
                    <li key={t.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                      <div><p className="font-semibold text-brand-navy">{TXN_LABEL[t.type] ?? t.type}</p><p className="text-[11px] text-ink-faint">{new Date(t.createdAt).toLocaleString("en-IN")}</p></div>
                      <p className={credit ? "font-extrabold text-success" : "font-extrabold text-brand-navy"}>{credit ? "+ " : "− "}{formatPaise(t.amountPaise < 0n ? -t.amountPaise : t.amountPaise)}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | null | undefined }) {
  return (<><dt className="text-ink-faint">{k}</dt><dd className="text-right font-medium text-brand-navy">{v || "—"}</dd></>);
}
