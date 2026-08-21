import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { LoginFlow } from "@/components/auth/login-flow";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const raw = sp.redirect_url;
  // Only honour internal redirects.
  const redirectTo = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/account";
  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-sm">
        <LoginFlow redirectTo={redirectTo} />
      </div>
    </Container>
  );
}
