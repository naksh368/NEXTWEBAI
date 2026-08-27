import Link from "next/link";
import { ShieldCheck, Wallet, LayoutDashboard, ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Partner Login",
  description: "Sign in to your ExpertzTrip partner portal to manage bookings, wallet and reports.",
};

const POINTS = [
  { icon: LayoutDashboard, title: "Your business at a glance", body: "Bookings, sales and earnings in one dashboard." },
  { icon: Wallet, title: "Prepaid balance & ledger", body: "Top up, hold and track every transaction with a reference." },
  { icon: ShieldCheck, title: "Secure sign-in", body: "Password plus an emailed one-time code when configured." },
];

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      {/* Form panel */}
      <main className="order-2 flex items-center justify-center bg-surface px-4 py-10 sm:px-8 lg:order-1">
        <Container className="max-w-md px-0 sm:px-0">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Logo size="md" />
            <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-brand-navy">
              <ArrowLeft className="h-4 w-4" /> Home
            </Link>
          </div>

          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-orange">Partner login</p>
            <h2 className="mt-1.5 text-2xl font-extrabold text-brand-navy sm:text-3xl">Welcome back</h2>
            <p className="mt-1.5 text-ink-muted">Sign in to your ExpertzTrip Partner Portal.</p>
          </div>

          <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card sm:p-8">
            <LoginForm />
          </div>
        </Container>
      </main>

      {/* Brand / value panel */}
      <aside className="relative order-1 hidden overflow-hidden bg-gradient-to-br from-brand-blue to-brand-blueDark p-10 text-white lg:order-2 lg:flex lg:flex-col xl:p-14">
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/5 blur-2xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-72 w-72 rounded-full bg-brand-orange/10 blur-2xl" aria-hidden />
        <div className="relative">
          <span className="text-2xl font-extrabold lowercase tracking-tight">
            expertz<span className="text-brand-orange">trip</span>
          </span>
          <h1 className="mt-10 text-3xl font-extrabold leading-tight xl:text-4xl">
            Run your agency from one smarter platform.
          </h1>
          <p className="mt-4 max-w-md text-white/80">
            Bookings, prepaid balance, reporting and support — everything your agency needs, in one place.
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
    </div>
  );
}
