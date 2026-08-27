import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Bell } from "lucide-react";
import { requireApprovedAgent } from "@/lib/agent-auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

async function markAllRead() {
  "use server";
  const { getAgentSessionId } = await import("@/lib/agent-session");
  const id = await getAgentSessionId();
  if (id) await db.agentNotification.updateMany({ where: { agentId: id, isRead: false }, data: { isRead: true } });
  revalidatePath("/agent/notifications");
}

export default async function NotificationsPage() {
  const agent = await requireApprovedAgent();
  const items = await db.agentNotification.findMany({ where: { agentId: agent.id }, orderBy: { createdAt: "desc" }, take: 100 });
  const hasUnread = items.some((i) => !i.isRead);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Notifications</h1>
        {hasUnread && (
          <form action={markAllRead}>
            <button className="text-sm font-semibold text-brand-blue">Mark all read</button>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-border bg-surface-muted/40 px-6 py-16 text-center">
          <Bell className="mx-auto text-ink-faint" size={26} />
          <p className="mt-3 text-sm font-semibold text-ink">No notifications yet</p>
          <p className="mt-0.5 text-xs text-ink-muted">Updates about your account, bookings and payments will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const inner = (
              <div className={`rounded-xl border p-4 ${n.isRead ? "border-surface-border bg-white" : "border-brand-blue/20 bg-brand-blueLight/40"}`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-bold text-ink">{n.title}</p>
                  {!n.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-orange" />}
                </div>
                {n.body && <p className="mt-0.5 text-sm text-ink-muted">{n.body}</p>}
                <p className="mt-1 text-xs text-ink-faint">{formatDate(n.createdAt, { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            );
            return n.href ? <Link key={n.id} href={n.href}>{inner}</Link> : <div key={n.id}>{inner}</div>;
          })}
        </div>
      )}
    </div>
  );
}
