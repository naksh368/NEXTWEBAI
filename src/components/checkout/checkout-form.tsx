"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Loader2, ShieldCheck, CreditCard, Info, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { formatINR } from "@/lib/utils";

type Traveller = { fullName: string; passportNo: string; type: "ADULT" | "CHILD" | "INFANT" };

declare global {
  interface Window { Razorpay?: new (opts: unknown) => { open: () => void } }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function CheckoutForm({
  versionId, travellerCount, selectedOptionIds, departureId, couponCode, total, prefillName,
}: {
  versionId: string;
  travellerCount: number;
  selectedOptionIds: string[];
  departureId: string | null;
  couponCode: string | null;
  total: number;
  prefillName?: string | null;
}) {
  const router = useRouter();
  const [travellers, setTravellers] = useState<Traveller[]>(
    Array.from({ length: travellerCount }, (_, i) => ({ fullName: i === 0 ? prefillName ?? "" : "", passportNo: "", type: "ADULT" }))
  );
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update(i: number, patch: Partial<Traveller>) {
    setTravellers((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }

  const namesValid = travellers.every((t) => t.fullName.trim().length >= 2);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!namesValid) return setError("Please enter each traveller's full name.");
    if (!terms) return setError("Please accept the terms to continue.");
    setError(null);
    setLoading(true);
    try {
      // 1) Create the booking (server reprices — authoritative).
      setStatus("Creating your booking…");
      const bookRes = await fetch("/api/bookings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId, travellerCount: travellers.length, selectedOptionIds, departureId, couponCode, travellers, termsAccepted: true }),
      });
      const booking = await bookRes.json();
      if (!booking.ok) { setError(booking.error ?? "Could not create booking."); setLoading(false); setStatus(null); return; }

      // 2) Start payment.
      setStatus("Preparing secure payment…");
      const orderRes = await fetch("/api/payments/razorpay/order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.bookingId }),
      });
      const order = await orderRes.json();

      if (!order.ok && order.configured === false) {
        // No live payment in this environment — booking is created (payment pending).
        router.push(`/account/trips/${booking.bookingId}?created=1`);
        return;
      }
      if (!order.ok) { setError(order.error ?? "Could not start payment."); setLoading(false); setStatus(null); return; }

      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) { setError("Could not load the payment gateway."); setLoading(false); setStatus(null); return; }

      // 3) Open Razorpay; verify on the server in the success handler.
      const rzp = new window.Razorpay({
        key: order.keyId, order_id: order.orderId, amount: order.amount, currency: order.currency,
        name: "ExpertzTrip", description: `Booking ${booking.reference}`,
        handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          setStatus("Verifying payment…");
          const verify = await fetch("/api/payments/razorpay/verify", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId: booking.bookingId, ...resp }),
          });
          const v = await verify.json();
          if (v.ok) router.push(`/account/trips/${booking.bookingId}?paid=1`);
          else { setError("Payment could not be verified. If you were charged, contact support."); setLoading(false); setStatus(null); }
        },
        modal: { ondismiss: () => { setLoading(false); setStatus(null); } },
        theme: { color: "#2340d9" },
      });
      rzp.open();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      setStatus(null);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-4">
        {travellers.map((t, i) => (
          <div key={i} className="rounded-xl border border-surface-border p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-navy">
              <User className="h-4 w-4 text-brand-blue" /> Traveller {i + 1}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Full name (as per passport)" htmlFor={`t-name-${i}`} required>
                <Input id={`t-name-${i}`} value={t.fullName} onChange={(e) => update(i, { fullName: e.target.value })} placeholder="Full name" />
              </Field>
              <Field label="Passport number" htmlFor={`t-pass-${i}`} hint="Optional now — required before travel.">
                <Input id={`t-pass-${i}`} value={t.passportNo} onChange={(e) => update(i, { passportNo: e.target.value.toUpperCase() })} placeholder="Optional" />
              </Field>
            </div>
          </div>
        ))}
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-surface-border p-4">
        <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-brand-blue" />
        <span className="text-sm text-ink-muted">
          I have reviewed the itinerary, price and{" "}
          <Link href="/legal/cancellation" className="font-medium text-brand-blue underline">cancellation policy</Link>, and I accept the{" "}
          <Link href="/legal/terms" className="font-medium text-brand-blue underline">terms of service</Link>.
        </span>
      </label>

      {error && <p className="rounded-lg bg-[#FCE9E9] px-3 py-2 text-sm font-medium text-danger">{error}</p>}

      <Button type="submit" size="lg" variant="orange" className="w-full" disabled={loading}>
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> {status ?? "Processing…"}</> : <><ShieldCheck className="h-4 w-4" /> Pay {formatINR(total)} securely</>}
      </Button>

      <div className="flex items-center justify-center gap-1.5 text-xs text-ink-muted">
        <CreditCard className="h-3.5 w-3.5" /> Payments are processed securely by Razorpay. We never store card details.
      </div>
      <div className="flex items-start gap-2 rounded-xl bg-surface-muted/70 p-3 text-xs text-ink-muted">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-blue" />
        Your booking is created first, then payment is verified on our servers. Payment received is not the same as
        confirmed — we confirm your trip only after your travel components are secured.
      </div>
    </form>
  );
}
