import Link from "next/link";
import { ShieldCheck, BadgeCheck, Wallet, Headset, ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = {
  title: "Register Your Agency",
  description: "Create your ExpertzTrip partner account — register your travel agency, verify by email and start booking.",
};

const POINTS = [
  { icon: Wallet, title: "One prepaid balance", body: "Add verified funds and book from a single balance you control." },
  { icon: ShieldCheck, title: "Secure & server-verified", body: "Payments and wallet credits are verified server-side. No surprises." },
  { icon: BadgeCheck, title: "Quick verification", body: "A guided KYC process gets your agency reviewed and approved." },
  { icon: Headset, title: "Dedicated agent support", body: "Real support for your bookings, refunds and day-to-day operations." },
];

export default function RegisterPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
      {/* Brand / value panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-blue to-brand-blueDark p-10 text-white lg:flex lg:flex-col xl:p-14">
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/5 blur-2xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-72 w-72 rounded-full bg-brand-orange/10 blur-2xl" aria-hidden />
        <div className="relative">
          <span className="text-2xl font-extrabold lowercase tracking-tight">
            expertz<span className="text-brand-orange">trip</span>
          </span>
          <h1 className="mt-10 text-3xl font-extrabold leading-tight xl:text-4xl">
            Register your agency and start booking smarter.
          </h1>
          <p className="mt-4 max-w-md text-white/80">
            Join ExpertzTrip — India&apos;s smarter B2B travel platform. Powerful tools, a prepaid booking balance and transparent business tools built for travel agents.
          </p>
        </div>
        <ul className="relative mt-10 space-y-5">
          {POINTS.map((p) => (
            <li key={p.title} className="flex gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <p.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold">{p.title}</p>
                <p className="text-sm text-white/75">{p.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="relative mt-auto pt-10 text-xs text-white/60">
          Illustrative figures on the site are sample data. Your live portal shows real, authenticated values.
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex items-start justify-center bg-surface px-4 py-10 sm:px-8">
        <Container className="max-w-xl px-0 sm:px-0">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Logo size="md" />
            <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-brand-navy">
              <ArrowLeft className="h-4 w-4" /> Home
            </Link>
          </div>

          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-orange">Register your agency</p>
            <h2 className="mt-1.5 text-2xl font-extrabold text-brand-navy sm:text-3xl">Create your partner account</h2>
            <p className="mt-1.5 text-ink-muted">Takes a few minutes. Verified by email — no mobile OTP needed.</p>
          </div>

          <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card sm:p-8">
            <RegisterForm />
          </div>
        </Container>
      </main>
    </div>
  );
}
