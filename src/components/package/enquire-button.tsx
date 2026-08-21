"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, Phone, X, Send, CheckCircle2, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { EXPERT_PHONE, whatsappLink, telLink } from "@/lib/contact";
import { cn } from "@/lib/utils";

interface EnquireButtonProps {
  packageName?: string;
  packageSlug?: string;
  className?: string;
  variant?: "solid" | "outline" | "ghostWhite";
  label?: string;
  size?: "md" | "lg";
}

const BUDGETS = ["Under ₹25,000", "₹25,000 – ₹50,000", "₹50,000 – ₹1,00,000", "₹1,00,000 – ₹2,00,000", "Above ₹2,00,000"];
const NIGHTS = ["2 – 3 nights", "4 – 5 nights", "6 – 7 nights", "8 – 10 nights", "More than 10 nights"];
const TRAVEL_TYPES = ["Family", "Couple", "Honeymoon", "Friends", "Solo", "Luxury", "Adventure"];
const BOOKING_PLANS = ["This week", "This month", "In 1 – 3 months", "Just exploring"];

export function EnquireButton({
  packageName,
  packageSlug,
  className,
  variant = "outline",
  label = "Enquire now",
  size = "md",
}: EnquireButtonProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [mounted, setMounted] = useState(false);

  // Portal target only exists on the client.
  useEffect(() => { setMounted(true); }, []);

  // Lock background scroll while the modal is open (mobile fix).
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  // Step 2
  const [budget, setBudget] = useState("");
  const [nights, setNights] = useState("");
  const [travelType, setTravelType] = useState("");
  const [travellers, setTravellers] = useState("");
  const [bookingPlan, setBookingPlan] = useState("");
  const [travelDate, setTravelDate] = useState("");

  const waMessage = packageName
    ? `Hi ExpertzTrip 👋\n\nI'm interested in the "${packageName}" holiday. Please help me with dates, pricing and what's included.`
    : `Hi ExpertzTrip 👋\n\nI'd like help planning a holiday. Please share options and pricing.`;

  function close() {
    setOpen(false);
    setTimeout(() => { setSent(false); setError(null); setStep(1); }, 300);
  }

  function goNext(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) return setError("Please enter your full name.");
    if (!email.trim()) return setError("Please enter your email.");
    if (phone.trim().length < 6) return setError("Please enter a valid phone number.");
    setStep(2);
  }

  const nightsToInt = (s: string) => {
    const m = s.match(/\d+/);
    return m ? Number(m[0]) : undefined;
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName, email, phone,
          packageSlug: packageSlug ?? undefined,
          packageName: packageName ?? undefined,
          destination: packageName ?? undefined,
          budget, nights: nightsToInt(nights),
          travelType,
          travellers: travellers ? Number(travellers) : undefined,
          bookingPlan, travelDate,
          source: packageSlug ? "PACKAGE" : "WEBSITE",
        }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error ?? "Could not submit. Please try again."); return; }
      setSent(true);
    } catch {
      setError("Network error. Please try WhatsApp or call us.");
    } finally {
      setLoading(false);
    }
  }

  const base = "inline-flex w-full items-center justify-center gap-2 rounded-xl font-semibold transition-colors";
  const sizes = size === "lg" ? "h-12 px-6 text-base" : "h-11 px-4";
  const styles =
    variant === "solid"
      ? "bg-brand-blue text-white hover:bg-brand-blueDark"
      : variant === "ghostWhite"
        ? "border-2 border-white/70 bg-white/10 text-white backdrop-blur hover:bg-white/20"
        : "border-2 border-brand-blue bg-white text-brand-blue hover:bg-brand-blueLight";

  const inputCls = "h-11 w-full rounded-xl border border-surface-border bg-surface-muted/40 px-3.5 text-sm focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-blue/10";
  const labelCls = "mb-1 block text-sm font-semibold text-brand-navy";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn(base, sizes, styles, className)}>
        <MessageCircle className="h-4 w-4" /> {label}
      </button>

      {open && mounted && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="my-0 w-full max-w-md rounded-t-3xl bg-white shadow-2xl animate-fade-in sm:my-8 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative px-6 pt-6">
              <button onClick={close} aria-label="Close" className="absolute right-4 top-4 rounded-lg p-1 text-ink-muted hover:bg-surface-muted hover:text-ink">
                <X className="h-5 w-5" />
              </button>
              <h3 className="text-center text-2xl font-extrabold text-brand-navy">Please submit your info</h3>
              {!sent && <p className="mt-1 text-center text-sm text-ink-muted">Step {step} of 2</p>}
              {!sent && (
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                  <div className="h-full rounded-full bg-brand-blue transition-all duration-300" style={{ width: step === 1 ? "50%" : "100%" }} />
                </div>
              )}
            </div>

            {sent ? (
              <div className="flex flex-col items-center px-6 py-12 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
                  <CheckCircle2 className="h-9 w-9" />
                </span>
                <h4 className="mt-5 text-xl font-bold text-brand-navy">Enquiry received!</h4>
                <p className="mt-2 max-w-sm text-sm text-ink-muted">
                  Thank you, {fullName.split(" ")[0] || "traveller"}. Our travel expert will reach out to you shortly on {phone}.
                </p>
                <a
                  href={whatsappLink(waMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 font-semibold text-white transition-colors hover:brightness-95"
                >
                  <Send className="h-4 w-4" /> Chat now on WhatsApp
                </a>
                <button onClick={close} className="mt-3 text-sm font-semibold text-ink-muted hover:text-ink">Close</button>
              </div>
            ) : step === 1 ? (
              <form onSubmit={goNext} className="space-y-4 p-6">
                <div>
                  <label className={labelCls}>Full name *</label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className={inputCls} autoFocus />
                </div>
                <div>
                  <label className={labelCls}>Email *</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Phone *</label>
                  <div className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-muted/40 px-3.5 focus-within:border-brand-blue focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-blue/10">
                    <span className="text-sm font-semibold text-ink-muted">🇮🇳 +91</span>
                    <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))} placeholder="10 digit number" className="h-11 w-full bg-transparent text-sm focus:outline-none" />
                  </div>
                </div>

                {error && <p className="text-sm font-medium text-danger">{error}</p>}

                <button type="submit" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-navy text-base font-bold text-white transition-colors hover:bg-black">
                  Next <ArrowRight className="h-4 w-4" />
                </button>

                <p className="text-center text-xs text-ink-muted">
                  Our travel experts will call or WhatsApp you back with real options — usually within a few hours.
                </p>
              </form>
            ) : (
              <form onSubmit={submit} className="space-y-4 p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>What&apos;s your budget? *</label>
                    <select required value={budget} onChange={(e) => setBudget(e.target.value)} className={inputCls}>
                      <option value="">Select budget</option>
                      {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>How many nights? *</label>
                    <select required value={nights} onChange={(e) => setNights(e.target.value)} className={inputCls}>
                      <option value="">Select nights</option>
                      {NIGHTS.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Purpose of travel? *</label>
                    <select required value={travelType} onChange={(e) => setTravelType(e.target.value)} className={inputCls}>
                      <option value="">Select travel type</option>
                      {TRAVEL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>How many travellers? *</label>
                    <input required type="number" min={1} max={99} value={travellers} onChange={(e) => setTravellers(e.target.value)} placeholder="e.g. 4" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>How soon are you planning to book? *</label>
                  <select required value={bookingPlan} onChange={(e) => setBookingPlan(e.target.value)} className={inputCls}>
                    <option value="">Select booking plan</option>
                    {BOOKING_PLANS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>When do you plan to travel? *</label>
                  <input required type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} className={inputCls} />
                </div>

                {error && <p className="text-sm font-medium text-danger">{error}</p>}

                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => { setStep(1); setError(null); }} className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-surface-border font-semibold text-ink transition-colors hover:bg-surface-muted">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <button type="submit" disabled={loading} className="inline-flex h-12 flex-[1.5] items-center justify-center gap-2 rounded-xl bg-brand-blue font-bold text-white transition-colors hover:bg-brand-blueDark disabled:opacity-60">
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit Enquiry"}
                  </button>
                </div>

                <div className="flex items-center gap-3 border-t border-surface-border pt-3">
                  <a href={whatsappLink(waMessage)} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-[#25D366]/50 text-sm font-semibold text-[#128C4B] transition-colors hover:bg-[#25D366]/10">
                    <Send className="h-4 w-4" /> WhatsApp
                  </a>
                  <a href={telLink()} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-brand-blue/30 text-sm font-semibold text-brand-blue transition-colors hover:bg-brand-blueLight">
                    <Phone className="h-4 w-4" /> Call {EXPERT_PHONE}
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
