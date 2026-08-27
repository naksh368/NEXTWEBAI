import Link from "next/link";
import { redirect } from "next/navigation";
import { Wallet, ArrowLeft, Clock, ReceiptText } from "lucide-react";
import { Container } from "@/components/ui/container";
import { getCurrentCustomer } from "@/lib/auth";
import { getWalletSummary, listWalletTransactions, txnDisplay } from "@/lib/services/wallet-service";
import { isRazorpayConfigured } from "@/lib/services/razorpay-service";
import { AddMoney } from "@/components/wallet/add-money";
import { formatINR } from "@/lib/utils";

export const metadata = { title: "Wallet" };
export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login");

  let summary = { available: 0, onHold: 0, total: 0, currency: "INR" };
  let txns: Awaited<ReturnType<typeof listWalletTransactions>> = [];
  try {
    [summary, txns] = await Promise.all([getWalletSummary(customer.id), listWalletTransactions(customer.id, 30)]);
  } catch {
    // Table not migrated yet — render an empty, honest wallet.
  }

  const cards = [
    { label: "Available balance", value: summary.available, tone: "text-brand-navy", sub: "Spendable now" },
    { label: "On hold", value: summary.onHold, tone: "text-warning", sub: "Reserved for in-flight bookings" },
    { label: "Total", value: summary.total, tone: "text-brand-blue", sub: "Available + on hold" },
  ];

  return (
    <div>
      <Container className="py-8 sm:py-10">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-brand-navy">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-orange">ExpertzWallet</p>
            <h1 className="mt-1 text-2xl font-extrabold text-brand-navy sm:text-3xl">Your money. Your visibility.</h1>
          </div>
          <div className="flex gap-2">
            <AddMoney agentName={customer.fullName} />
          </div>
        </div>

        {/* Balance cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl border border-surface-border bg-white p-5">
              <div className="flex items-center gap-2 text-ink-muted">
                <Wallet className="h-4 w-4" />
                <span className="text-sm font-semibold">{c.label}</span>
              </div>
              <p className={`mt-3 text-3xl font-extrabold ${c.tone}`}>{formatINR(c.value)}</p>
              <p className="mt-1 text-xs text-ink-faint">{c.sub}</p>
            </div>
          ))}
        </div>

        {!isRazorpayConfigured() && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
            Online top-up is not enabled in this environment. Add your Razorpay keys (server-side) to accept payments — nothing is faked.
          </p>
        )}

        {/* Transactions */}
        <div className="mt-8">
          <h2 className="flex items-center gap-2 text-lg font-bold text-brand-navy">
            <ReceiptText className="h-5 w-5 text-brand-blue" /> Recent transactions
          </h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-surface-border bg-white">
            {txns.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-ink-muted">
                No transactions yet. Add money to your wallet to get started.
              </div>
            ) : (
              txns.map((t, i) => {
                const d = txnDisplay(t.type);
                const pending = t.status === "PENDING";
                const failed = t.status === "FAILED";
                return (
                  <div key={t.id} className={`flex items-center gap-4 px-4 py-3.5 sm:px-5 ${i > 0 ? "border-t border-surface-border" : ""}`}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-brand-navy">
                        {d.label}
                        {t.bookingRef && <span className="ml-2 text-xs font-normal text-ink-faint">{t.bookingRef}</span>}
                      </p>
                      <p className="truncate text-xs text-ink-faint">
                        {t.reference} · {new Date(t.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${failed ? "text-ink-faint line-through" : d.tone}`}>
                        {d.sign}{formatINR(t.amount)}
                      </p>
                      <p className={`text-[11px] font-semibold uppercase tracking-wide ${pending ? "text-warning" : failed ? "text-danger" : "text-success"}`}>
                        {t.status}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
