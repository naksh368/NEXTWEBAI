import { redirect } from "next/navigation";
import { requireApprovedAgent } from "@/lib/agent-auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { LogoManager, ChangePassword } from "@/components/b2b/profile-actions";
import { businessTypeLabel, maskPan } from "@/lib/agent-constants";

export const metadata = { title: "Agency Profile" };
export const dynamic = "force-dynamic";

async function logout() {
  "use server";
  const { clearAgentCookie } = await import("@/lib/agent-session");
  await clearAgentCookie();
  redirect("/login");
}

export default async function ProfilePage() {
  const agent = await requireApprovedAgent();
  const full = await db.agent.findUnique({ where: { id: agent.id }, include: { agency: true } });
  const ag = full?.agency;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-extrabold">Agency Profile</h1>

      <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
        <LogoManager logoDocumentId={ag?.logoDocumentId ?? null} agencyName={ag?.agencyName ?? null} />
      </div>

      <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold">Agency Information</h2>
          <Badge tone="success">KYC {ag?.kycStatus === "APPROVED" ? "Approved" : "Verified"}</Badge>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          <Row k="Agency Name" v={ag?.agencyName} />
          <Row k="Owner Name" v={full?.fullName} />
          <Row k="Mobile" v={full?.mobile} />
          <Row k="Email" v={full?.email} />
          <Row k="Business Type" v={ag ? businessTypeLabel(ag.businessType) : "—"} />
          <Row k="GSTIN" v={ag?.gstin || "Not provided"} />
          <Row k="PAN" v={maskPan(ag?.pan)} />
          <Row k="Application ID" v={full?.applicationId} />
          <Row k="Office Address" v={ag ? `${ag.officeAddress}, ${ag.city}, ${ag.state} ${ag.pinCode}, ${ag.country}` : "—"} span />
        </dl>
        <p className="mt-4 text-xs text-ink-faint">Verified identity fields (PAN, GSTIN, business type) are locked after approval. Contact support to change them.</p>
      </div>

      <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
        <h2 className="mb-4 text-base font-bold">Change Password</h2>
        <ChangePassword />
      </div>

      <form action={logout}>
        <button className={buttonVariants({ variant: "outline", className: "w-full" })}>Logout</button>
      </form>
    </div>
  );
}

function Row({ k, v, span }: { k: string; v?: string | null; span?: boolean }) {
  return (
    <div className={span ? "sm:col-span-2" : ""}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{k}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-ink">{v || "—"}</dd>
    </div>
  );
}
