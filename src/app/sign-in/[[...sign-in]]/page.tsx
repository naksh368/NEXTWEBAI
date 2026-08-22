import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginFlow } from "@/components/auth/login-flow";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const raw = sp.redirect_url;
  const redirectTo = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/account";
  return (
    <AuthShell>
      <LoginFlow redirectTo={redirectTo} />
    </AuthShell>
  );
}
