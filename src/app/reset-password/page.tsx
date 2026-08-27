import { AuthShell } from "@/components/b2b/auth-shell";
import { ResetForm } from "@/components/b2b/reset-form";

export const metadata = { title: "Reset Password" };
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <AuthShell title="Reset Your Password" subtitle="Choose a new password for your ExpertzTrip account">
      <ResetForm token={token ?? ""} />
    </AuthShell>
  );
}
