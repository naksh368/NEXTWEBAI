"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Plane,
  LayoutDashboard,
  Ticket,
  Wallet,
  BarChart3,
  LifeBuoy,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Flights", href: "/flights", icon: Plane },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Bookings", href: "/bookings", icon: Ticket },
  { label: "Wallet", href: "/wallet", icon: Wallet },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Support", href: "/support", icon: LifeBuoy },
];

export function Sidebar({
  open,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-navy/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-surface-border bg-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-surface-border px-5">
          <Logo size="md" />
          <button
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-muted hover:bg-surface-muted lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="px-3 pb-1 pt-2 text-[0.68rem] font-extrabold uppercase tracking-wider text-ink-faint">
            Menu
          </p>
          {NAV.map((n) => {
            const active =
              pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link
                key={n.label}
                href={n.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors",
                  active
                    ? "bg-blue text-white shadow-sm"
                    : "text-ink-muted hover:bg-surface-muted hover:text-navy",
                )}
              >
                <n.icon size={18} className={active ? "text-white" : "text-blue"} />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-surface-border p-3">
          <div className="rounded-xl bg-navy p-4 text-white">
            <p className="text-xs font-bold text-blue-100">ExpertzWallet</p>
            <p className="mt-1 text-xl font-extrabold">₹52,450</p>
            <Link
              href="/wallet"
              className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-orange px-3 py-2 text-xs font-extrabold text-white transition-colors hover:bg-orange-600"
            >
              Add Money
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
