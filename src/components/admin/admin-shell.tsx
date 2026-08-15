"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, CalendarCheck, Users, LifeBuoy, Package, MapPin, Truck,
  Tag, Ticket, Star, BookOpen, CreditCard, RotateCcw, Shield, KeyRound,
  ScrollText, Settings, Menu, X, LogOut,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

const NAV: { section: string; items: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[] }[] = [
  { section: "Overview", items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }] },
  { section: "Operations", items: [
    { label: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
    { label: "Customers", href: "/admin/customers", icon: Users },
    { label: "Support", href: "/admin/support", icon: LifeBuoy },
  ] },
  { section: "Catalogue", items: [
    { label: "Packages", href: "/admin/packages", icon: Package },
    { label: "Destinations", href: "/admin/destinations", icon: MapPin },
    { label: "Suppliers", href: "/admin/suppliers", icon: Truck },
    { label: "Offers", href: "/admin/offers", icon: Tag },
    { label: "Coupons", href: "/admin/coupons", icon: Ticket },
    { label: "Reviews", href: "/admin/reviews", icon: Star },
    { label: "Travel Guides", href: "/admin/guides", icon: BookOpen },
  ] },
  { section: "Finance", items: [
    { label: "Payments", href: "/admin/payments", icon: CreditCard },
    { label: "Refunds", href: "/admin/refunds", icon: RotateCcw },
  ] },
  { section: "System", items: [
    { label: "Users", href: "/admin/users", icon: Shield },
    { label: "Roles", href: "/admin/roles", icon: KeyRound },
    { label: "Audit Logs", href: "/admin/audit", icon: ScrollText },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ] },
];

export function AdminShell({ admin, children }: { admin: { name: string; role: string }; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const nav = (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {NAV.map((group) => (
        <div key={group.section}>
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{group.section}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link href={item.href} onClick={() => setOpen(false)}
                    className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-brand-blue text-white" : "text-ink-muted hover:bg-surface-muted hover:text-brand-navy")}>
                    <item.icon className="h-4 w-4 shrink-0" /> {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-surface-muted/50">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-surface-border bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-surface-border px-5"><Logo size="sm" href="/admin" /></div>
        {nav}
        <div className="border-t border-surface-border p-3">
          <div className="mb-2 px-2">
            <p className="truncate text-sm font-semibold text-brand-navy">{admin.name}</p>
            <p className="text-xs text-ink-muted">{admin.role}</p>
          </div>
          <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-muted hover:text-danger">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white">
            <div className="flex h-16 items-center justify-between border-b border-surface-border px-5">
              <Logo size="sm" href="/admin" />
              <button onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
            </div>
            {nav}
            <div className="border-t border-surface-border p-3">
              <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-muted hover:text-danger">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-surface-border bg-white px-4 lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-medium text-ink-muted hover:text-brand-blue">View site ↗</Link>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-navy text-xs font-bold text-white">
              {admin.name.slice(0, 1).toUpperCase()}
            </span>
          </div>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
