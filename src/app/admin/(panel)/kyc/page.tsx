import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { AGENT_STATUS_META, businessTypeLabel, requiredDocsFor } from "@/lib/agent-constants";

export const metadata = { title: "KYC Queue" };
export const dynamic = "force-dynamic";

export default async function KycQueuePage() {
  await requireAdmin();
  const agents = await db.agent.findMany({
    where: { status: { in: ["PENDING_REVIEW", "CORRECTION_REQUESTED"] } },
    include: { agency: true, documents: true },
    orderBy: { submittedAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">KYC Queue</h1>
        <p className="text-sm text-ink-muted">Applications awaiting review, oldest first</p>
      </div>

      {agents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-border bg-surface-muted/40 px-6 py-16 text-center">
          <p className="text-sm font-semibold text-brand-navy">Queue is clear</p>
          <p className="mt-1 text-sm text-ink-muted">No applications are waiting for review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((a) => {
            const required = a.agency ? requiredDocsFor(a.agency.businessType) : [];
            const have = new Set(a.documents.map((d) => d.type));
            const complete = required.filter((r) => have.has(r.type)).length;
            const meta = AGENT_STATUS_META[a.status];
            return (
              <Link key={a.id} href={`/admin/agencies/${a.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-border bg-white p-4 hover:border-brand-blue/40">
                <div>
                  <p className="font-semibold text-brand-navy">{a.agency?.agencyName ?? a.fullName}</p>
                  <p className="text-xs text-ink-faint">{a.applicationId} · {a.agency ? businessTypeLabel(a.agency.businessType) : "—"} · submitted {a.submittedAt ? formatDate(a.submittedAt) : "—"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={complete === required.length ? "success" : "warning"}>Docs {complete}/{required.length}</Badge>
                  <Badge tone={meta?.tone ?? "neutral"}>{meta?.label}</Badge>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
