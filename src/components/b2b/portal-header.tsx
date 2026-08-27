"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Menu, X, UserCircle } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { AgencyLogo } from "@/components/b2b/agency-logo";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", href: "/agent" },
  { label: "Flights", href: "/agent/flights" },
  { label: "Bookings", href: "/agent/bookings" },
  { label: "Wallet", href: "/agent/wallet" },
  { label: "Credit", href: "/agent/credit" },
  { label: "Reports", href: "/agent/reports" },
  { label: "Support", href: "/agent/support" },
];

export function PortalHeader({
  agentName,
  agencyName,
  logoDocumentId,
  unread,
}: {
  agentName: string;
  agencyName: string | null;
  logoDocumentId: string | null;
  unread: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/agent" ? pathname === "/agent" : pathname.startsWith(href));

  async function logout() {
    await fetch("/api/agent/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-white">
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* LEFT — ExpertzTrip brand + agency logo + name */}
        <div className="flex min-w-0 items-center gap-3">
          <Logo size="sm" href="/agent" />
          <span className="hidden h-6 w-px bg-surface-border sm:block" />
          <div className="flex min-w-0 items-center gap-2">
            <AgencyLogo logoDocumentId={logoDocumentId} agencyName={agencyName} size={32} />
            <span className="hidden truncate text-sm font-bold text-ink sm:block">{agencyName ?? "Your Agency"}</span>
          </div>
        </div>

        {/* CENTER nav */}
        <nav className="hidden items-center gap-1 xl:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={cn("rounded-lg px-3 py-2 text-sm font-semibold transition-colors", isActive(n.href) ? "bg-brand-blueLight text-brand-blue" : "text-ink-muted hover:text-brand-blue")}>
              {n.label}
            </Link>
          ))}
        </nav>

        {/* RIGHT */}
        <div className="flex items-center gap-1.5">
          <Link href="/agent/notifications" className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted" aria-label="Notifications">
            <Bell size={19} />
            {unread > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
          </Link>
          <Link href="/agent/profile" className="hidden items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-ink hover:bg-surface-muted sm:inline-flex" aria-label="Profile">
            <UserCircle size={20} className="text-ink-muted" /> <span className="hidden max-w-[120px] truncate lg:inline">{agentName}</span>
          </Link>
          <button onClick={logout} className="hidden h-10 w-10 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted sm:inline-flex" aria-label="Logout"><LogOut size={18} /></button>
          <button onClick={() => setOpen((v) => !v)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink xl:hidden" aria-label="Menu">{open ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className={cn("xl:hidden", open ? "block" : "hidden")}>
        <nav className="space-y-1 border-t border-surface-border bg-white px-4 py-3">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={cn("block rounded-lg px-3 py-2.5 text-sm font-semibold", isActive(n.href) ? "bg-brand-blueLight text-brand-blue" : "text-ink hover:bg-surface-muted")}>
              {n.label}
            </Link>
          ))}
          <div className="flex gap-2 border-t border-surface-border pt-2">
            <Link href="/agent/profile" onClick={() => setOpen(false)} className="flex-1 rounded-lg bg-surface-muted px-3 py-2.5 text-center text-sm font-semibold text-ink">Profile</Link>
            <button onClick={logout} className="flex-1 rounded-lg bg-surface-muted px-3 py-2.5 text-sm font-semibold text-ink">Logout</button>
          </div>
        </nav>
      </div>
    </header>
  );
}
