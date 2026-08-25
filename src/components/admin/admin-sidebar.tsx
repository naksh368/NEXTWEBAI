"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Ticket,
  Wallet,
  CreditCard,
  RotateCcw,
  Server,
  Percent,
  LifeBuoy,
  BarChart3,
  Settings,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Agents", href: "/admin/agents", icon: Users },
  { label: "KYC", href: "/admin/kyc", icon: ShieldCheck },
  { label: "Bookings", href: "/admin/bookings", icon: Ticket },
  { label: "Wallet", href: "/admin/wallet", icon: Wallet },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Refunds", href: "/admin/refunds", icon: RotateCcw },
  { label: "Suppliers", href: "/admin/suppliers", icon: Server },
  { label: "Commercials", href: "/admin/commercials", icon: Percent },
  { label: "Support", href: "/admin/support", icon: LifeBuoy },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar({
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
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-navy text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-2">
            <Logo size="sm" href="/admin" onDark />
            <span className="rounded bg-orange px-1.5 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-wide text-white">
              Admin
            </span>
          </div>
          <button
            className="grid h-8 w-8 place-items-center rounded-lg text-blue-100 hover:bg-white/10 lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {NAV.map((n) => {
            const active =
              n.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(n.href);
            return (
              <Link
                key={n.label}
                href={n.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors",
                  active
                    ? "bg-white/12 text-white"
                    : "text-blue-100/80 hover:bg-white/8 hover:text-white",
                )}
              >
                <n.icon
                  size={18}
                  className={active ? "text-orange" : "text-blue-100/70"}
                />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <Link
            href="/"
            className="flex items-center justify-center rounded-lg bg-white/8 px-3 py-2.5 text-xs font-bold text-blue-100 hover:bg-white/12"
          >
            ← Exit to site
          </Link>
        </div>
      </aside>
    </>
  );
}
