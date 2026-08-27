import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/auth";
import { db } from "@/lib/db";
import { PortalHeader } from "@/components/portal/portal-header";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login");

  let agencyName: string | null = null;
  let logoUrl: string | null = null;
  try {
    const app = await db.agencyApplication.findFirst({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      select: { agencyName: true, agencyLogoUrl: true },
    });
    agencyName = app?.agencyName ?? null;
    logoUrl = app?.agencyLogoUrl ?? null;
  } catch { /* not migrated yet */ }

  return (
    <div className="min-h-screen bg-surface-muted/30">
      <PortalHeader agentName={customer.fullName ?? "Agent"} agencyName={agencyName} logoUrl={logoUrl} />
      {children}
    </div>
  );
}
