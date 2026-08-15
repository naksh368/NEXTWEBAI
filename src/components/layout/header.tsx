"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Destinations", href: "/destinations" },
  { label: "Packages", href: "/packages" },
  { label: "Offers", href: "/offers" },
  { label: "How it works", href: "/#how-it-works" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Logo size="md" />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-brand-navy",
                    active && "text-brand-navy"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/ai"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-brand-blue hover:bg-brand-blueLight sm:inline-flex"
          >
            <Sparkles className="h-4 w-4" />
            ExpertzTrip AI
          </Link>
          <Link href="/account" className={buttonVariants({ variant: "outline", size: "sm", className: "hidden sm:inline-flex" })}>
            Sign in
          </Link>
          <Link href="/packages" className={buttonVariants({ variant: "primary", size: "sm", className: "hidden sm:inline-flex" })}>
            Explore
          </Link>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-surface-border bg-white md:hidden">
          <nav className="mx-auto flex max-w-[1200px] flex-col gap-1 px-4 py-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink hover:bg-surface-muted"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/ai" onClick={() => setOpen(false)} className="flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-[15px] font-semibold text-brand-blue hover:bg-brand-blueLight">
              <Sparkles className="h-4 w-4" /> ExpertzTrip AI
            </Link>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link href="/account" onClick={() => setOpen(false)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                Sign in
              </Link>
              <Link href="/packages" onClick={() => setOpen(false)} className={buttonVariants({ variant: "primary", size: "sm" })}>
                Explore
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
