import { requireApprovedAgent } from "@/lib/agent-auth";
import { db } from "@/lib/db";
import { SupportForm } from "@/components/b2b/support-form";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Support" };
export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "info" | "success" | "neutral" | "warning"> = {
  OPEN: "warning", IN_PROGRESS: "info", RESOLVED: "success", CLOSED: "neutral",
};

export default async function SupportPage() {
  const agent = await requireApprovedAgent();
  const tickets = await db.agentSupportTicket.findMany({ where: { agentId: agent.id }, orderBy: { createdAt: "desc" }, take: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Support</h1>
        <p className="text-sm text-ink-muted">Raise and track support tickets</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
          <h2 className="mb-4 text-base font-bold">New ticket</h2>
          <SupportForm />
        </div>

        <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
          <h2 className="mb-4 text-base font-bold">Your tickets</h2>
          {tickets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-surface-border bg-surface-muted/40 px-4 py-10 text-center">
              <p className="text-sm font-semibold text-ink">No tickets yet</p>
              <p className="mt-0.5 text-xs text-ink-muted">Create a ticket and we&apos;ll help you out.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-surface-border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">{t.subject}</p>
                    <p className="text-xs text-ink-faint">{t.reference} · {t.category} · {formatDate(t.createdAt)}</p>
                  </div>
                  <Badge tone={STATUS_TONE[t.status] ?? "neutral"}>{t.status.replace(/_/g, " ")}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
