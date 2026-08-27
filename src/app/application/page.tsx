import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, XCircle, AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { getAgentSessionId } from "@/lib/agent-session";
import { AuthShell } from "@/components/b2b/auth-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { AGENT_STATUS_META } from "@/lib/agent-constants";

export const metadata = { title: "Your Application" };
export const dynamic = "force-dynamic";

export default async function ApplicationPage({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const { submitted } = await searchParams;
  const id = await getAgentSessionId();
  if (!id) redirect("/login?redirect_url=/application");
  const agent = await db.agent.findUnique({ where: { id }, include: { agency: true, documents: true } });
  if (!agent) redirect("/login");
  if (agent.status === "DRAFT" && !agent.applicationId) redirect("/register");
  if (agent.status === "APPROVED") redirect("/agent");

  const meta = AGENT_STATUS_META[agent.status] ?? AGENT_STATUS_META.PENDING_REVIEW;
  const justSubmitted = Boolean(submitted);

  const timeline = [
    { label: "Account Created", done: true },
    { label: "Email Verified", done: agent.isEmailVerified },
    { label: "Application Submitted", done: Boolean(agent.submittedAt) },
    { label: "KYC Review", done: agent.status === "APPROVED", current: agent.status === "PENDING_REVIEW" },
  ];

  return (
    <AuthShell title={justSubmitted ? "Application Submitted" : "Your Application"} subtitle={agent.agency?.agencyName ?? undefined}
      footer={<>Need help? <Link href="/support-center" className="font-semibold text-brand-blue">Contact support</Link></>}>
      <div className="space-y-6">
        <div className="flex items-center justify-between rounded-xl bg-surface-muted/60 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Application ID</p>
            <p className="mt-0.5 font-mono text-lg font-bold text-ink">{agent.applicationId ?? "—"}</p>
          </div>
          <Badge tone={meta.tone}>{meta.label}</Badge>
        </div>

        <ol className="space-y-3">
          {timeline.map((t) => (
            <li key={t.label} className="flex items-center gap-3">
              {t.done ? (
                <CheckCircle2 size={20} className="shrink-0 text-success" />
              ) : t.current ? (
                <Clock size={20} className="shrink-0 text-brand-orange" />
              ) : (
                <span className="h-5 w-5 shrink-0 rounded-full border-2 border-surface-border" />
              )}
              <span className={`text-sm font-semibold ${t.done ? "text-ink" : t.current ? "text-brand-orange" : "text-ink-faint"}`}>
                {t.label}{t.current ? " — Pending" : ""}
              </span>
            </li>
          ))}
        </ol>

        {agent.status === "PENDING_REVIEW" && (
          <p className="rounded-xl border border-brand-blue/15 bg-brand-blueLight px-4 py-3 text-sm text-brand-blue">
            Your agency application has been submitted successfully. Our team will review your application and update your status.
          </p>
        )}
        {agent.status === "REJECTED" && (
          <div className="rounded-xl border border-danger/20 bg-[#FCE9E9] px-4 py-3 text-sm text-danger">
            <p className="flex items-center gap-1.5 font-bold"><XCircle size={16} /> Application not approved</p>
            {agent.decisionReason && <p className="mt-1">{agent.decisionReason}</p>}
            <Link href="/register" className="mt-2 inline-block font-semibold underline">Correct &amp; Resubmit</Link>
          </div>
        )}
        {agent.status === "CORRECTION_REQUESTED" && (
          <div className="rounded-xl border border-warning/20 bg-[#FDF2E3] px-4 py-3 text-sm text-warning">
            <p className="flex items-center gap-1.5 font-bold"><AlertTriangle size={16} /> Correction requested</p>
            {agent.decisionReason && <p className="mt-1">{agent.decisionReason}</p>}
            <Link href="/register" className="mt-2 inline-block font-semibold underline">Update &amp; Resubmit</Link>
          </div>
        )}
        {agent.status === "SUSPENDED" && (
          <p className="rounded-xl border border-danger/20 bg-[#FCE9E9] px-4 py-3 text-sm text-danger">Your account is currently suspended. Please contact support.</p>
        )}

        <div className="flex gap-3">
          <Link href="/" className={buttonVariants({ variant: "outline", className: "flex-1" })}>Back to Home</Link>
          <form action={logout} className="flex-1">
            <button type="submit" className={buttonVariants({ variant: "ghost", className: "w-full" })}>Logout</button>
          </form>
        </div>
      </div>
    </AuthShell>
  );
}

async function logout() {
  "use server";
  const { clearAgentCookie } = await import("@/lib/agent-session");
  await clearAgentCookie();
  redirect("/");
}
