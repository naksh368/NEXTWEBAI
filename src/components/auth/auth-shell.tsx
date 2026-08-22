import Link from "next/link";
import { ShieldCheck, Wallet, Headset, Plane } from "lucide-react";
import { Logo } from "@/components/ui/logo";

/**
 * Premium two-column auth layout. Desktop shows a branded blue panel beside the
 * form; mobile stacks the logo above the form. Used by sign-in and sign-up.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-[1100px] grid-cols-1 items-stretch gap-0 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:py-14">
      {/* Brand panel — desktop only */}
      <div className="relative hidden overflow-hidden rounded-3xl bg-gradient-to-br from-brand-blue to-brand-blueDark p-10 text-white lg:flex lg:flex-col">
        <div className="dotted-bg absolute inset-0 opacity-10" aria-hidden />
        <div className="relative">
          {/* Logo on a dark panel: white "expertz" + orange "trip" (brand accent). */}
          <Link href="/" className="inline-flex items-baseline text-3xl font-extrabold lowercase tracking-tight">
            <span className="text-white">expertz</span><span className="text-brand-orange">trip</span>
          </Link>
          <h2 className="mt-10 text-4xl font-extrabold leading-[1.1] !text-white">Your next holiday<br />starts here.</h2>
          <p className="mt-4 max-w-sm text-white/85">Handpicked holidays, transparent pricing and expert support — from India to the world.</p>
        </div>
        <ul className="relative mt-auto space-y-3 pt-10 text-sm text-white">
          {[
            { icon: ShieldCheck, t: "Real, complete holiday packages" },
            { icon: Wallet, t: "Transparent pricing — no hidden costs" },
            { icon: Headset, t: "Expert travel support, whenever you need it" },
            { icon: Plane, t: "Book online, manage your trip in one place" },
          ].map((f) => (
            <li key={f.t} className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15"><f.icon className="h-4 w-4" /></span>
              {f.t}
            </li>
          ))}
        </ul>
      </div>

      {/* Form card */}
      <div className="flex items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex justify-center lg:hidden"><Logo size="md" /></div>
          <div className="rounded-3xl border border-surface-border bg-white p-7 shadow-card sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
