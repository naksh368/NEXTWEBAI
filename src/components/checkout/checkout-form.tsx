"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Loader2, ShieldCheck, CreditCard, Info, User, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { formatINR, cn } from "@/lib/utils";

type Meal = "VEG" | "NON_VEG";
type Title = "MR" | "MS" | "MRS";
type Traveller = {
  title: Title;
  givenName: string;
  surname: string;
  dateOfBirth: string;
  passportNo: string;
  passportExpiry: string;
  passportIssueDate: string;
  passportIssueCity: string;
  passportIssueCountry: string;
  panNumber: string;
  mealPreference: Meal;
  type: "ADULT";
};

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

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

function isValid(t: Traveller, isDomestic: boolean): boolean {
  const baseOk =
    t.givenName.trim().length >= 1 &&
    t.surname.trim().length >= 1 &&
    !!t.dateOfBirth &&
    PAN_RE.test(t.panNumber.trim().toUpperCase());
  if (isDomestic) return baseOk;
  return (
    baseOk &&
    t.passportNo.trim().length >= 4 &&
    !!t.passportExpiry &&
    !!t.passportIssueDate &&
    t.passportIssueCity.trim().length >= 1 &&
    t.passportIssueCountry.trim().length >= 1
  );
}

export function CheckoutForm({
  versionId, travellerCount, selectedOptionIds, travelDate, departureCity = null, couponCode, total, prefillName, isDomestic = false, travellerBreakdown, quoteId,
}: {
  versionId: string;
  travellerCount: number;
  selectedOptionIds: string[];
  travelDate: string | null;
  departureCity?: string | null;
  couponCode: string | null;
  total: number;
  prefillName?: string | null;
  isDomestic?: boolean;
  travellerBreakdown?: { adults: number; children: number; childrenAges: number[]; infants: number; rooms: number } | null;
  /** When set, create the booking from this accepted quote (fixed quoted price). */
  quoteId?: string;
}) {
  const router = useRouter();
  // Local YYYY-MM-DD (not UTC) so IST users never see an off-by-one bound.
  const todayStr = new Date().toLocaleDateString("en-CA");
  const [travellers, setTravellers] = useState<Traveller[]>(
    Array.from({ length: travellerCount }, (_, i) => ({
      title: "MR", givenName: i === 0 ? (prefillName ?? "").split(" ")[0] ?? "" : "",
      surname: i === 0 ? (prefillName ?? "").split(" ").slice(1).join(" ") : "",
      dateOfBirth: "", passportNo: "", passportExpiry: "", passportIssueDate: "",
      passportIssueCity: "", passportIssueCountry: "", panNumber: "", mealPreference: "VEG", type: "ADULT",
    }))
  );
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Premium post-payment interstitial: shown briefly before we move to My Trip.
  const [booked, setBooked] = useState<{ id: string; reference: string } | null>(null);

  function update(i: number, patch: Partial<Traveller>) {
    setTravellers((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }

  const allValid = travellers.every((t) => isValid(t, isDomestic));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!allValid) return setError(
      isDomestic
        ? "Please complete every traveller's name, date of birth and a valid 10-character PAN."
        : "Please complete every traveller's details, including passport and a valid 10-character PAN."
    );
    if (!terms) return setError("Please accept the terms to continue.");
    setError(null);
    setLoading(true);
    try {
      setStatus("Creating your booking…");
      const bookRes = quoteId
        ? await fetch(`/api/quotes/${quoteId}/accept`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ travellers, termsAccepted: true }),
          })
        : await fetch("/api/bookings", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ versionId, travellerCount: travellers.length, selectedOptionIds, travelDate, departureCity, couponCode, travellers, travellerBreakdown, termsAccepted: true }),
          });
      const booking = await bookRes.json();
      if (!booking.ok) { setError(booking.error ?? "Could not create booking."); setLoading(false); setStatus(null); return; }

      setStatus("Preparing secure payment…");
      const orderRes = await fetch("/api/payments/razorpay/order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.bookingId }),
      });
      const order = await orderRes.json();

      if (!order.ok && order.configured === false) {
        router.push(`/account/trips/${booking.bookingId}`);
        router.refresh();
        return;
      }
      if (!order.ok) { setError(order.error ?? "Could not start payment."); setLoading(false); setStatus(null); return; }

      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) { setError("Could not load the payment gateway."); setLoading(false); setStatus(null); return; }

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
          if (v.ok) {
            // Calm "Payment received" screen, then auto-move to the trip page
            // (busting the client cache so the fresh server render is shown).
            setStatus(null);
            setBooked({ id: booking.bookingId, reference: booking.reference });
            setTimeout(() => { router.push(`/account/trips/${booking.bookingId}`); router.refresh(); }, 2600);
          } else {
            setError("Payment could not be verified. If you were charged, contact support.");
            setLoading(false); setStatus(null);
          }
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

  if (booked) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-10 w-10" />
        </span>
        <h2 className="mt-5 text-2xl font-extrabold text-brand-navy">Payment received</h2>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">Booking reference</p>
        <p className="text-lg font-bold tracking-wide text-brand-navy">{booked.reference}</p>
        <p className="mt-4 max-w-sm text-sm text-ink-muted">Your payment has been securely received. We&apos;re now processing your holiday — you&apos;ll get an email as it&apos;s confirmed.</p>
        <p className="mt-6 flex items-center gap-2 text-sm text-ink-muted"><Loader2 className="h-4 w-4 animate-spin" /> Taking you to your trip…</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <p className="text-sm text-ink-muted">These details are required to issue your tickets and process the booking.</p>

      <div className="space-y-4">
        {travellers.map((t, i) => (
          <div key={i} className="rounded-2xl border border-surface-border p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-brand-navy">
                <User className="h-4 w-4 text-brand-blue" /> Traveller {i + 1}{i === 0 ? " · Primary contact" : ""}
              </div>
              {/* Meal preference */}
              <div className="flex overflow-hidden rounded-lg border border-surface-border text-xs font-semibold">
                {(["VEG", "NON_VEG"] as const).map((m) => (
                  <button type="button" key={m} onClick={() => update(i, { mealPreference: m })}
                    className={cn("px-3 py-1.5 transition-colors", t.mealPreference === m ? "bg-brand-blue text-white" : "text-ink-muted hover:text-ink")}>
                    {m === "VEG" ? "🟢 Veg" : "🔴 Non-veg"}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="mb-3 flex gap-2">
              {(["MR", "MS", "MRS"] as const).map((tt) => (
                <button type="button" key={tt} onClick={() => update(i, { title: tt })}
                  className={cn("rounded-lg border px-4 py-2 text-sm font-semibold transition-colors",
                    t.title === tt ? "border-brand-blue bg-brand-blueLight text-brand-blue" : "border-surface-border hover:border-brand-blue")}>
                  {tt === "MR" ? "Mr" : tt === "MS" ? "Ms" : "Mrs"}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Given name" htmlFor={`gn-${i}`} required>
                <Input id={`gn-${i}`} value={t.givenName} onChange={(e) => update(i, { givenName: e.target.value })} placeholder="First name" />
              </Field>
              <Field label="Surname" htmlFor={`sn-${i}`} required>
                <Input id={`sn-${i}`} value={t.surname} onChange={(e) => update(i, { surname: e.target.value })} placeholder="Last name" />
              </Field>
              <Field label="Date of birth" htmlFor={`dob-${i}`} required hint="Cannot be a future date">
                <Input id={`dob-${i}`} type="date" max={todayStr} value={t.dateOfBirth} onChange={(e) => update(i, { dateOfBirth: e.target.value })}
                  invalid={!!t.dateOfBirth && t.dateOfBirth > todayStr} />
              </Field>
              <Field label="PAN number" htmlFor={`pan-${i}`} required hint="Format ABCDE1234F">
                <Input id={`pan-${i}`} value={t.panNumber} maxLength={10} onChange={(e) => update(i, { panNumber: e.target.value.toUpperCase() })}
                  invalid={t.panNumber.length > 0 && !PAN_RE.test(t.panNumber)} placeholder="ABCDE1234F" />
              </Field>
              {!isDomestic && (
                <>
                  <Field label="Passport number" htmlFor={`pn-${i}`} required>
                    <Input id={`pn-${i}`} value={t.passportNo} onChange={(e) => update(i, { passportNo: e.target.value.toUpperCase() })} placeholder="e.g. M1234567" />
                  </Field>
                  <Field label="Passport expiry" htmlFor={`pe-${i}`} required hint="Must be a future date">
                    <Input id={`pe-${i}`} type="date" min={todayStr} value={t.passportExpiry} onChange={(e) => update(i, { passportExpiry: e.target.value })} />
                  </Field>
                  <Field label="Passport issue date" htmlFor={`pid-${i}`} required>
                    <Input id={`pid-${i}`} type="date" max={todayStr} value={t.passportIssueDate} onChange={(e) => update(i, { passportIssueDate: e.target.value })} />
                  </Field>
                  <Field label="Issue city" htmlFor={`pic-${i}`} required>
                    <Input id={`pic-${i}`} value={t.passportIssueCity} onChange={(e) => update(i, { passportIssueCity: e.target.value })} placeholder="City" />
                  </Field>
                  <Field label="Issue country" htmlFor={`pco-${i}`} required>
                    <Input id={`pco-${i}`} value={t.passportIssueCountry} onChange={(e) => update(i, { passportIssueCountry: e.target.value })} placeholder="Country" />
                  </Field>
                </>
              )}
            </div>
            {isDomestic && (
              <p className="mt-3 text-xs text-ink-muted">Domestic trip — no passport required. PAN is needed for booking as per regulations.</p>
            )}
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
