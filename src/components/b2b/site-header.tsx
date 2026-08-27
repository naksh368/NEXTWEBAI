"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Flights", href: "/#flights" },
  { label: "Why ExpertzTrip", href: "/#why" },
  { label: "For Agents", href: "/#for-agents" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Support", href: "/support-center" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo size="md" />

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-[15px] font-semibold text-ink-muted transition-colors hover:text-brand-blue">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm", className: "!text-brand-blue !border-brand-blue/30" })}>
            Login
          </Link>
          <Link href="/register" className={buttonVariants({ variant: "orange", size: "sm" })}>
            Register Your Agency
          </Link>
        </div>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div className={cn("lg:hidden", open ? "block" : "hidden")}>
        <div className="space-y-1 border-t border-surface-border bg-white px-4 py-3">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-[15px] font-semibold text-ink hover:bg-surface-muted">
              {n.label}
            </Link>
          ))}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Link href="/login" onClick={() => setOpen(false)} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Login
            </Link>
            <Link href="/register" onClick={() => setOpen(false)} className={buttonVariants({ variant: "orange", size: "sm" })}>
              Register
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
