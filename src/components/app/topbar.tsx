"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Menu, ChevronDown, LogOut, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-surface-border bg-white/90 px-4 backdrop-blur-md lg:px-6">
      <div className="flex items-center gap-3">
        <button
          className="grid h-10 w-10 place-items-center rounded-lg border border-surface-border text-navy lg:hidden"
          onClick={onMenu}
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <div className="hidden sm:block">
          <p className="text-sm font-bold text-navy">Skyline Travels Pvt Ltd</p>
          <p className="text-xs text-ink-faint">Agent ID · AG-1042 · New Delhi</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
            className="relative grid h-10 w-10 place-items-center rounded-lg border border-surface-border text-navy hover:bg-surface-muted"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange ring-2 ring-white" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-surface-border bg-white p-2 shadow-pop">
              <p className="px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-ink-faint">
                Notifications
              </p>
              {[
                { t: "Ticket issued · DEL → DXB", s: "PNR QK4T2P confirmed", tone: "text-success" },
                { t: "Refund initiated · BOM → GOI", s: "₹4,200 processing", tone: "text-blue" },
                { t: "Wallet low balance", s: "Top up to keep booking", tone: "text-orange" },
              ].map((n) => (
                <div key={n.t} className="rounded-lg px-3 py-2.5 hover:bg-surface-muted">
                  <p className={cn("text-sm font-bold", n.tone)}>{n.t}</p>
                  <p className="text-xs text-ink-muted">{n.s}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 rounded-lg border border-surface-border py-1.5 pl-1.5 pr-2.5 hover:bg-surface-muted"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-blue text-xs font-extrabold text-white">
              RS
            </span>
            <span className="hidden text-sm font-bold text-navy sm:block">Rahul</span>
            <ChevronDown size={15} className="text-ink-muted" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-surface-border bg-white p-2 shadow-pop">
              <div className="border-b border-surface-border px-3 py-2">
                <p className="text-sm font-bold text-navy">Rahul Sharma</p>
                <p className="text-xs text-ink-faint">rahul@skylinetravels.in</p>
              </div>
              <div className="py-1">
                {[
                  { label: "Profile", icon: User, href: "/dashboard" },
                  { label: "Settings", icon: Settings, href: "/dashboard" },
                ].map((i) => (
                  <Link
                    key={i.label}
                    href={i.href}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-ink-muted hover:bg-surface-muted hover:text-navy"
                  >
                    <i.icon size={16} /> {i.label}
                  </Link>
                ))}
                <Link
                  href="/"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-danger hover:bg-[#FDECEA]"
                >
                  <LogOut size={16} /> Log out
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
