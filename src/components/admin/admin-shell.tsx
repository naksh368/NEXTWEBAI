"use client";

import { useState } from "react";
import { Menu, Bell, Search } from "lucide-react";
import { AdminSidebar } from "./admin-sidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-surface-muted">
      <AdminSidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-surface-border bg-white/90 px-4 backdrop-blur-md lg:px-6">
          <div className="flex items-center gap-3">
            <button
              className="grid h-10 w-10 place-items-center rounded-lg border border-surface-border text-navy lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div className="relative hidden sm:block">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <input
                placeholder="Search agents, bookings, PNR…"
                className="h-10 w-72 rounded-lg border border-surface-border bg-surface-muted pl-9 pr-3 text-sm font-semibold text-ink outline-none focus:border-blue focus:bg-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative grid h-10 w-10 place-items-center rounded-lg border border-surface-border text-navy hover:bg-surface-muted">
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange ring-2 ring-white" />
            </button>
            <div className="flex items-center gap-2 rounded-lg border border-surface-border py-1.5 pl-1.5 pr-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-navy text-xs font-extrabold text-white">
                AD
              </span>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-navy">Admin</p>
                <p className="text-[0.65rem] text-ink-faint">Operations</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
