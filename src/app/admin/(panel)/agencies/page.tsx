import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, StatCard, Panel, Table, Th, Td, EmptyRow, Pill, AdminPager } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";
import { businessTypeLabel, APPLICATION_STATUS_LABEL } from "@/lib/agency";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

const STATUS_TONE: Record<string, "info" | "warning" | "success" | "neutral" | "brand" | "danger"> = {
  PENDING_OTP: "neutral",
  SUBMITTED: "brand",
  UNDER_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};
const FILTERS = ["ALL", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"] as const;

export default async function AdminAgenciesPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  await requireAdmin("customer.view");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const status = (FILTERS as readonly string[]).includes(sp.status ?? "") ? sp.status! : "ALL";

  // Real submissions only (exclude un-verified PENDING_OTP drafts).
  const baseWhere = { status: { not: "PENDING_OTP" } } as const;
  const where = status === "ALL" ? baseWhere : { status };

  const [total, submitted, underReview, approved, rejected, rows] = await Promise.all([
    db.agencyApplication.count({ where: baseWhere }),
    db.agencyApplication.count({ where: { status: "SUBMITTED" } }),
    db.agencyApplication.count({ where: { status: "UNDER_REVIEW" } }),
    db.agencyApplication.count({ where: { status: "APPROVED" } }),
    db.agencyApplication.count({ where: { status: "REJECTED" } }),
    db.agencyApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  const filteredTotal =
    status === "ALL" ? total
      : status === "SUBMITTED" ? submitted
      : status === "UNDER_REVIEW" ? underReview
      : status === "APPROVED" ? approved
      : status === "REJECTED" ? rejected
      : rows.length;
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
  const pending = submitted + underReview;

  return (
    <>
      <PageHeader title="Agencies" subtitle="Travel-agency registrations and KYC review." />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total agencies" value={total} tone="navy" />
        <StatCard label="Pending applications" value={pending} tone="orange" hint="Needs review" />
        <StatCard label="Under review" value={underReview} tone="blue" />
        <StatCard label="Approved" value={approved} tone="green" />
        <StatCard label="Rejected" value={rejected} tone="blue" />
      </div>

      {/* Status filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link key={f} href={`/admin/agencies${f === "ALL" ? "" : `?status=${f}`}`}
            className={`rounded-full border px-3 py-1 text-sm font-semibold transition-colors ${status === f ? "border-brand-blue bg-brand-blue text-white" : "border-surface-border bg-white text-ink-muted hover:text-brand-navy"}`}>
            {f === "ALL" ? "All" : APPLICATION_STATUS_LABEL[f] ?? f}
          </Link>
        ))}
      </div>

      <Panel>
        <Table head={<><Th>Agency</Th><Th>Applicant</Th><Th>Type</Th><Th>Status</Th><Th>Submitted</Th><Th /></>}>
          {rows.length === 0 ? (
            <EmptyRow colSpan={6} label="No agency applications yet — registrations from the website will appear here." />
          ) : rows.map((a) => (
            <tr key={a.id} className="border-t border-surface-border hover:bg-surface-muted/40">
              <Td>
                <p className="font-semibold text-brand-navy">{a.agencyName}</p>
                <p className="text-xs text-ink-faint">{a.reference}</p>
              </Td>
              <Td>
                <p className="text-sm">{a.applicantName}</p>
                <p className="text-xs text-ink-faint">{a.email}{a.mobile ? ` · ${a.mobile}` : ""}</p>
              </Td>
              <Td><span className="text-sm">{businessTypeLabel(a.businessType)}</span></Td>
              <Td><Pill tone={STATUS_TONE[a.status] ?? "neutral"}>{APPLICATION_STATUS_LABEL[a.status] ?? a.status}</Pill></Td>
              <Td><span className="text-sm text-ink-muted">{a.submittedAt ? formatDate(a.submittedAt) : "—"}</span></Td>
              <Td>
                <Link href={`/admin/agencies/${a.id}`} className="text-sm font-semibold text-brand-blue hover:underline">Review →</Link>
              </Td>
            </tr>
          ))}
        </Table>
        {totalPages > 1 && <AdminPager page={page} totalPages={totalPages} base={`/admin/agencies${status === "ALL" ? "" : `?status=${status}`}`} />}
      </Panel>
    </>
  );
}
