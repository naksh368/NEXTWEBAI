"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { buttonVariants } from "@/components/ui/button";

const NAV = [
  { label: "Flights", href: "/#flights" },
  { label: "Why ExpertzTrip", href: "/#why" },
  { label: "For Agents", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Wallet", href: "/#wallet" },
  { label: "Support", href: "/support" },
];

interface HeaderProps {
  isSignedIn: boolean;
  unreadCount?: number;
}

export function Header({ isSignedIn }: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 print:hidden">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo size="md" />

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-muted transition-colors hover:bg-surface-muted hover:text-brand-navy"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isSignedIn && (
            <Link
              href="/dashboard"
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-brand-blue hover:bg-surface-muted sm:inline-flex"
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
          )}
          <Link href="/login" className={buttonVariants({ variant: "primary", size: "sm", className: "hidden sm:inline-flex" })}>
            Login
          </Link>
          <Link href="/register" className={buttonVariants({ variant: "orange", size: "sm", className: "hidden sm:inline-flex" })}>
            Register Your Agency
          </Link>

          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-surface-border bg-white lg:hidden">
          <nav className="mx-auto flex max-w-[1200px] flex-col gap-1 px-4 py-3">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-[15px] font-semibold text-ink hover:bg-surface-muted">
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Link href="/login" onClick={() => setOpen(false)} className={buttonVariants({ variant: "primary", size: "md", className: "w-full" })}>
                Login
              </Link>
              <Link href="/register" onClick={() => setOpen(false)} className={buttonVariants({ variant: "orange", size: "md", className: "w-full" })}>
                Register Your Agency <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
