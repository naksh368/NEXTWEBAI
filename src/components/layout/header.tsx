"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LifeBuoy, Luggage, User } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Holidays", href: "/packages" },
  { label: "Destinations", href: "/destinations" },
  { label: "Honeymoon", href: "/packages?theme=HONEYMOON" },
  { label: "Family", href: "/packages?theme=FAMILY" },
  { label: "Offers", href: "/offers" },
];

interface HeaderProps {
  isSignedIn: boolean;
}

export function Header({ isSignedIn }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 print:hidden">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 xl:gap-9">
          <Logo size="md" />
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const active = pathname === item.href.split("?")[0] && !item.href.includes("?");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-semibold text-ink-muted transition-colors hover:bg-surface-muted hover:text-brand-navy",
                    active && "text-brand-navy"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/support" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-muted hover:text-brand-navy sm:inline-flex">
            <LifeBuoy className="h-4 w-4" /> Help
          </Link>
          <Link href="/account/trips" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-muted hover:text-brand-navy sm:inline-flex">
            <Luggage className="h-4 w-4" /> My Trips
          </Link>

          {isSignedIn ? (
            <Link
              href="/account"
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-muted hover:text-brand-navy sm:inline-flex"
            >
              <User className="h-4 w-4" /> Account
            </Link>
          ) : (
            <Link href="/sign-in" className={buttonVariants({ variant: "primary", size: "sm", className: "hidden sm:inline-flex" })}>
              Sign in
            </Link>
          )}

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
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink hover:bg-surface-muted">
                {item.label}
              </Link>
            ))}
            <Link href="/support" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink hover:bg-surface-muted">
              <LifeBuoy className="h-4 w-4" /> Help
            </Link>
            <Link href="/account/trips" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink hover:bg-surface-muted">
              <Luggage className="h-4 w-4" /> My Trips
            </Link>
            {isSignedIn ? (
              <Link href="/account" onClick={() => setOpen(false)} className={buttonVariants({ variant: "primary", size: "sm", className: "mt-2 w-full" })}>
                My Account
              </Link>
            ) : (
              <Link href="/sign-in" onClick={() => setOpen(false)} className={buttonVariants({ variant: "primary", size: "sm", className: "mt-2 w-full" })}>
                Sign in
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
