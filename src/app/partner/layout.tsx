import { redirect } from "next/navigation";
import { getCurrentAgent } from "@/lib/agent-auth";
import { PartnerHeader } from "@/components/partner/partner-header";

export const metadata = { title: "Partner Dashboard" };

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const agent = await getCurrentAgent();
  if (!agent) redirect("/partner-login");

  return (
    <div className="min-h-screen bg-surface-muted/40">
      <PartnerHeader agencyName={agent.agencyName} />
      <main className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
