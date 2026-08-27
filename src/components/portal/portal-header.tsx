"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, LayoutDashboard, Plane, Receipt, Wallet, FileCheck2, LifeBuoy } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Flights", href: "/dashboard/flights", icon: Plane },
  { label: "Bookings", href: "/dashboard/bookings", icon: Receipt },
  { label: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { label: "KYC", href: "/dashboard/kyc", icon: FileCheck2 },
  { label: "Support", href: "/support", icon: LifeBuoy },
];

export function PortalHeader({ agentName, agencyName, logoUrl }: { agentName: string; agencyName: string | null; logoUrl: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const active = (href: string) => (href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href));

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: ExpertzTrip + agency logo + name (spec §19) */}
        <div className="flex min-w-0 items-center gap-3">
          <Logo size="sm" href="/dashboard" />
          {(logoUrl || agencyName) && (
            <>
              <span className="hidden h-6 w-px bg-surface-border sm:block" />
              {logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={agencyName ?? "Agency logo"} className="hidden h-8 w-8 shrink-0 rounded-md border border-surface-border object-contain sm:block" />
              )}
              {agencyName && <span className="hidden max-w-[180px] truncate text-sm font-bold text-brand-navy md:block">{agencyName}</span>}
            </>
          )}
        </div>

        {/* Center nav */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}
              className={cn("rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                active(item.href) ? "bg-brand-blueLight text-brand-blue" : "text-ink-muted hover:bg-surface-muted hover:text-brand-navy")}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right: account */}
        <div className="flex items-center gap-2">
          <span className="hidden text-right sm:block">
            <span className="block text-xs text-ink-faint">Signed in</span>
            <span className="block max-w-[140px] truncate text-sm font-semibold text-brand-navy">{agentName}</span>
          </span>
          <button onClick={logout} aria-label="Sign out" className="hidden h-9 items-center gap-1.5 rounded-lg border border-surface-border px-3 text-sm font-semibold text-ink-muted hover:border-danger hover:text-danger sm:inline-flex">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
          <button className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink lg:hidden" onClick={() => setOpen((v) => !v)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-surface-border bg-white lg:hidden">
          <nav className="mx-auto flex max-w-[1280px] flex-col gap-1 px-4 py-3">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[15px] font-semibold",
                  active(item.href) ? "bg-brand-blueLight text-brand-blue" : "text-ink hover:bg-surface-muted")}>
                <item.icon className="h-4 w-4" /> {item.label}
              </Link>
            ))}
            <button onClick={logout} className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[15px] font-semibold text-danger hover:bg-surface-muted">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
