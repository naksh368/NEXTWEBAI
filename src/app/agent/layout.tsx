import { requireApprovedAgent } from "@/lib/agent-auth";
import { db } from "@/lib/db";
import { PortalHeader } from "@/components/b2b/portal-header";

export const dynamic = "force-dynamic";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const agent = await requireApprovedAgent();
  const unread = await db.agentNotification.count({ where: { agentId: agent.id, isRead: false } });

  return (
    <div className="flex min-h-screen flex-col bg-surface-muted/30">
      <PortalHeader
        agentName={agent.fullName}
        agencyName={agent.agencyName}
        logoDocumentId={agent.logoDocumentId}
        unread={unread}
      />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
