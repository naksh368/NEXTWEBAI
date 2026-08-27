import Link from "next/link";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { AGENT_STATUS_META, businessTypeLabel } from "@/lib/agent-constants";

export const metadata = { title: "Agencies" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "All", status: null },
  { key: "pending", label: "Pending", status: "PENDING_REVIEW" },
  { key: "correction", label: "Correction", status: "CORRECTION_REQUESTED" },
  { key: "approved", label: "Approved", status: "APPROVED" },
  { key: "rejected", label: "Rejected", status: "REJECTED" },
  { key: "suspended", label: "Suspended", status: "SUSPENDED" },
];

export default async function AdminAgenciesPage({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string }> }) {
  await requireAdmin();
  const { filter, q } = await searchParams;
  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];

  const where: Prisma.AgentWhereInput = {
    status: active.status ? active.status : { not: "DRAFT" },
    ...(q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { mobile: { contains: q } },
            { applicationId: { contains: q.toUpperCase() } },
            { agency: { agencyName: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const agents = await db.agent.findMany({ where, include: { agency: true }, orderBy: { submittedAt: "desc" }, take: 100 });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Agencies</h1>
          <p className="text-sm text-ink-muted">Review and manage partner agencies</p>
        </div>
        <form className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="Search name, email, app ID…" className="h-10 w-64 rounded-xl border border-surface-border px-3.5 text-sm" />
          <button className="rounded-xl bg-brand-blue px-4 text-sm font-bold text-white">Search</button>
        </form>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Link key={f.key} href={`/admin/agencies?filter=${f.key}`} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${active.key === f.key ? "bg-brand-blue text-white" : "bg-white text-ink-muted ring-1 ring-surface-border"}`}>
            {f.label}
          </Link>
        ))}
      </div>

      {agents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-border bg-surface-muted/40 px-6 py-16 text-center">
          <p className="text-sm font-semibold text-brand-navy">No agencies found</p>
          <p className="mt-1 text-sm text-ink-muted">New registrations will appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-surface-border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left text-xs font-semibold uppercase tracking-wide text-ink-faint">
                <th className="p-3">Agency</th><th className="p-3">Applicant</th><th className="p-3">Type</th>
                <th className="p-3">App ID</th><th className="p-3">Submitted</th><th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => {
                const meta = AGENT_STATUS_META[a.status];
                return (
                  <tr key={a.id} className="border-b border-surface-border/50 hover:bg-surface-muted/40">
                    <td className="p-3"><Link href={`/admin/agencies/${a.id}`} className="font-semibold text-brand-blue">{a.agency?.agencyName ?? "—"}</Link></td>
                    <td className="p-3"><p className="font-medium">{a.fullName}</p><p className="text-xs text-ink-faint">{a.email}</p></td>
                    <td className="p-3 text-ink-muted">{a.agency ? businessTypeLabel(a.agency.businessType) : "—"}</td>
                    <td className="p-3 font-mono text-xs">{a.applicationId ?? "—"}</td>
                    <td className="p-3 text-ink-muted">{a.submittedAt ? formatDate(a.submittedAt) : "—"}</td>
                    <td className="p-3"><Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? a.status}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
