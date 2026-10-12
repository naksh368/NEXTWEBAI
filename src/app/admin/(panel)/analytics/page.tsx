import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, Panel, StatCard } from "@/components/admin/ui";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/booking-states";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

type DailyRow = { day: string; visits: number; visitors: number };

export default async function AdminAnalyticsPage() {
  await requireAdmin("report.view");
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    leads, responded, quotesSent, quotesAccepted, won, lost,
    confirmedBookings, revenueAgg, customers, repeat,
    leads30, bookings30, revenue30Agg, responseRows, viewsAgg,
    siteVisitsTotal, siteVisits30, siteVisitsToday,
    uniqueTotalRows, unique30Rows, topPages, dailyRowsRaw,
  ] = await Promise.all([
    db.enquiry.count(),
    db.enquiry.count({ where: { firstRespondedAt: { not: null } } }),
    db.quote.count({ where: { status: { in: ["SENT", "ACCEPTED", "DECLINED", "EXPIRED"] } } }),
    db.quote.count({ where: { status: "ACCEPTED" } }),
    db.enquiry.count({ where: { status: "WON" } }),
    db.enquiry.count({ where: { status: "LOST" } }),
    db.booking.count({ where: { status: { in: ACTIVE_BOOKING_STATUSES } } }),
    db.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),
    db.customer.count(),
    db.customer.count({ where: { isRepeat: true } }),
    db.enquiry.count({ where: { createdAt: { gte: d30 } } }),
    db.booking.count({ where: { createdAt: { gte: d30 } } }),
    db.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID", createdAt: { gte: d30 } } }),
    db.enquiry.findMany({ where: { firstRespondedAt: { not: null } }, select: { createdAt: true, firstRespondedAt: true }, take: 2000 }),
    db.package.aggregate({ _sum: { views: true } }),
    // Website traffic — total page views, last 30 days and today.
    db.pageView.count(),
    db.pageView.count({ where: { createdAt: { gte: d30 } } }),
    db.pageView.count({ where: { createdAt: { gte: startOfToday } } }),
    // Unique visitors (distinct anonymous ids) — all time and last 30 days.
    db.$queryRaw<{ c: number }[]>`SELECT COUNT(DISTINCT visitor)::int AS c FROM "PageView"`,
    db.$queryRaw<{ c: number }[]>`SELECT COUNT(DISTINCT visitor)::int AS c FROM "PageView" WHERE "createdAt" >= ${d30}`,
    // Most-visited pages.
    db.pageView.groupBy({ by: ["path"], _count: { path: true }, orderBy: { _count: { path: "desc" } }, take: 8 }),
    // Per-day visits & unique visitors for the last 30 days (server time / UTC).
    db.$queryRaw<DailyRow[]>`
      SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
             COUNT(*)::int AS visits,
             COUNT(DISTINCT visitor)::int AS visitors
      FROM "PageView"
      WHERE "createdAt" >= ${d30}
      GROUP BY 1 ORDER BY 1`,
  ]);

  const revenue = revenueAgg._sum.amount ?? 0;
  const revenue30 = revenue30Agg._sum.amount ?? 0;
  const views = viewsAgg._sum.views ?? 0;

  const uniqueTotal = uniqueTotalRows[0]?.c ?? 0;
  const unique30 = unique30Rows[0]?.c ?? 0;

  // Build a continuous 30-day series (zero-filled) from the grouped rows.
  const byDay = new Map(dailyRowsRaw.map((r) => [r.day, r]));
  const series: DailyRow[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    series.push(byDay.get(key) ?? { day: key, visits: 0, visitors: 0 });
  }
  const seriesMax = Math.max(1, ...series.map((s) => s.visits));
  const pagesMax = Math.max(1, ...topPages.map((p) => p._count.path));

  // Average first-response time + share answered within a day.
  let avgHours = 0;
  let within24h = 0;
  if (responseRows.length) {
    const deltas = responseRows.map((r) => (r.firstRespondedAt!.getTime() - r.createdAt.getTime()) / 3_600_000).filter((h) => h >= 0);
    avgHours = deltas.length ? deltas.reduce((s, h) => s + h, 0) / deltas.length : 0;
    within24h = deltas.filter((h) => h <= 24).length;
  }
  const fmtDuration = (h: number) => (h < 1 ? `${Math.round(h * 60)} min` : h < 48 ? `${h.toFixed(1)} hrs` : `${(h / 24).toFixed(1)} days`);

  // Funnel stages (all-time), each measured against the top of the funnel.
  const funnel = [
    { label: "Package views", n: views, tone: "bg-brand-navy" },
    { label: "Enquiries (leads)", n: leads, tone: "bg-brand-blue" },
    { label: "Responded to", n: responded, tone: "bg-brand-blue/80" },
    { label: "Quotes sent", n: quotesSent, tone: "bg-brand-orange/80" },
    { label: "Won / converted", n: won, tone: "bg-success" },
  ];
  const funnelMax = Math.max(1, views, leads);
  const enquiryRate = pct(leads, views);
  const winRate = pct(won, leads);
  const quoteAcceptRate = pct(quotesAccepted, quotesSent);
  const responseRate = pct(within24h, responseRows.length || 1);

  return (
    <>
      <PageHeader title="Analytics" subtitle="Website traffic, the lead-to-booking funnel, conversion and response times — all from live data." />

      {/* WEBSITE TRAFFIC — how many people came to the website */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total visits" value={siteVisitsTotal.toLocaleString("en-IN")} tone="navy" hint="Page views, all time" />
        <StatCard label="Unique visitors" value={uniqueTotal.toLocaleString("en-IN")} tone="blue" hint="Distinct people, all time" />
        <StatCard label="Visitors (30 days)" value={unique30.toLocaleString("en-IN")} tone="green" hint={`${siteVisits30.toLocaleString("en-IN")} visits`} />
        <StatCard label="Today" value={siteVisitsToday.toLocaleString("en-IN")} tone="orange" hint="Visits so far today" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Visitors — last 30 days" className="lg:col-span-2">
          <div className="p-4">
            {siteVisitsTotal === 0 ? (
              <p className="py-8 text-center text-sm text-ink-muted">
                No website visits recorded yet. Traffic appears here as soon as people start visiting the live site.
              </p>
            ) : (
              <>
                <div className="flex h-40 items-end gap-[3px]">
                  {series.map((s) => (
                    <div key={s.day} className="group relative flex flex-1 flex-col justify-end" title={`${s.day}: ${s.visits} visits, ${s.visitors} visitors`}>
                      <div className="w-full rounded-t bg-brand-blue/80 transition-colors group-hover:bg-brand-blue" style={{ height: `${Math.max(2, Math.round((s.visits / seriesMax) * 100))}%` }} />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-ink-faint">
                  <span>{series[0]?.day.slice(5)}</span>
                  <span>{series[Math.floor(series.length / 2)]?.day.slice(5)}</span>
                  <span>Today</span>
                </div>
                <p className="mt-2 text-xs text-ink-muted">Bars show total daily visits over the last 30 days. Hover a bar for that day&apos;s numbers.</p>
              </>
            )}
          </div>
        </Panel>

        <Panel title="Most-visited pages">
          <div className="space-y-2.5 p-4">
            {topPages.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-muted">No pages visited yet.</p>
            ) : (
              topPages.map((p) => (
                <div key={p.path}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium text-brand-navy" title={p.path}>{p.path === "/" ? "/ (home)" : p.path}</span>
                    <span className="tabular-nums text-ink-muted">{p._count.path.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                    <div className="h-full rounded-full bg-brand-turquoiseDark" style={{ width: `${Math.max(3, pct(p._count.path, pagesMax))}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-ink-faint">Leads &amp; bookings</h2>
      <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenue (paid)" value={formatINR(revenue, { compact: true })} tone="green" hint="All time, verified payments" />
        <StatCard label="Win rate" value={`${winRate}%`} tone="orange" hint={`${won} won of ${leads} leads`} />
        <StatCard label="Confirmed bookings" value={confirmedBookings} tone="navy" />
        <StatCard label="Repeat customers" value={`${repeat}/${customers}`} tone="blue" hint={`${pct(repeat, customers)}% booked again`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* FUNNEL */}
        <Panel title="Conversion funnel">
          <div className="space-y-3 p-4">
            {funnel.map((s, i) => (
              <div key={s.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-brand-navy">{s.label}</span>
                  <span className="tabular-nums text-ink-muted">
                    {s.n}
                    {i > 0 && <span className="ml-2 text-xs text-ink-faint">{pct(s.n, funnelMax)}% of top</span>}
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-surface-muted">
                  <div className={`h-full rounded-full ${s.tone}`} style={{ width: `${Math.max(2, pct(s.n, funnelMax))}%` }} />
                </div>
              </div>
            ))}
            {leads === 0 && <p className="pt-2 text-sm text-ink-muted">No enquiries yet — the funnel fills in as leads arrive.</p>}
            <div className="grid grid-cols-2 gap-3 pt-2 text-sm sm:grid-cols-4">
              <MiniStat label="View → enquiry" value={`${enquiryRate}%`} />
              <MiniStat label="Quote accept rate" value={`${quoteAcceptRate}%`} />
              <MiniStat label="Lost leads" value={String(lost)} />
              <MiniStat label="Answered < 24h" value={`${responseRate}%`} />
            </div>
          </div>
        </Panel>

        {/* RESPONSE + RECENT */}
        <div className="space-y-6">
          <Panel title="Response time">
            <div className="grid grid-cols-2 gap-4 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Avg. first response</p>
                <p className="mt-1 text-2xl font-extrabold text-brand-navy">{responseRows.length ? fmtDuration(avgHours) : "—"}</p>
                <p className="mt-0.5 text-xs text-ink-muted">Across {responseRows.length} answered lead{responseRows.length === 1 ? "" : "s"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Answered within a day</p>
                <p className="mt-1 text-2xl font-extrabold text-success">{responseRate}%</p>
                <p className="mt-0.5 text-xs text-ink-muted">{within24h} of {responseRows.length || 0}</p>
              </div>
            </div>
          </Panel>

          <Panel title="Last 30 days">
            <div className="grid grid-cols-3 gap-4 p-4 text-center">
              <div><p className="text-2xl font-extrabold text-brand-blue">{leads30}</p><p className="text-xs text-ink-muted">New leads</p></div>
              <div><p className="text-2xl font-extrabold text-brand-navy">{bookings30}</p><p className="text-xs text-ink-muted">Bookings</p></div>
              <div><p className="text-2xl font-extrabold text-success">{formatINR(revenue30, { compact: true })}</p><p className="text-xs text-ink-muted">Revenue</p></div>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-surface-border bg-white p-3">
      <p className="text-lg font-bold text-brand-navy">{value}</p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  );
}
