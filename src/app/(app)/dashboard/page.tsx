import Link from "next/link";
import {
  Wallet,
  Ticket,
  TrendingUp,
  RotateCcw,
  ArrowRight,
  Plane,
} from "lucide-react";
import { FlightSearchCard } from "@/components/app/flight-search-card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { BOOKINGS } from "@/data/bookings";
import { inr, formatDate } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  const recent = BOOKINGS.slice(0, 4);
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-extrabold text-navy sm:text-[1.7rem]">
          Good morning, Agent 👋
        </h1>
        <p className="mt-1 text-ink-muted">Ready to book your next flight?</p>
      </div>

      {/* Flight search */}
      <FlightSearchCard />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Wallet Balance"
          value={inr(52450)}
          icon={<Wallet size={18} />}
          accent="blue"
          delta={{ value: "Prepaid · updated just now" }}
        />
        <StatCard
          label="Today's Bookings"
          value="12"
          icon={<Ticket size={18} />}
          accent="navy"
          delta={{ value: "+3 vs yesterday", positive: true }}
        />
        <StatCard
          label="Today's Sales"
          value={inr(124500)}
          icon={<TrendingUp size={18} />}
          accent="success"
          delta={{ value: "+18% vs yesterday", positive: true }}
        />
        <StatCard
          label="Pending Refunds"
          value={inr(8200)}
          icon={<RotateCcw size={18} />}
          accent="orange"
          delta={{ value: "2 in progress" }}
        />
      </div>

      {/* Recent bookings + quick links */}
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-xl border border-surface-border bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
            <h2 className="text-base font-extrabold text-navy">Recent Bookings</h2>
            <Link
              href="/bookings"
              className="inline-flex items-center gap-1 text-sm font-bold text-blue hover:underline"
            >
              View all <ArrowRight size={15} />
            </Link>
          </div>
          <div className="divide-y divide-surface-border">
            {recent.map((b) => (
              <Link
                key={b.id}
                href={`/bookings/${b.id}`}
                className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-surface-muted"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue">
                    <Plane size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-navy">
                      {b.route} · {b.leadPassenger}
                    </p>
                    <p className="text-xs text-ink-faint">
                      {b.id} · {b.airline} {b.flightNumber} · {formatDate(b.travelDate)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-extrabold text-navy">{inr(b.total)}</span>
                  <StatusBadge status={b.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          {/* Wallet snapshot */}
          <div className="rounded-xl border border-surface-border navy-wash p-5 text-white shadow-card">
            <p className="text-xs font-bold text-blue-100">ExpertzWallet · Available</p>
            <p className="mt-1 text-3xl font-extrabold">{inr(52450)}</p>
            <div className="mt-4 flex gap-2">
              <Link
                href="/wallet"
                className="flex-1 rounded-lg bg-orange px-3 py-2.5 text-center text-sm font-extrabold text-white transition-colors hover:bg-orange-600"
              >
                Add Money
              </Link>
              <Link
                href="/wallet"
                className="flex-1 rounded-lg bg-white/10 px-3 py-2.5 text-center text-sm font-bold text-white transition-colors hover:bg-white/20"
              >
                History
              </Link>
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-xl border border-surface-border bg-white p-5 shadow-card">
            <h3 className="text-sm font-extrabold text-navy">Quick Actions</h3>
            <div className="mt-3 space-y-2">
              {[
                { label: "Search Flights", href: "/flights", icon: Plane },
                { label: "My Bookings", href: "/bookings", icon: Ticket },
                { label: "View Reports", href: "/reports", icon: TrendingUp },
              ].map((q) => (
                <Link
                  key={q.label}
                  href={q.href}
                  className="flex items-center justify-between rounded-lg border border-surface-border px-3.5 py-3 text-sm font-bold text-navy transition-colors hover:border-blue hover:bg-blue-50"
                >
                  <span className="flex items-center gap-2.5">
                    <q.icon size={16} className="text-blue" /> {q.label}
                  </span>
                  <ArrowRight size={15} className="text-ink-faint" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
