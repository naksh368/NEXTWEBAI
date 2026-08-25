import Link from "next/link";
import {
  Users,
  UserCheck,
  ShieldAlert,
  Ticket,
  IndianRupee,
  TrendingUp,
  RotateCcw,
  CircleX,
  Server,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { ADMIN_METRICS, AGENTS } from "@/data/agents";
import { BOOKINGS } from "@/data/bookings";
import { inr, formatDate } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default function AdminDashboard() {
  const m = ADMIN_METRICS;
  const pendingKyc = AGENTS.filter((a) => a.kyc === "KYC PENDING");
  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">Operations Dashboard</h1>
        <p className="mt-1 text-ink-muted">Platform health at a glance · today</p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Total Agents" value={String(m.totalAgents)} accent="blue" icon={<Users size={18} />} />
        <StatCard label="Active Agents" value={String(m.activeAgents)} accent="success" icon={<UserCheck size={18} />} />
        <StatCard label="KYC Pending" value={String(m.kycPending)} accent="orange" icon={<ShieldAlert size={18} />} />
        <StatCard label="Today's Bookings" value={String(m.todaysBookings)} accent="navy" icon={<Ticket size={18} />} />
        <StatCard label="Today's GMV" value={inr(m.todaysGmv)} accent="blue" icon={<IndianRupee size={18} />} />
        <StatCard label="Today's Revenue" value={inr(m.todaysRevenue)} accent="success" icon={<TrendingUp size={18} />} />
        <StatCard label="Pending Refunds" value={inr(m.pendingRefunds)} accent="orange" icon={<RotateCcw size={18} />} />
        <StatCard label="Failed Bookings" value={String(m.failedBookings)} accent="danger" icon={<CircleX size={18} />} />
      </div>

      {/* API status banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-success/30 bg-success/5 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-success/15 text-success">
            <Server size={18} />
          </span>
          <div>
            <p className="text-sm font-extrabold text-navy">Supplier API Status</p>
            <p className="text-xs text-ink-muted">
              ExpertzTrip Supplier Engine · 1 supplier connected
            </p>
          </div>
        </div>
        <Badge tone="success">
          <CheckCircle2 size={13} /> {m.apiStatus}
        </Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* Recent bookings */}
        <div className="rounded-xl border border-surface-border bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
            <h2 className="text-base font-extrabold text-navy">Recent Bookings</h2>
            <Link href="/admin/bookings" className="inline-flex items-center gap-1 text-sm font-bold text-blue hover:underline">
              View all <ArrowRight size={15} />
            </Link>
          </div>
          <div className="divide-y divide-surface-border">
            {BOOKINGS.slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div>
                  <p className="text-sm font-bold text-navy">
                    {b.route} · {b.leadPassenger}
                  </p>
                  <p className="text-xs text-ink-faint">
                    {b.id} · {b.airline} {b.flightNumber} · {formatDate(b.travelDate)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-extrabold text-navy">{inr(b.total)}</span>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* KYC queue */}
        <div className="rounded-xl border border-surface-border bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
            <h2 className="text-base font-extrabold text-navy">KYC Queue</h2>
            <Link href="/admin/kyc" className="inline-flex items-center gap-1 text-sm font-bold text-blue hover:underline">
              Review <ArrowRight size={15} />
            </Link>
          </div>
          <div className="divide-y divide-surface-border">
            {pendingKyc.map((a) => (
              <Link
                key={a.id}
                href={`/admin/agents/${a.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-muted"
              >
                <div>
                  <p className="text-sm font-bold text-navy">{a.companyName}</p>
                  <p className="text-xs text-ink-faint">
                    {a.agentName} · {a.city} · {formatDate(a.joinedOn)}
                  </p>
                </div>
                <StatusBadge status={a.kyc} />
              </Link>
            ))}
            {pendingKyc.length === 0 && (
              <p className="px-5 py-6 text-center text-sm text-ink-muted">
                No pending KYC.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
