"use client";

import { useState } from "react";
import Link from "next/link";
import { Plane, Search, ChevronRight } from "lucide-react";
import type { Booking } from "@/lib/types";
import { StatusBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { inr, formatDate, cn } from "@/lib/utils";

const TABS = ["All", "Confirmed", "Pending", "Cancelled", "Refund"] as const;
type Tab = (typeof TABS)[number];

function matchesTab(b: Booking, tab: Tab) {
  if (tab === "All") return true;
  if (tab === "Confirmed") return b.status === "TICKET ISSUED";
  if (tab === "Pending") return b.status === "ON HOLD" || b.status === "PENDING";
  if (tab === "Cancelled") return b.status === "CANCELLED" || b.status === "FAILED";
  if (tab === "Refund")
    return b.status === "REFUND INITIATED" || b.status === "REFUNDED";
  return true;
}

export function BookingsList({ bookings }: { bookings: Booking[] }) {
  const [tab, setTab] = useState<Tab>("All");
  const [q, setQ] = useState("");

  const filtered = bookings
    .filter((b) => matchesTab(b, tab))
    .filter((b) =>
      q
        ? [b.id, b.pnr, b.leadPassenger, b.route]
            .join(" ")
            .toLowerCase()
            .includes(q.toLowerCase())
        : true,
    );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-bold transition-colors",
                tab === t
                  ? "bg-blue text-white"
                  : "border border-surface-border bg-white text-ink-muted hover:bg-surface-muted",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search PNR, name, route…"
            className="pl-10"
          />
        </div>
      </div>

      {/* Table (desktop) */}
      <div className="hidden overflow-hidden rounded-xl border border-surface-border bg-white shadow-card lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-surface-muted text-left text-xs font-extrabold uppercase tracking-wide text-ink-muted">
              <th className="px-5 py-3">Booking</th>
              <th className="px-5 py-3">PNR</th>
              <th className="px-5 py-3">Passenger</th>
              <th className="px-5 py-3">Route</th>
              <th className="px-5 py-3">Travel Date</th>
              <th className="px-5 py-3 text-right">Amount</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {filtered.map((b) => (
              <tr key={b.id} className="transition-colors hover:bg-surface-muted">
                <td className="px-5 py-3.5 font-bold text-navy">{b.id}</td>
                <td className="px-5 py-3.5 font-semibold text-ink-muted">
                  {b.pnr || "—"}
                </td>
                <td className="px-5 py-3.5 font-semibold text-navy">{b.leadPassenger}</td>
                <td className="px-5 py-3.5 font-semibold text-ink-muted">{b.route}</td>
                <td className="px-5 py-3.5 text-ink-muted">{formatDate(b.travelDate)}</td>
                <td className="px-5 py-3.5 text-right font-extrabold text-navy">
                  {inr(b.total)}
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={b.status} />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link
                    href={`/bookings/${b.id}`}
                    className="inline-flex items-center gap-1 text-sm font-bold text-blue hover:underline"
                  >
                    View <ChevronRight size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyRow />}
      </div>

      {/* Cards (mobile) */}
      <div className="space-y-3 lg:hidden">
        {filtered.map((b) => (
          <Link
            key={b.id}
            href={`/bookings/${b.id}`}
            className="block rounded-xl border border-surface-border bg-white p-4 shadow-card"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue">
                  <Plane size={16} />
                </span>
                <div>
                  <p className="text-sm font-bold text-navy">{b.route}</p>
                  <p className="text-xs text-ink-faint">
                    {b.id} · {b.pnr || "No PNR"}
                  </p>
                </div>
              </div>
              <StatusBadge status={b.status} />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-surface-border pt-3 text-xs">
              <span className="font-semibold text-ink-muted">
                {b.leadPassenger} · {formatDate(b.travelDate)}
              </span>
              <span className="font-extrabold text-navy">{inr(b.total)}</span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-surface-border bg-white p-8 text-center text-sm text-ink-muted">
            No bookings found.
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyRow() {
  return (
    <div className="p-10 text-center">
      <p className="font-bold text-navy">No bookings found</p>
      <p className="mt-1 text-sm text-ink-muted">Try a different filter or search term.</p>
    </div>
  );
}
