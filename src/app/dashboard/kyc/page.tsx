import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, FileCheck2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { getCurrentCustomer } from "@/lib/auth";
import { db } from "@/lib/db";
import { getKycState } from "@/lib/services/kyc-service";
import { KYC_DOC_TYPES, APPLICATION_STATUS_LABEL } from "@/lib/agency";
import { KycUploadRow, LogoUpload, SubmitKyc } from "@/components/kyc/kyc-uploader";

export const metadata = { title: "KYC & Documents" };
export const dynamic = "force-dynamic";

export default async function KycPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login");

  let state = { docs: [] as { id: string; kind: string; filename: string; contentType: string; status: string; createdAt: Date }[], logoId: null as string | null, requiredTotal: 3, requiredDone: 0, complete: false };
  let appStatus: string | null = null;
  try {
    state = await getKycState(customer.id);
    const app = await db.agencyApplication.findFirst({ where: { customerId: customer.id }, orderBy: { createdAt: "desc" }, select: { status: true } });
    appStatus = app?.status ?? null;
  } catch { /* not migrated yet */ }

  const pct = Math.round((state.requiredDone / Math.max(1, state.requiredTotal)) * 100);
  const latestOf = (kind: string) => {
    const d = state.docs.find((x) => x.kind === kind);
    return d ? { id: d.id, filename: d.filename, status: d.status } : null;
  };

  return (
    <div>
      <Container className="py-8 sm:py-10">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-brand-navy">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>

        <div className="mt-4">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-orange">Verification</p>
          <h1 className="mt-1 text-2xl font-extrabold text-brand-navy sm:text-3xl">KYC &amp; documents</h1>
          <p className="mt-1.5 text-ink-muted">Upload your agency documents so we can verify and approve your account.</p>
        </div>

        {/* Progress */}
        <div className="mt-6 rounded-2xl border border-surface-border bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 font-bold text-brand-navy">
              <FileCheck2 className="h-5 w-5 text-brand-blue" /> KYC progress
            </p>
            <span className="text-sm font-semibold text-ink-muted">{state.requiredDone}/{state.requiredTotal} required · {state.docs.length} uploaded</span>
          </div>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
            <div className="h-full rounded-full bg-brand-blue transition-all" style={{ width: `${pct}%` }} />
          </div>
          {appStatus && (
            <p className="mt-3 text-sm text-ink-muted">
              Application status: <span className="font-semibold text-brand-navy">{APPLICATION_STATUS_LABEL[appStatus] ?? appStatus}</span>
            </p>
          )}
        </div>

        {/* Logo */}
        <h2 className="mt-8 text-lg font-bold text-brand-navy">Agency branding</h2>
        <div className="mt-3">
          <LogoUpload logoId={state.logoId} />
        </div>

        {/* Documents */}
        <h2 className="mt-8 text-lg font-bold text-brand-navy">Documents</h2>
        <div className="mt-3 space-y-3">
          {KYC_DOC_TYPES.map((t) => (
            <KycUploadRow key={t.kind} kind={t.kind} label={t.label} hint={t.hint} required={t.required} existing={latestOf(t.kind)} />
          ))}
        </div>

        {/* Submit */}
        <div className="mt-8">
          <SubmitKyc complete={state.complete && appStatus !== "APPROVED"} />
        </div>
        <p className="mt-3 text-xs text-ink-faint">
          Your documents are stored privately and are visible only to you and the ExpertzTrip verification team. Max 8 MB per file · PDF, JPG, PNG or WEBP.
        </p>
      </Container>
    </div>
  );
}
