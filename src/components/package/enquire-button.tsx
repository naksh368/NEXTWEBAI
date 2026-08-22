"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { MessageCircle, Phone, X, Send, CheckCircle2, Loader2, ArrowLeft, ArrowRight, User } from "lucide-react";
import { EXPERT_PHONE, whatsappLink, telLink } from "@/lib/contact";
import { cn } from "@/lib/utils";

interface EnquireButtonProps {
  packageName?: string;
  packageSlug?: string;
  className?: string;
  variant?: "solid" | "outline" | "ghostWhite";
  label?: string;
  size?: "md" | "lg";
  /** Prefill for signed-in customers — we never re-ask their name/email. */
  defaultName?: string | null;
  defaultEmail?: string | null;
  defaultPhone?: string | null;
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
  defaultName,
  defaultEmail,
  defaultPhone,
}: EnquireButtonProps) {
  const known = Boolean(defaultName && defaultPhone);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(known ? 2 : 1);
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
  const [reference, setReference] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 — prefilled for signed-in customers (we never re-ask them).
  const [fullName, setFullName] = useState(defaultName ?? "");
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [phone, setPhone] = useState((defaultPhone ?? "").replace(/^\+?91/, ""));
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
    setTimeout(() => { setSent(false); setError(null); setStep(known ? 2 : 1); setReference(null); }, 300);
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
      setReference(data.reference ?? null);
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
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
                  <CheckCircle2 className="h-9 w-9" />
                </span>
                <h4 className="mt-5 text-xl font-bold text-brand-navy">💬 Enquiry received!</h4>
                <p className="mt-2 max-w-sm text-sm text-ink-muted">
                  Thanks, {fullName.split(" ")[0] || "traveller"}. We&apos;ve received your request{packageName ? ` for ${packageName}` : ""}.
                </p>
                {reference && (
                  <div className="mt-4 rounded-xl bg-brand-blueLight/60 px-4 py-2.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-brand-blue">Enquiry ID</span>
                    <p className="text-lg font-extrabold tracking-wide text-brand-navy">{reference}</p>
                  </div>
                )}
                <p className="mt-3 max-w-sm text-sm text-ink-muted">
                  An ExpertzTrip travel specialist will review your request and contact you on {phone}{email ? ` and ${email}` : ""}.
                </p>

                {packageSlug && (
                  <div className="mt-5 w-full rounded-2xl border border-brand-orange/25 bg-brand-orangeLight/40 p-3.5">
                    <p className="text-sm font-semibold text-brand-navy">Want to book instead?</p>
                    <Link href={`/packages/${packageSlug}`} onClick={close} className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand-orange px-5 text-sm font-bold text-white transition-colors hover:bg-brand-orangeDark">
                      Book this holiday <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}

                <a
                  href={whatsappLink(waMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 font-semibold text-white transition-colors hover:brightness-95"
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
                {known && (
                  <div className="flex items-center gap-2.5 rounded-xl bg-surface-muted/60 px-3.5 py-2.5 text-sm">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-blueLight text-brand-blue"><User className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-brand-navy">{fullName}</span>
                      <span className="block truncate text-xs text-ink-muted">{email || `+91 ${phone}`}</span>
                    </span>
                    <button type="button" onClick={() => { setStep(1); setError(null); }} className="shrink-0 text-xs font-semibold text-brand-blue hover:underline">Edit</button>
                  </div>
                )}
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
