"use client";

import { useState } from "react";
import {
  Wallet,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import type { WalletTransaction, TxnType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { StatCard } from "@/components/ui/stat-card";
import { inr, formatDate, cn } from "@/lib/utils";

const QUICK = [5000, 10000, 25000];

export function WalletView({
  balance,
  todaysBookings,
  pendingRefunds,
  transactions,
}: {
  balance: number;
  todaysBookings: number;
  pendingRefunds: number;
  transactions: WalletTransaction[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [amount, setAmount] = useState<number | "">(10000);
  const [q, setQ] = useState("");
  const [type, setType] = useState<"ALL" | TxnType>("ALL");

  const filtered = transactions
    .filter((t) => (type === "ALL" ? true : t.type === type))
    .filter((t) =>
      q
        ? [t.description, t.bookingId, t.id].join(" ").toLowerCase().includes(q.toLowerCase())
        : true,
    );

  return (
    <div className="space-y-6">
      {/* Balance + add money */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div className="rounded-2xl border border-surface-border navy-wash p-6 text-white shadow-card">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-bold text-blue-100">
              <Wallet size={16} /> ExpertzWallet
            </span>
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold">
              Prepaid
            </span>
          </div>
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-blue-100">
            Available Balance
          </p>
          <p className="text-4xl font-extrabold">{inr(balance)}</p>
          <Button
            variant="accent"
            className="mt-5"
            onClick={() => setAddOpen(true)}
          >
            <Plus size={16} /> Add Money
          </Button>
        </div>
        <StatCard
          label="Today's Bookings"
          value={inr(todaysBookings)}
          accent="blue"
          icon={<ArrowUpRight size={18} />}
        />
        <StatCard
          label="Pending Refunds"
          value={inr(pendingRefunds)}
          accent="orange"
          icon={<ArrowDownLeft size={18} />}
        />
      </div>

      {/* Quick add row */}
      <div className="rounded-xl border border-surface-border bg-white p-5 shadow-card">
        <p className="text-sm font-extrabold text-navy">Quick Top-up</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK.map((v) => (
            <button
              key={v}
              onClick={() => {
                setAmount(v);
                setAddOpen(true);
              }}
              className="rounded-lg border border-surface-border bg-white px-4 py-2.5 text-sm font-bold text-navy transition-colors hover:border-blue hover:bg-blue-50"
            >
              {inr(v)}
            </button>
          ))}
          <button
            onClick={() => {
              setAmount("");
              setAddOpen(true);
            }}
            className="rounded-lg border border-dashed border-surface-border bg-white px-4 py-2.5 text-sm font-bold text-blue transition-colors hover:bg-blue-50"
          >
            Custom Amount
          </button>
        </div>
      </div>

      {/* Transaction history */}
      <div className="rounded-xl border border-surface-border bg-white shadow-card">
        <div className="flex flex-col gap-3 border-b border-surface-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-extrabold text-navy">Transaction History</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="sm:w-40"
            >
              <option value="ALL">All types</option>
              <option value="TOPUP">Top-ups</option>
              <option value="BOOKING">Bookings</option>
              <option value="REFUND">Refunds</option>
            </Select>
            <div className="relative sm:w-56">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-muted text-left text-xs font-extrabold uppercase tracking-wide text-ink-muted">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Booking ID</th>
                <th className="px-5 py-3 text-right">Credit</th>
                <th className="px-5 py-3 text-right">Debit</th>
                <th className="px-5 py-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-surface-muted">
                  <td className="whitespace-nowrap px-5 py-3.5 text-ink-muted">
                    {formatDate(t.date, { day: "2-digit", month: "short" })}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-navy">{t.description}</td>
                  <td className="px-5 py-3.5 text-ink-faint">{t.bookingId ?? "—"}</td>
                  <td className="px-5 py-3.5 text-right font-bold text-success">
                    {t.credit ? `+ ${inr(t.credit)}` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-ink">
                    {t.debit ? `- ${inr(t.debit)}` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right font-extrabold text-navy">
                    {inr(t.balanceAfter)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="divide-y divide-surface-border sm:hidden">
          {filtered.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-bold text-navy">{t.description}</p>
                <p className="text-xs text-ink-faint">
                  {formatDate(t.date, { day: "2-digit", month: "short" })}
                  {t.bookingId ? ` · ${t.bookingId}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    "text-sm font-extrabold",
                    t.credit ? "text-success" : "text-ink",
                  )}
                >
                  {t.credit ? `+ ${inr(t.credit)}` : `- ${inr(t.debit ?? 0)}`}
                </p>
                <p className="text-xs text-ink-faint">Bal {inr(t.balanceAfter)}</p>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="p-10 text-center text-sm text-ink-muted">
            No transactions match your filters.
          </div>
        )}
      </div>

      {/* Add money modal — payment gateway placeholder */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Money to ExpertzWallet"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" onClick={() => setAddOpen(false)} disabled={!amount}>
              <CreditCard size={16} /> Proceed to Pay {amount ? inr(Number(amount)) : ""}
            </Button>
          </>
        }
      >
        <div className="flex flex-wrap gap-2">
          {QUICK.map((v) => (
            <button
              key={v}
              onClick={() => setAmount(v)}
              className={cn(
                "rounded-lg border px-4 py-2.5 text-sm font-bold transition-colors",
                amount === v
                  ? "border-blue bg-blue-50 text-blue"
                  : "border-surface-border text-navy hover:bg-surface-muted",
              )}
            >
              {inr(v)}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-[0.72rem] font-extrabold uppercase tracking-wide text-ink-muted">
            Amount
          </label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
            placeholder="Enter amount"
          />
        </div>
        <div className="mt-4 rounded-lg border border-dashed border-surface-border bg-surface-muted p-4 text-center">
          <p className="text-xs font-bold text-ink-muted">Payment Gateway</p>
          <p className="mt-1 text-xs text-ink-faint">
            UPI · Net Banking · Cards — integration placeholder
          </p>
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-xs text-ink-faint">
          <ShieldCheck size={14} className="mt-0.5 shrink-0 text-success" />
          Funds are added to your prepaid balance instantly on successful payment.
        </p>
      </Modal>
    </div>
  );
}
