"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plane,
  Check,
  ArrowRight,
  ArrowLeft,
  Wallet,
  ShieldCheck,
  Loader2,
  CircleX,
  Download,
  Mail,
  Ticket,
  Info,
} from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { processBooking, type BookingOutcome } from "@/lib/booking-service";
import type { Passenger, Gender } from "@/lib/types";
import { WALLET } from "@/data/wallet";
import { inr, formatDate, cn } from "@/lib/utils";

export interface BookingContext {
  from: string;
  to: string;
  airline: string;
  flightNo: string;
  dep: string;
  arr: string;
  date: string;
  base: number;
  tax: number;
  total: number;
  pax: number;
  brand: string;
}

const STEPS = ["Flight", "Passenger Details", "Review", "Payment", "Confirmation"];

export function BookingWizard({ ctx }: { ctx: BookingContext }) {
  const [step, setStep] = useState(0);
  const [passengers, setPassengers] = useState<Passenger[]>(
    Array.from({ length: ctx.pax }, () => ({
      type: "ADT" as const,
      firstName: "",
      lastName: "",
      dob: "",
      gender: "Male" as Gender,
      nationality: "India",
      passportNo: "",
    })),
  );
  const [contact, setContact] = useState({ email: "", phone: "" });
  const [processing, setProcessing] = useState(false);
  const [outcome, setOutcome] = useState<BookingOutcome | null>(null);

  const international = !["Delhi", "Mumbai", "Bengaluru"].includes(ctx.to);
  const remaining = WALLET.availableBalance - ctx.total;

  const updatePax = (i: number, patch: Partial<Passenger>) =>
    setPassengers((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const paxValid = passengers.every(
    (p) => p.firstName && p.lastName && p.dob && p.nationality,
  );
  const contactValid = contact.email && contact.phone;

  const confirmBooking = async () => {
    setProcessing(true);
    setStep(4);
    // Run the hold → book → issue → verify → debit flow.
    const result = await new Promise<BookingOutcome>((resolve) =>
      setTimeout(async () => {
        const r = await processBooking(
          {
            offerId: ctx.flightNo,
            fareId: ctx.brand,
            passengers,
            contact,
          },
          { available: WALLET.availableBalance, amount: ctx.total },
        );
        resolve(r);
      }, 1800),
    );
    setOutcome(result);
    setProcessing(false);
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* Stepper */}
      <ol className="mb-7 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-extrabold transition-colors",
                    done && "bg-success text-white",
                    active && "bg-blue text-white",
                    !done && !active && "bg-surface-muted text-ink-faint",
                  )}
                >
                  {done ? <Check size={14} /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-xs font-bold sm:text-sm",
                    active ? "text-navy" : "text-ink-faint",
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span className="h-px flex-1 bg-surface-border" />
              )}
            </li>
          );
        })}
      </ol>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          {/* STEP 0 — Flight */}
          {step === 0 && (
            <StepCard title="Selected Flight">
              <FlightSummary ctx={ctx} />
              <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue">
                <Info size={14} /> Fare revalidated against the supplier. Availability and
                price are confirmed before ticketing.
              </p>
              <div className="mt-5 flex justify-end">
                <Button onClick={() => setStep(1)} variant="primary">
                  Continue <ArrowRight size={16} />
                </Button>
              </div>
            </StepCard>
          )}

          {/* STEP 1 — Passengers */}
          {step === 1 && (
            <StepCard title="Passenger Details">
              <div className="space-y-6">
                {passengers.map((p, i) => (
                  <div key={i} className="rounded-xl border border-surface-border p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Badge tone="blue">Adult {i + 1}</Badge>
                      {international && (
                        <span className="text-xs text-ink-faint">
                          Passport required for this route
                        </span>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="First Name" required>
                        <Input
                          value={p.firstName}
                          onChange={(e) => updatePax(i, { firstName: e.target.value })}
                          placeholder="Rahul"
                        />
                      </Field>
                      <Field label="Last Name" required>
                        <Input
                          value={p.lastName}
                          onChange={(e) => updatePax(i, { lastName: e.target.value })}
                          placeholder="Sharma"
                        />
                      </Field>
                      <Field label="Date of Birth" required>
                        <input
                          type="date"
                          value={p.dob}
                          onChange={(e) => updatePax(i, { dob: e.target.value })}
                          className="h-11 w-full rounded-lg border border-surface-border bg-white px-3.5 text-sm font-semibold text-ink outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10"
                        />
                      </Field>
                      <Field label="Gender" required>
                        <Select
                          value={p.gender}
                          onChange={(e) => updatePax(i, { gender: e.target.value as Gender })}
                        >
                          <option>Male</option>
                          <option>Female</option>
                        </Select>
                      </Field>
                      <Field label="Nationality" required>
                        <Input
                          value={p.nationality}
                          onChange={(e) => updatePax(i, { nationality: e.target.value })}
                        />
                      </Field>
                      {international && (
                        <Field label="Passport Number" required>
                          <Input
                            value={p.passportNo}
                            onChange={(e) => updatePax(i, { passportNo: e.target.value })}
                            placeholder="M1234567"
                          />
                        </Field>
                      )}
                    </div>
                  </div>
                ))}

                <div className="rounded-xl border border-surface-border p-4">
                  <p className="mb-3 text-sm font-extrabold text-navy">
                    Contact Information
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Email" required>
                      <Input
                        type="email"
                        value={contact.email}
                        onChange={(e) => setContact({ ...contact, email: e.target.value })}
                        placeholder="agent@company.com"
                      />
                    </Field>
                    <Field label="Phone" required>
                      <Input
                        value={contact.phone}
                        onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                        placeholder="+91 98xxx xxxxx"
                      />
                    </Field>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  <ArrowLeft size={16} /> Back
                </Button>
                <Button
                  variant="primary"
                  disabled={!paxValid || !contactValid}
                  onClick={() => setStep(2)}
                >
                  Review Booking <ArrowRight size={16} />
                </Button>
              </div>
            </StepCard>
          )}

          {/* STEP 2 — Review */}
          {step === 2 && (
            <StepCard title="Review & Confirm">
              <FlightSummary ctx={ctx} />
              <div className="mt-5">
                <p className="mb-2 text-sm font-extrabold text-navy">Passengers</p>
                <div className="divide-y divide-surface-border rounded-xl border border-surface-border">
                  {passengers.map((p, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm font-bold text-navy">
                        {p.firstName} {p.lastName}
                      </span>
                      <span className="text-xs text-ink-faint">
                        {p.gender} · {p.nationality}
                        {p.passportNo ? ` · ${p.passportNo}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <FareBreakdown ctx={ctx} />
              <div className="mt-5 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft size={16} /> Back
                </Button>
                <Button variant="primary" onClick={() => setStep(3)}>
                  Proceed to Payment <ArrowRight size={16} />
                </Button>
              </div>
            </StepCard>
          )}

          {/* STEP 3 — Payment */}
          {step === 3 && (
            <StepCard title="Payment · ExpertzWallet">
              <div className="rounded-xl border border-surface-border p-5">
                <div className="flex items-center gap-2">
                  <Wallet size={18} className="text-blue" />
                  <span className="text-sm font-extrabold text-navy">
                    Pay from ExpertzWallet
                  </span>
                  <Badge tone="blue" className="ml-auto">
                    Prepaid
                  </Badge>
                </div>
                <div className="mt-4 space-y-2.5 text-sm">
                  <Row label="ExpertzWallet Balance" value={inr(WALLET.availableBalance)} />
                  <Row label="Payment Amount" value={inr(ctx.total)} strong />
                  <div className="border-t border-surface-border pt-2.5">
                    <Row
                      label="Remaining Balance"
                      value={inr(remaining)}
                      tone={remaining < 0 ? "danger" : "success"}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-lg bg-surface-muted px-4 py-3 text-xs font-semibold text-ink-muted">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-success" />
                Your wallet amount is <b className="text-navy">held</b>, not debited, until
                the supplier confirms the booking and the ticket is issued. If ticketing
                fails, the hold is released automatically.
              </div>

              {remaining < 0 && (
                <p className="mt-3 rounded-lg bg-[#FDECEA] px-3 py-2 text-xs font-bold text-danger">
                  Insufficient balance. Please top up your ExpertzWallet to continue.
                </p>
              )}

              <div className="mt-5 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  <ArrowLeft size={16} /> Back
                </Button>
                <Button
                  variant="accent"
                  disabled={remaining < 0}
                  onClick={confirmBooking}
                >
                  Confirm Booking · {inr(ctx.total)}
                </Button>
              </div>
            </StepCard>
          )}

          {/* STEP 4 — Confirmation */}
          {step === 4 && (
            <StepCard title="Confirmation">
              {processing ? (
                <Processing />
              ) : outcome?.ok ? (
                <Confirmed ctx={ctx} outcome={outcome} lead={passengers[0]} />
              ) : (
                <Failed message={outcome?.message ?? "Booking failed."} />
              )}
            </StepCard>
          )}
        </div>

        {/* Sticky summary */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-xl border border-surface-border bg-white p-5 shadow-card">
            <p className="text-xs font-extrabold uppercase tracking-wide text-ink-faint">
              Fare Summary
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue">
                <Plane size={16} />
              </span>
              <div>
                <p className="text-sm font-bold text-navy">
                  {ctx.from} → {ctx.to}
                </p>
                <p className="text-xs text-ink-faint">
                  {ctx.airline} {ctx.flightNo}
                </p>
              </div>
            </div>
            <FareBreakdown ctx={ctx} compact />
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ── sub-parts ─────────────────────────────────────────────── */

function StepCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-surface-border bg-white p-5 shadow-card sm:p-6">
      <h2 className="mb-4 text-lg font-extrabold text-navy">{title}</h2>
      {children}
    </div>
  );
}

function FlightSummary({ ctx }: { ctx: BookingContext }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-muted p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-sm font-extrabold text-blue">
            {ctx.airline.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <p className="text-sm font-bold text-navy">{ctx.airline}</p>
            <p className="text-xs text-ink-faint">{ctx.flightNo}</p>
          </div>
        </div>
        <Badge tone="blue">{ctx.brand}</Badge>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-center">
          <p className="text-lg font-extrabold text-navy">{ctx.dep}</p>
          <p className="text-xs font-bold text-ink-faint">{ctx.from}</p>
        </div>
        <div className="flex flex-1 items-center px-3">
          <span className="h-px flex-1 bg-surface-border" />
          <Plane size={14} className="mx-1 text-blue" />
          <span className="h-px flex-1 bg-surface-border" />
        </div>
        <div className="text-center">
          <p className="text-lg font-extrabold text-navy">{ctx.arr}</p>
          <p className="text-xs font-bold text-ink-faint">{ctx.to}</p>
        </div>
      </div>
      <p className="mt-3 text-center text-xs font-semibold text-ink-muted">
        {formatDate(ctx.date)} · {ctx.pax} traveller{ctx.pax > 1 ? "s" : ""}
      </p>
    </div>
  );
}

function FareBreakdown({ ctx, compact }: { ctx: BookingContext; compact?: boolean }) {
  return (
    <div className={cn("space-y-2 text-sm", compact ? "mt-3" : "mt-5")}>
      <Row label={`Base Fare (${ctx.pax} pax)`} value={inr(ctx.base)} />
      <Row label="Taxes & Fees" value={inr(ctx.tax)} />
      <div className="border-t border-surface-border pt-2">
        <Row label="Total" value={inr(ctx.total)} strong />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "success" | "danger";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn("text-ink-muted", strong && "font-bold text-navy")}>{label}</span>
      <span
        className={cn(
          "font-bold text-navy",
          strong && "text-base font-extrabold",
          tone === "success" && "text-success",
          tone === "danger" && "text-danger",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function Processing() {
  const steps = [
    "Holding wallet amount",
    "Creating booking with supplier",
    "Issuing ticket",
    "Verifying ticket issuance",
  ];
  return (
    <div className="py-8 text-center">
      <Loader2 size={40} className="mx-auto animate-spin text-blue" />
      <p className="mt-4 text-base font-extrabold text-navy">Processing your booking…</p>
      <p className="mt-1 text-sm text-ink-muted">
        Please don&apos;t close this window.
      </p>
      <ul className="mx-auto mt-6 max-w-xs space-y-2 text-left">
        {steps.map((s) => (
          <li key={s} className="flex items-center gap-2 text-sm font-semibold text-ink-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-blue" /> {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Confirmed({
  ctx,
  outcome,
  lead,
}: {
  ctx: BookingContext;
  outcome: BookingOutcome;
  lead: Passenger;
}) {
  return (
    <div>
      <div className="rounded-xl border border-success/30 bg-success/5 p-6 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/15 text-success">
          <Check size={30} />
        </span>
        <h3 className="mt-3 text-xl font-extrabold text-navy">Booking Confirmed</h3>
        <Badge tone="success" className="mt-2">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> TICKET ISSUED
        </Badge>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Detail label="PNR" value={outcome.pnr ?? "—"} />
        <Detail label="Ticket Number" value={outcome.ticketNumbers?.[0] ?? "—"} />
        <Detail label="Passenger" value={`${lead.firstName} ${lead.lastName}`} />
        <Detail label="Route" value={`${ctx.from} → ${ctx.to}`} />
        <Detail label="Date" value={formatDate(ctx.date)} />
        <Detail label="Amount Debited" value={inr(outcome.amountDebited ?? ctx.total)} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="primary">
          <Download size={16} /> Download Ticket
        </Button>
        <Button variant="outline">
          <Mail size={16} /> Email Ticket
        </Button>
        <ButtonLink href="/bookings" variant="ghost">
          <Ticket size={16} /> View Booking
        </ButtonLink>
      </div>
    </div>
  );
}

function Failed({ message }: { message: string }) {
  return (
    <div className="py-4 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#FDECEA] text-danger">
        <CircleX size={30} />
      </span>
      <h3 className="mt-4 text-xl font-extrabold text-navy">Booking Failed</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">{message}</p>
      <p className="mx-auto mt-3 inline-flex rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue">
        Your wallet hold has been released. No ticket was issued.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <ButtonLink href="/flights" variant="primary">
          Search Again
        </ButtonLink>
        <ButtonLink href="/wallet" variant="outline">
          View Wallet
        </ButtonLink>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-muted p-3.5">
      <p className="text-[0.7rem] font-extrabold uppercase tracking-wide text-ink-faint">
        {label}
      </p>
      <p className="mt-1 text-sm font-extrabold text-navy">{value}</p>
    </div>
  );
}
