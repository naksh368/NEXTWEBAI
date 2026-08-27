import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, Clock, FileText } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, Panel, Pill } from "@/components/admin/ui";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { businessTypeLabel, APPLICATION_STATUS_LABEL } from "@/lib/agency";
import { approveAgency, rejectAgency, setUnderReview } from "../actions";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "info" | "warning" | "success" | "neutral" | "brand" | "danger"> = {
  PENDING_OTP: "neutral", SUBMITTED: "brand", UNDER_REVIEW: "warning", APPROVED: "success", REJECTED: "danger",
};

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
      <dt className="w-44 shrink-0 text-sm text-ink-muted">{label}</dt>
      <dd className="text-sm font-medium text-brand-navy">{value || "—"}</dd>
    </div>
  );
}

export default async function AgencyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("customer.view");
  const { id } = await params;
  const a = await db.agencyApplication.findUnique({ where: { id } });
  if (!a) notFound();

  const wallet = a.customerId ? await db.wallet.findUnique({ where: { customerId: a.customerId }, select: { balance: true, onHold: true } }).catch(() => null) : null;
  const docs = a.customerId
    ? await db.agencyDocument.findMany({ where: { customerId: a.customerId }, orderBy: { createdAt: "desc" }, select: { id: true, kind: true, filename: true, status: true } }).catch(() => [])
    : [];
  const kycDocs = docs.filter((d) => d.kind !== "LOGO");
  const decided = a.status === "APPROVED" || a.status === "REJECTED";

  return (
    <>
      <Link href="/admin/agencies" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-brand-navy">
        <ArrowLeft className="h-4 w-4" /> All agencies
      </Link>
      <PageHeader
        title={a.agencyName}
        subtitle={`${a.reference} · applied ${formatDate(a.createdAt)}`}
        action={<Pill tone={STATUS_TONE[a.status] ?? "neutral"}>{APPLICATION_STATUS_LABEL[a.status] ?? a.status}</Pill>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Panel title="Agency">
            <div className="px-5 pb-4">
              <dl className="divide-y divide-surface-border">
                <Row label="Agency name" value={a.agencyName} />
                <Row label="Business type" value={businessTypeLabel(a.businessType)} />
                <Row label="Application ID" value={a.reference} />
              </dl>
            </div>
          </Panel>

          <Panel title="Applicant">
            <div className="px-5 pb-4">
              <dl className="divide-y divide-surface-border">
                <Row label="Full name" value={a.applicantName} />
                <Row label="Email" value={a.email} />
                <Row label="Mobile" value={a.mobile} />
              </dl>
            </div>
          </Panel>

          <Panel title="Address">
            <div className="px-5 pb-4">
              <dl className="divide-y divide-surface-border">
                <Row label="Office address" value={a.officeAddress} />
                <Row label="City" value={a.city} />
                <Row label="State" value={a.state} />
                <Row label="Country" value={a.country} />
                <Row label="PIN code" value={a.pincode} />
              </dl>
            </div>
          </Panel>

          <Panel title="Tax & KYC">
            <div className="px-5 pb-4">
              <dl className="divide-y divide-surface-border">
                <Row label="PAN" value={a.pan} />
                <Row label="GSTIN" value={a.gstin} />
                <Row label="Udyam" value={a.udyam} />
              </dl>
              <div className="mt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-faint">Uploaded documents</p>
                {kycDocs.length === 0 ? (
                  <p className="flex items-start gap-2 text-xs text-ink-muted">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
                    No documents uploaded yet. The agent uploads identity, PAN, GST and business proof in their dashboard KYC step.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {kycDocs.map((d) => (
                      <li key={d.id} className="flex items-center justify-between rounded-xl border border-surface-border px-3 py-2">
                        <span className="min-w-0">
                          <span className="text-xs font-semibold text-brand-navy">{d.kind}</span>
                          <span className="ml-2 truncate text-xs text-ink-faint">{d.filename}</span>
                        </span>
                        <a href={`/api/agent/kyc/${d.id}`} target="_blank" rel="noreferrer" className="shrink-0 text-xs font-semibold text-brand-blue hover:underline">View →</a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Panel>
        </div>

        {/* Decision panel */}
        <div className="space-y-6">
          <Panel title="Review decision">
            <div className="space-y-4 px-5 pb-5">
              {a.status === "APPROVED" ? (
                <div className="flex items-start gap-2 rounded-xl border border-success/30 bg-success/5 p-3 text-sm text-success">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>Approved{a.reviewedAt ? ` on ${formatDate(a.reviewedAt)}` : ""}. The agent can sign in and transact.</div>
                </div>
              ) : a.status === "REJECTED" ? (
                <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>Rejected{a.reviewedAt ? ` on ${formatDate(a.reviewedAt)}` : ""}.{a.reviewNote ? ` Reason: ${a.reviewNote}` : ""}</div>
                </div>
              ) : (
                <p className="text-sm text-ink-muted">Review the details, then approve to activate this agency, or reject with a reason.</p>
              )}

              {!decided && a.status !== "UNDER_REVIEW" && (
                <form action={setUnderReview}>
                  <input type="hidden" name="id" value={a.id} />
                  <button type="submit" className={buttonVariants({ variant: "outline", size: "sm", className: "w-full" })}>
                    <Clock className="h-4 w-4" /> Mark under review
                  </button>
                </form>
              )}

              {a.status !== "APPROVED" && (
                <form action={approveAgency}>
                  <input type="hidden" name="id" value={a.id} />
                  <button type="submit" className={buttonVariants({ variant: "primary", className: "w-full" })}>
                    <CheckCircle2 className="h-4 w-4" /> Approve agency
                  </button>
                </form>
              )}

              {a.status !== "REJECTED" && (
                <form action={rejectAgency} className="space-y-2">
                  <input type="hidden" name="id" value={a.id} />
                  <textarea name="note" rows={2} placeholder="Reason (optional, emailed to the applicant)"
                    className="w-full rounded-xl border border-surface-border px-3 py-2 text-sm focus:border-danger focus:outline-none focus:ring-4 focus:ring-danger/10" />
                  <button type="submit" className={buttonVariants({ variant: "danger", size: "sm", className: "w-full" })}>
                    <XCircle className="h-4 w-4" /> Reject application
                  </button>
                </form>
              )}
            </div>
          </Panel>

          <Panel title="Account & wallet">
            <div className="px-5 pb-4">
              <dl className="divide-y divide-surface-border">
                <Row label="Agent account" value={a.customerId ? "Linked" : "Not linked"} />
                <Row label="Wallet balance" value={wallet ? `₹${wallet.balance.toLocaleString("en-IN")}` : "—"} />
                <Row label="On hold" value={wallet ? `₹${wallet.onHold.toLocaleString("en-IN")}` : "—"} />
                <Row label="Submitted" value={a.submittedAt ? formatDate(a.submittedAt) : "—"} />
              </dl>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
