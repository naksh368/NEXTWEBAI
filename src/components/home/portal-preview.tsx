import {
  Wallet, CalendarCheck, IndianRupee, TrendingUp, Plane, Receipt,
  BarChart3, ArrowUpRight, ArrowDownLeft, RotateCcw,
} from "lucide-react";

/**
 * Illustrative Partner-Portal preview shown in the hero — a floating premium
 * panel (NOT a laptop/screenshot mockup). All figures are clearly labelled as
 * sample data; the live portal renders authenticated real values.
 */
export function PortalPreview() {
  const stats = [
    { label: "Wallet Balance", value: "₹25,450", icon: Wallet, tone: "blue" as const, delta: "+12%" },
    { label: "Bookings", value: "128", icon: CalendarCheck, tone: "orange" as const, delta: "+24%" },
    { label: "Sales", value: "₹12,45,800", icon: IndianRupee, tone: "green" as const, delta: "+18%" },
    { label: "Earnings", value: "₹38,450", icon: TrendingUp, tone: "violet" as const, delta: "+26%" },
  ];
  const actions = [
    { label: "Flights", icon: Plane },
    { label: "Bookings", icon: Receipt },
    { label: "Wallet", icon: Wallet },
    { label: "Reports", icon: BarChart3 },
  ];
  const activity = [
    { label: "Booking · DEL → BOM", meta: "PNR ZX8K2", amount: "−₹4,299", icon: ArrowDownLeft, tone: "text-ink" },
    { label: "Wallet top-up", meta: "Razorpay · success", amount: "+₹10,000", icon: ArrowUpRight, tone: "text-success" },
    { label: "Refund credited", meta: "BOM → GOA", amount: "+₹1,200", icon: RotateCcw, tone: "text-brand-blue" },
  ];

  const toneMap = {
    blue: "bg-brand-blueLight text-brand-blue",
    orange: "bg-brand-orangeLight text-brand-orange",
    green: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
  };

  return (
    <div className="relative">
      {/* soft accent blobs behind the panel */}
      <div className="pointer-events-none absolute -right-6 -top-8 h-40 w-40 rounded-full bg-brand-orange/10 blur-2xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-10 -left-8 h-44 w-44 rounded-full bg-brand-blue/10 blur-2xl" aria-hidden />

      <div className="portal-shadow relative rounded-3xl border border-surface-border bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-brand-navy sm:text-base">Your Business at a Glance</p>
            <p className="text-xs text-ink-faint">Partner Portal · This month</p>
          </div>
          <span className="rounded-lg border border-surface-border px-2.5 py-1 text-xs font-semibold text-ink-muted">
            This Month
          </span>
        </div>

        {/* stat tiles */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-surface-border bg-surface-muted/50 p-3">
              <div className="flex items-center justify-between">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneMap[s.tone]}`}>
                  <s.icon className="h-4 w-4" />
                </span>
                <span className="text-[11px] font-semibold text-success">{s.delta}</span>
              </div>
              <p className="mt-2 text-lg font-extrabold leading-none text-brand-navy">{s.value}</p>
              <p className="mt-1 text-[11px] font-medium text-ink-muted">{s.label}</p>
            </div>
          ))}
        </div>

        {/* quick actions */}
        <p className="mt-5 text-[11px] font-bold uppercase tracking-wide text-ink-faint">Quick Actions</p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {actions.map((a) => (
            <div key={a.label} className="flex flex-col items-center gap-1.5 rounded-xl border border-surface-border bg-white py-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blueLight text-brand-blue">
                <a.icon className="h-4 w-4" />
              </span>
              <span className="text-[11px] font-semibold text-ink">{a.label}</span>
            </div>
          ))}
        </div>

        {/* recent activity */}
        <p className="mt-5 text-[11px] font-bold uppercase tracking-wide text-ink-faint">Recent Activity</p>
        <div className="mt-2 space-y-1.5">
          {activity.map((r) => (
            <div key={r.label} className="flex items-center gap-3 rounded-xl border border-surface-border bg-white px-3 py-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-muted text-ink-muted">
                <r.icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-brand-navy">{r.label}</p>
                <p className="truncate text-[11px] text-ink-faint">{r.meta}</p>
              </div>
              <span className={`text-xs font-bold ${r.tone}`}>{r.amount}</span>
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-[10px] font-medium uppercase tracking-wide text-ink-faint">
          Illustrative portal preview · sample data
        </p>
      </div>
    </div>
  );
}
