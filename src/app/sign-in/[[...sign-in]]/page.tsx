import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { LoginFlow } from "@/components/auth/login-flow";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  void searchParams; // redirect_url handled client-side by LoginFlow
  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-sm">
        <LoginFlow />
      </div>
    </Container>
  );
}
