"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Wallet, PlaneTakeoff, CreditCard, BarChart3, LifeBuoy, LogOut, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", href: "/partner", icon: LayoutDashboard },
  { label: "Wallet", href: "/partner/wallet", icon: Wallet },
  { label: "Flights", href: "/partner", icon: PlaneTakeoff, soon: true },
  { label: "Bookings", href: "/partner", icon: PlaneTakeoff, soon: true },
  { label: "Credit", href: "/partner", icon: CreditCard, soon: true },
  { label: "Reports", href: "/partner", icon: BarChart3, soon: true },
];

export function PartnerHeader({ agencyName }: { agencyName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/agent/logout", { method: "POST" });
    router.push("/partner-login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Logo size="sm" />
          <nav className="hidden items-center gap-0.5 lg:flex">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.label} href={item.soon ? "#" : item.href}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                    item.soon ? "cursor-default text-ink-faint" : "text-ink-muted hover:bg-surface-muted hover:text-brand-navy",
                    active && !item.soon && "bg-brand-blueLight text-brand-blue"
                  )}
                  aria-disabled={item.soon}
                >
                  <item.icon className="h-4 w-4" /> {item.label}
                  {item.soon && <span className="rounded bg-surface-muted px-1 text-[9px] font-bold uppercase text-ink-faint">soon</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/support" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-muted sm:inline-flex">
            <LifeBuoy className="h-4 w-4" /> Support
          </Link>
          <span className="hidden max-w-[12rem] truncate rounded-lg bg-surface-muted px-3 py-2 text-sm font-semibold text-brand-navy sm:inline">{agencyName}</span>
          <button onClick={logout} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-ink-muted hover:bg-surface-muted hover:text-danger">
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Logout</span>
          </button>
          <button className="inline-flex h-10 w-10 items-center justify-center rounded-lg lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-surface-border bg-white lg:hidden">
          <nav className="mx-auto flex max-w-[1200px] flex-col gap-1 px-4 py-3">
            {NAV.filter((n) => !n.soon).map((item) => (
              <Link key={item.label} href={item.href} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[15px] font-semibold text-ink hover:bg-surface-muted">
                <item.icon className="h-4 w-4" /> {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
