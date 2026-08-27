"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, ArrowRight, UserRound } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * ExpertzTrip B2B marketing header.
 *
 * Matches the reference: compact centre nav, an orange "Register Your Agency"
 * primary CTA and a blue "Partner Login". Refined proportions — the CTAs are a
 * touch smaller than the reference so the bar reads premium and balanced.
 */
const NAV: { label: string; href: string; hasMenu?: boolean }[] = [
  { label: "Flights", href: "/#benefits", hasMenu: true },
  { label: "Why ExpertzTrip", href: "/#why" },
  { label: "For Agents", href: "/#how-it-works" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Support", href: "/support" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 print:hidden">
      <div className="mx-auto flex h-[68px] w-full max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo size="md" />

        <nav className="hidden items-center gap-0.5 lg:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href.split("#")[0]) && item.href.includes("#") === false);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[15px] font-semibold text-ink-muted transition-colors hover:bg-surface-muted hover:text-brand-navy",
                  active && "text-brand-navy"
                )}
              >
                {item.label}
                {item.hasMenu && <ChevronDown className="h-4 w-4 opacity-70" />}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2.5 sm:flex">
          <Link href="/register" className={buttonVariants({ variant: "orange", size: "md", className: "px-5" })}>
            Register Your Agency <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/partner-login" className={buttonVariants({ variant: "primary", size: "md", className: "px-5" })}>
            <UserRound className="h-4 w-4" /> Partner Login
          </Link>
        </div>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-surface-border bg-white lg:hidden">
          <nav className="mx-auto flex max-w-[1200px] flex-col gap-1 px-4 py-3">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[15px] font-semibold text-ink hover:bg-surface-muted"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-1 gap-2">
              <Link href="/register" onClick={() => setOpen(false)} className={buttonVariants({ variant: "orange", size: "md", className: "w-full" })}>
                Register Your Agency <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/partner-login" onClick={() => setOpen(false)} className={buttonVariants({ variant: "primary", size: "md", className: "w-full" })}>
                <UserRound className="h-4 w-4" /> Partner Login
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
