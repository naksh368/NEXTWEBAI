"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plane,
  Download,
  Mail,
  XCircle,
  RefreshCw,
  ShieldCheck,
  Info,
} from "lucide-react";
import type { Booking } from "@/lib/types";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { inr, formatDate } from "@/lib/utils";

export function BookingDetail({ booking }: { booking: Booking }) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reissueOpen, setReissueOpen] = useState(false);
  const [state, setState] = useState<Booking>(booking);

  const canCancel = state.status === "TICKET ISSUED" || state.status === "ON HOLD";
  // Sample charges only — not real supplier tariffs.
  const cancellationFee = 1750;
  const supplierCharges = 900;
  const refundAmount = Math.max(0, state.total - cancellationFee - supplierCharges);

  const doCancel = () => {
    setState((s) => ({
      ...s,
      status: "REFUND INITIATED",
      refund: {
        cancellationFee,
        supplierCharges,
        refundAmount,
        status: "REFUND INITIATED",
      },
    }));
    setCancelOpen(false);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/bookings"
            className="grid h-10 w-10 place-items-center rounded-lg border border-surface-border bg-white text-navy hover:bg-surface-muted"
            aria-label="Back to bookings"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-navy">{state.id}</h1>
            <p className="text-xs text-ink-faint">
              Booked {formatDate(state.bookedOn)} · {state.pnr ? `PNR ${state.pnr}` : "No PNR yet"}
            </p>
          </div>
        </div>
        <StatusBadge status={state.status} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* Flight details */}
          <Card title="Flight Details">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-sm font-extrabold text-blue">
                  {state.airline.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-bold text-navy">{state.airline}</p>
                  <p className="text-xs text-ink-faint">{state.flightNumber}</p>
                </div>
              </div>
              <Badge tone="blue">{state.route}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Info2 label="Route" value={state.route} />
              <Info2 label="Travel Date" value={formatDate(state.travelDate)} />
              {state.ticketNumbers.length > 0 && (
                <Info2 label="Ticket No." value={state.ticketNumbers.join(", ")} />
              )}
              {state.pnr && <Info2 label="PNR" value={state.pnr} />}
            </div>
          </Card>

          {/* Passengers */}
          <Card title="Passenger Details">
            <div className="divide-y divide-surface-border">
              {state.passengers.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <span className="text-sm font-bold text-navy">
                    {p.firstName} {p.lastName}
                  </span>
                  <span className="text-xs text-ink-faint">
                    {p.type} · {p.gender} · {p.nationality}
                    {p.passportNo ? ` · ${p.passportNo}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Refund breakdown */}
          {state.refund && (
            <Card title="Refund Status">
              <div className="mb-3">
                <StatusBadge status={state.refund.status} />
              </div>
              <div className="space-y-2 text-sm">
                <Line label="Original Fare" value={inr(state.total)} />
                <Line label="Cancellation Fee" value={`- ${inr(state.refund.cancellationFee)}`} />
                <Line label="Supplier Charges" value={`- ${inr(state.refund.supplierCharges)}`} />
                <div className="border-t border-surface-border pt-2">
                  <Line label="Refund Amount" value={inr(state.refund.refundAmount)} strong tone="success" />
                </div>
              </div>
              <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue">
                <Info size={14} /> Sample charges shown for illustration. Actual supplier
                charges apply at cancellation.
              </p>
            </Card>
          )}
        </div>

        {/* Side: fare + actions */}
        <aside className="space-y-5">
          <Card title="Fare">
            <div className="space-y-2 text-sm">
              <Line label="Base Fare" value={inr(state.baseFare)} />
              <Line label="Taxes & Fees" value={inr(state.taxes)} />
              <div className="border-t border-surface-border pt-2">
                <Line label="Total" value={inr(state.total)} strong />
              </div>
            </div>
          </Card>

          {state.status === "TICKET ISSUED" && (
            <div className="space-y-2">
              <Button variant="primary" className="w-full">
                <Download size={16} /> Download Ticket
              </Button>
              <Button variant="outline" className="w-full">
                <Mail size={16} /> Email Ticket
              </Button>
            </div>
          )}

          <Card title="Manage Booking">
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled={!canCancel}
                onClick={() => setCancelOpen(true)}
              >
                <XCircle size={16} className="text-danger" /> Cancel Booking
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled={state.status !== "TICKET ISSUED"}
                onClick={() => setReissueOpen(true)}
              >
                <RefreshCw size={16} className="text-blue" /> Request Reissue
              </Button>
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-xs text-ink-faint">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-success" />
              Refunds are credited back to your ExpertzWallet.
            </p>
          </Card>
        </aside>
      </div>

      {/* Cancel modal */}
      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel Booking"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>
              Keep Booking
            </Button>
            <Button variant="accent" onClick={doCancel}>
              Confirm Cancellation
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">
          Review the transparent breakdown before cancelling {state.id}.
        </p>
        <div className="mt-4 space-y-2 rounded-xl border border-surface-border p-4 text-sm">
          <Line label="Original Fare" value={inr(state.total)} />
          <Line label="Cancellation Fee" value={`- ${inr(cancellationFee)}`} />
          <Line label="Supplier Charges" value={`- ${inr(supplierCharges)}`} />
          <div className="border-t border-surface-border pt-2">
            <Line label="Refund to Wallet" value={inr(refundAmount)} strong tone="success" />
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-faint">
          Charges shown are sample values for illustration only.
        </p>
      </Modal>

      {/* Reissue modal */}
      <Modal
        open={reissueOpen}
        onClose={() => setReissueOpen(false)}
        title="Request Reissue"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReissueOpen(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => setReissueOpen(false)}>
              Submit Request
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">
          Reissue changes the travel date on {state.id}. Fare difference and airline
          reissue charges (sample values) will be quoted before you confirm.
        </p>
        <div className="mt-4">
          <label className="mb-1.5 block text-[0.72rem] font-extrabold uppercase tracking-wide text-ink-muted">
            New Travel Date
          </label>
          <input
            type="date"
            defaultValue={state.travelDate}
            className="h-11 w-full rounded-lg border border-surface-border bg-white px-3.5 text-sm font-semibold text-ink outline-none focus:border-blue focus:ring-4 focus:ring-blue/10"
          />
        </div>
      </Modal>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-surface-border bg-white p-5 shadow-card">
      <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-ink-muted">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Info2({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.7rem] font-bold uppercase text-ink-faint">{label}</p>
      <p className="font-bold text-navy">{value}</p>
    </div>
  );
}

function Line({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "success";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={strong ? "font-bold text-navy" : "text-ink-muted"}>{label}</span>
      <span
        className={`font-bold ${strong ? "text-base font-extrabold" : ""} ${
          tone === "success" ? "text-success" : "text-navy"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
