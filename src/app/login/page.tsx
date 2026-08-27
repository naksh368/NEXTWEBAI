import Link from "next/link";
import { redirect } from "next/navigation";
import { getAgentSessionId } from "@/lib/agent-session";
import { db } from "@/lib/db";
import { AuthShell } from "@/components/b2b/auth-shell";
import { LoginForm } from "@/components/b2b/login-form";

export const metadata = { title: "Partner Login" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect_url?: string }> }) {
  const { redirect_url } = await searchParams;
  const id = await getAgentSessionId();
  if (id) {
    const agent = await db.agent.findUnique({ where: { id }, select: { status: true } });
    if (agent?.status === "APPROVED") redirect("/agent");
    if (agent && agent.status !== "DRAFT") redirect("/application");
  }
  return (
    <AuthShell
      title="Partner Login"
      subtitle="Sign in to your ExpertzTrip agency portal"
      footer={<>New to ExpertzTrip? <Link href="/register" className="font-semibold text-brand-orange">Register Your Agency</Link></>}
    >
      <LoginForm redirectUrl={redirect_url} />
    </AuthShell>
  );
}
