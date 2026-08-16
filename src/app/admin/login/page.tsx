import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { AdminLoginForm } from "@/components/admin/login-form";
import { getCurrentAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };

export default async function AdminLoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size="lg" href={null} />
          <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-brand-orange">Operations Console</p>
        </div>
        <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-card sm:p-8">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
