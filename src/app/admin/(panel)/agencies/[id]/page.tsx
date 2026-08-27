import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { getWalletSummary, listTransactions } from "@/lib/services/wallet-service";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatDate } from "@/lib/utils";
import { AGENT_STATUS_META, businessTypeLabel, WALLET_TX_META } from "@/lib/agent-constants";
import { KycActions, WalletAdjust } from "@/components/admin/agency-actions";
import { reviewDocument } from "../actions";

export const dynamic = "force-dynamic";

export default async function AgencyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const agent = await db.agent.findUnique({ where: { id }, include: { agency: true, documents: { orderBy: { createdAt: "asc" } } } });
  if (!agent) notFound();

  const [wallet, txns, bookings] = await Promise.all([
    getWalletSummary(agent.id),
    listTransactions(agent.id, 20),
    db.flightBooking.count({ where: { agentId: agent.id } }),
  ]);
  const meta = AGENT_STATUS_META[agent.status];
  const ag = agent.agency;

  return (
    <div className="space-y-6">
      <Link href="/admin/agencies" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-muted hover:text-brand-blue"><ArrowLeft size={15} /> All agencies</Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">{ag?.agencyName ?? agent.fullName}</h1>
          <p className="text-sm text-ink-muted">Application {agent.applicationId ?? "—"} · submitted {agent.submittedAt ? formatDate(agent.submittedAt) : "—"}</p>
        </div>
        <Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? agent.status}</Badge>
      </div>

      {agent.decisionReason && (
        <p className="rounded-xl border border-warning/20 bg-[#FDF2E3] px-4 py-3 text-sm text-warning">Last decision note: {agent.decisionReason}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Agency & applicant">
            <div className="grid gap-3 sm:grid-cols-2">
              <Row k="Agency" v={ag?.agencyName} />
              <Row k="Business Type" v={ag ? businessTypeLabel(ag.businessType) : undefined} />
              <Row k="Applicant" v={agent.fullName} />
              <Row k="Email" v={agent.email} />
              <Row k="Mobile" v={agent.mobile} />
              <Row k="PAN" v={ag?.pan} />
              <Row k="GSTIN" v={ag?.gstin || "Not provided"} />
              <Row k="Udyam" v={ag?.udyam || "—"} />
              <Row k="Address" v={ag ? `${ag.officeAddress}, ${ag.city}, ${ag.state} ${ag.pinCode}, ${ag.country}` : undefined} span />
            </div>
          </Panel>

          <Panel title="Documents">
            {agent.documents.length === 0 ? <p className="text-sm text-ink-muted">No documents uploaded.</p> : (
              <div className="space-y-2">
                {agent.documents.map((d) => (
                  <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-border p-3">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-ink-faint" />
                      <div>
                        <p className="text-sm font-semibold">{d.title}</p>
                        <a href={`/api/agent/documents/${d.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue">View {d.filename} <ExternalLink size={11} /></a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={d.status === "APPROVED" ? "success" : d.status === "REJECTED" ? "danger" : "neutral"}>{d.status}</Badge>
                      <form action={reviewDocument} className="flex items-center gap-1">
                        <input type="hidden" name="docId" value={d.id} />
                        <input type="hidden" name="status" value="APPROVED" />
                        <button className="rounded-lg bg-[#E7F6EC] px-2 py-1 text-xs font-bold text-success">Approve</button>
                      </form>
                      <form action={reviewDocument} className="flex items-center gap-1">
                        <input type="hidden" name="docId" value={d.id} />
                        <input type="hidden" name="status" value="REJECTED" />
                        <button className="rounded-lg bg-[#FCE9E9] px-2 py-1 text-xs font-bold text-danger">Reject</button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Wallet transactions">
            {txns.length === 0 ? <p className="text-sm text-ink-muted">No transactions yet.</p> : (
              <div className="space-y-1.5">
                {txns.map((t) => (
                  <div key={t.id} className="flex items-center justify-between border-b border-surface-border/50 py-1.5 text-sm last:border-0">
                    <span>{WALLET_TX_META[t.type]?.label ?? t.type} <span className="text-xs text-ink-faint">· {t.reference}</span></span>
                    <span className={`font-bold ${t.direction === "CREDIT" ? "text-success" : "text-ink"}`}>{t.direction === "CREDIT" ? "+" : "−"}{formatINR(t.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="KYC decision">
            <KycActions agentId={agent.id} status={agent.status} />
          </Panel>
          <Panel title="Wallet">
            <Row k="Available" v={formatINR(wallet.available)} />
            <Row k="On hold" v={formatINR(wallet.onHold)} />
            <Row k="Total" v={formatINR(wallet.total)} />
            <div className="mt-3"><WalletAdjust agentId={agent.id} /></div>
          </Panel>
          <Panel title="Activity">
            <Row k="Bookings" v={String(bookings)} />
            <Row k="Last login" v={agent.lastLoginAt ? formatDate(agent.lastLoginAt) : "Never"} />
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-surface-border bg-white p-5">
      <h2 className="mb-3 text-base font-bold text-brand-navy">{title}</h2>
      {children}
    </div>
  );
}
function Row({ k, v, span }: { k: string; v?: string | null; span?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 py-1 text-sm ${span ? "sm:col-span-2" : ""}`}>
      <span className="text-ink-muted">{k}</span>
      <span className="text-right font-semibold text-brand-navy">{v || "—"}</span>
    </div>
  );
}
