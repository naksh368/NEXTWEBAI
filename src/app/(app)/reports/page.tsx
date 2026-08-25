import { TrendingUp, Ticket, RotateCcw, Wallet, Download } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { inr } from "@/lib/utils";

export const metadata = { title: "Reports" };

const MONTHLY = [
  { m: "Mar", sales: 640000 },
  { m: "Apr", sales: 910000 },
  { m: "May", sales: 1120000 },
  { m: "Jun", sales: 980000 },
  { m: "Jul", sales: 1340000 },
  { m: "Aug", sales: 1580000 },
];

const ROUTES = [
  { r: "DEL → DXB", bookings: 42, sales: 786000 },
  { r: "BOM → GOI", bookings: 38, sales: 182400 },
  { r: "BLR → SIN", bookings: 21, sales: 655200 },
  { r: "DEL → BOM", bookings: 56, sales: 291200 },
  { r: "HYD → BKK", bookings: 17, sales: 380800 },
];

export default function ReportsPage() {
  const max = Math.max(...MONTHLY.map((x) => x.sales));
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Reports</h1>
          <p className="mt-1 text-ink-muted">Your booking and sales performance.</p>
        </div>
        <Button variant="outline">
          <Download size={16} /> Export CSV
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Sales (6 mo)" value={inr(6570000)} accent="success" icon={<TrendingUp size={18} />} />
        <StatCard label="Total Bookings" value="184" accent="blue" icon={<Ticket size={18} />} />
        <StatCard label="Total Earnings" value={inr(268400)} accent="orange" icon={<Wallet size={18} />} />
        <StatCard label="Refunds Processed" value={inr(94200)} accent="navy" icon={<RotateCcw size={18} />} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Monthly sales bar chart */}
        <div className="rounded-xl border border-surface-border bg-white p-5 shadow-card">
          <h2 className="text-base font-extrabold text-navy">Monthly Sales</h2>
          <div className="mt-6 flex items-end justify-between gap-3" style={{ height: 200 }}>
            {MONTHLY.map((x) => (
              <div key={x.m} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-lg bg-blue transition-all hover:bg-blue-600"
                    style={{ height: `${(x.sales / max) * 100}%` }}
                    title={inr(x.sales)}
                  />
                </div>
                <span className="text-xs font-bold text-ink-muted">{x.m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top routes */}
        <div className="rounded-xl border border-surface-border bg-white p-5 shadow-card">
          <h2 className="text-base font-extrabold text-navy">Top Routes</h2>
          <div className="mt-4 space-y-3">
            {ROUTES.map((r) => (
              <div key={r.r}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-navy">{r.r}</span>
                  <span className="font-extrabold text-navy">{inr(r.sales)}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-orange"
                      style={{ width: `${(r.bookings / 56) * 100}%` }}
                    />
                  </div>
                  <span className="w-14 text-right text-xs font-bold text-ink-faint">
                    {r.bookings} bkgs
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
