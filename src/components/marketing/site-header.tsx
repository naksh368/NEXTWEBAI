"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Home", href: "/#top" },
  { label: "Why ExpertzTrip", href: "/#why" },
  { label: "For Travel Agents", href: "/#agents" },
  { label: "How It Works", href: "/#how" },
  { label: "About", href: "/#about" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b transition-colors",
        scrolled
          ? "border-surface-border bg-white/90 backdrop-blur-md"
          : "border-transparent bg-white",
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Logo size="md" />
        </div>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className="text-sm font-bold text-ink-muted transition-colors hover:text-blue"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ButtonLink href="/login" variant="outline" size="sm">
            Login
          </ButtonLink>
          <ButtonLink href="/register" variant="accent" size="sm">
            Become an Agent
          </ButtonLink>
        </div>

        <button
          className="grid h-10 w-10 place-items-center rounded-lg border border-surface-border text-navy lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-surface-border bg-white lg:hidden">
          <div className="container flex flex-col gap-1 py-3">
            {NAV.map((n) => (
              <Link
                key={n.label}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-bold text-ink-muted hover:bg-surface-muted hover:text-blue"
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-3">
              <ButtonLink href="/login" variant="outline" size="sm" className="flex-1">
                Login
              </ButtonLink>
              <ButtonLink href="/register" variant="accent" size="sm" className="flex-1">
                Become an Agent
              </ButtonLink>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
