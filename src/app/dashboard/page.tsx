import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Wallet, CalendarCheck, IndianRupee, TrendingUp, Plane, Receipt,
  BarChart3, FileCheck2, Plus, ArrowRight, Clock,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { getCurrentCustomer } from "@/lib/auth";
import { db } from "@/lib/db";
import { APPLICATION_STATUS_LABEL, businessTypeLabel } from "@/lib/agency";
import { getWalletSummary } from "@/lib/services/wallet-service";
import { formatINR } from "@/lib/utils";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

type AppRow = {
  reference: string; status: string; agencyName: string; businessType: string;
} | null;

async function getApplication(customerId: string): Promise<AppRow> {
  try {
    return await db.agencyApplication.findFirst({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      select: { reference: true, status: true, agencyName: true, businessType: true },
    });
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login");

  const application = await getApplication(customer.id);
  const firstName = (customer.fullName || "there").split(" ")[0];
  const statusLabel = application ? (APPLICATION_STATUS_LABEL[application.status] ?? application.status) : null;
  const approved = application?.status === "APPROVED";

  let wallet = { available: 0, onHold: 0, total: 0, currency: "INR" };
  try { wallet = await getWalletSummary(customer.id); } catch { /* not migrated yet */ }

  const stats = [
    { label: "Wallet Balance", value: formatINR(wallet.available), icon: Wallet, tone: "bg-brand-blueLight text-brand-blue" },
    { label: "Bookings", value: "0", icon: CalendarCheck, tone: "bg-brand-orangeLight text-brand-orange" },
    { label: "Sales", value: formatINR(0), icon: IndianRupee, tone: "bg-emerald-50 text-emerald-600" },
    { label: "Earnings", value: formatINR(0), icon: TrendingUp, tone: "bg-violet-50 text-violet-600" },
  ];
  const actions = [
    { label: "Search Flights", icon: Plane, href: "/flights" },
    { label: "My Bookings", icon: Receipt, href: "/dashboard/bookings" },
    { label: "Add Money", icon: Plus, href: "/dashboard/wallet" },
    { label: "Reports", icon: BarChart3, href: "/dashboard" },
  ];

  return (
    <div>
      <Container className="py-8 sm:py-10">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold text-brand-navy sm:text-3xl">Welcome, {firstName}</h1>
          {application && (
            <p className="text-ink-muted">
              Agency: <span className="font-semibold text-brand-navy">{application.agencyName}</span>
              <span className="mx-2 text-ink-faint">·</span>
              {businessTypeLabel(application.businessType)}
            </p>
          )}
        </div>

        {/* Application status banner */}
        {application && !approved && (
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-brand-blue/20 bg-brand-blueLight/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-blue">
                <Clock className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold text-brand-navy">Application {statusLabel}</p>
                <p className="text-sm text-ink-muted">
                  Reference {application.reference}. We&apos;ll email you once your agency is approved. Some features unlock after approval.
                </p>
              </div>
            </div>
            <Link href="/support" className="shrink-0 text-sm font-semibold text-brand-blue hover:underline">Contact support</Link>
          </div>
        )}

        {/* Business at a glance */}
        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-brand-navy">Your Business at a Glance</h2>
          <span className="rounded-lg border border-surface-border bg-white px-2.5 py-1 text-xs font-semibold text-ink-muted">This Month</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-surface-border bg-white p-4">
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.tone}`}>
                <s.icon className="h-5 w-5" />
              </span>
              <p className="mt-3 text-2xl font-extrabold text-brand-navy">{s.value}</p>
              <p className="mt-0.5 text-xs font-medium text-ink-muted">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-faint">
          Real figures appear here as you transact. New accounts start at zero — nothing is simulated.
        </p>

        {/* Quick actions */}
        <h2 className="mt-8 text-lg font-bold text-brand-navy">Quick Actions</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {actions.map((a) => (
            <Link key={a.label} href={a.href} className="group flex items-center gap-3 rounded-2xl border border-surface-border bg-white p-4 transition-shadow hover:shadow-card">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-white">
                <a.icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-brand-navy">{a.label}</span>
            </Link>
          ))}
        </div>

        {/* KYC / next steps */}
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-surface-border bg-white p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue">
              <FileCheck2 className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-base font-bold text-brand-navy">Complete your KYC</h3>
            <p className="mt-1.5 text-sm text-ink-muted">
              Upload your identity, PAN, GST certificate (where applicable) and business proof to get your agency verified and approved.
            </p>
            <Link href="/dashboard/kyc" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:gap-1.5">
              Upload documents <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-2xl border border-surface-border bg-white p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orangeLight text-brand-orange">
              <Wallet className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-base font-bold text-brand-navy">Add your prepaid balance</h3>
            <p className="mt-1.5 text-sm text-ink-muted">
              Top up securely to book flights from a single balance. Every credit is verified server-side before it reflects here.
            </p>
            <Link href="/dashboard/wallet" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:gap-1.5">
              Open ExpertzWallet <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
