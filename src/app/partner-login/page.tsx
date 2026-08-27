import Link from "next/link";
import { ShieldCheck, Wallet, PlaneTakeoff } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { PartnerLoginForm } from "@/components/marketing/partner-login-form";

export const metadata = {
  title: "Partner Login",
  description: "Log in to your ExpertzTrip agent dashboard to search fares, manage your wallet and view bookings.",
};

export default function PartnerLoginPage() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 hero-wash" aria-hidden />
      <Container className="relative py-14 sm:py-20">
        <div className="mx-auto grid max-w-4xl items-center gap-10 lg:grid-cols-2">
          {/* Left — value reminder */}
          <div className="hidden lg:block">
            <Logo size="lg" />
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-brand-navy">
              Welcome back, partner.
            </h1>
            <p className="mt-3 max-w-sm text-ink-muted">
              Access your dashboard to search competitive fares, manage your prepaid
              wallet and track every booking.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                { icon: PlaneTakeoff, label: "Search & book flights" },
                { icon: Wallet, label: "Prepaid wallet & transactions" },
                { icon: ShieldCheck, label: "Secure, role-based access" },
              ].map((i) => (
                <li key={i.label} className="flex items-center gap-3 text-sm font-semibold text-brand-navy">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue">
                    <i.icon className="h-4 w-4" />
                  </span>
                  {i.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Right — login card */}
          <div className="mx-auto w-full max-w-md rounded-3xl border border-surface-border bg-white p-6 shadow-cardHover sm:p-8">
            <div className="lg:hidden">
              <Logo size="md" />
            </div>
            <h2 className="mt-4 text-2xl font-extrabold text-brand-navy lg:mt-0">Partner Login</h2>
            <p className="mt-1 text-sm text-ink-muted">Access your agent dashboard.</p>
            <div className="mt-6">
              <PartnerLoginForm />
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-ink-muted">
          Need help? <Link href="/support" className="font-semibold text-brand-blue hover:underline">Contact support</Link>
        </p>
      </Container>
    </section>
  );
}
