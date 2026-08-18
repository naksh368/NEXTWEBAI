import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/auth/profile-form";
import { getCurrentCustomer } from "@/lib/auth";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

export default async function ProfilePage() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect("/sign-in?redirect_url=/account/profile");
  }
  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: "Account", href: "/account" }, { label: "Profile" }]} />
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Profile</h1>
      <p className="mt-1 text-ink-muted">Manage your personal details.</p>
      <div className="mt-6">
        <ProfileForm initial={{ fullName: customer.fullName ?? "", email: customer.email ?? "", mobile: customer.mobile ?? "" }} />
      </div>
    </Container>
  );
}
