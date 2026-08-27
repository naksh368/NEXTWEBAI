import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { formatPaise } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agents · Admin" };

const STATUSES = ["ALL", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"] as const;

const TONE: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning",
  UNDER_REVIEW: "bg-brand-blueLight text-brand-blue",
  APPROVED: "bg-success/10 text-success",
  REJECTED: "bg-danger/10 text-danger",
  SUSPENDED: "bg-danger/10 text-danger",
};

export default async function AdminAgentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status } = await searchParams;
  const active = (status && STATUSES.includes(status as never) ? status : "ALL") as string;

  const agents = await db.agent.findMany({
    where: active === "ALL" ? {} : { status: active },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { wallet: true },
  });

  const counts = await db.agent.groupBy({ by: ["status"], _count: true });
  const countFor = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy">Agents</h1>
        <p className="mt-1 text-sm text-ink-muted">Review registrations, approve KYC and manage agent wallets.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin/agents${s === "ALL" ? "" : `?status=${s}`}`}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${active === s ? "bg-brand-blue text-white" : "bg-surface-muted text-ink-muted hover:text-brand-navy"}`}>
            {s.replace("_", " ")}{s !== "ALL" && ` (${countFor(s)})`}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-surface-border bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-surface-border bg-surface-muted/50 text-left text-xs font-bold uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-3">Agency</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Wallet</th>
                <th className="px-4 py-3">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {agents.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-ink-muted">No agents in this view.</td></tr>
              ) : agents.map((a) => (
                <tr key={a.id} className="hover:bg-surface-muted/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/agents/${a.id}`} className="font-bold text-brand-blue hover:underline">{a.agencyName}</Link>
                    <p className="text-xs text-ink-faint">{a.city ?? "—"}{a.state ? `, ${a.state}` : ""}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-brand-navy">{a.ownerName}</p>
                    <p className="text-xs text-ink-faint">{a.email} · {a.mobile}</p>
                  </td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${TONE[a.status] ?? "bg-surface-muted text-ink-muted"}`}>{a.status.replace("_", " ")}</span></td>
                  <td className="px-4 py-3 font-semibold text-brand-navy">{a.wallet ? formatPaise(a.wallet.balancePaise) : "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{new Date(a.createdAt).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
