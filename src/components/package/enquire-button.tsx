"use client";

import { useState } from "react";
import { MessageCircle, Phone, X, Send, CheckCircle2, Loader2, Minus, Plus } from "lucide-react";
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

function Stepper({ label, hint, value, min, onChange }: { label: string; hint: string; value: number; min: number; onChange: (v: number) => void }) {
  return (
    <div className="rounded-xl border border-surface-border p-2.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-navy">{label}</p>
          <p className="text-[11px] text-ink-faint">{hint}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border disabled:opacity-40" aria-label={`Decrease ${label}`}>
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-5 text-center text-sm font-bold tabular-nums">{value}</span>
          <button type="button" onClick={() => onChange(Math.min(99, value + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border" aria-label={`Increase ${label}`}>
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

const TRAVEL_TYPES = ["Family", "Couple", "Honeymoon", "Friends", "Solo", "Luxury", "Adventure"];
const HOTEL_CATEGORIES = ["Any", "3 Star", "4 Star", "5 Star"];
const ROOM_TYPES = ["Twin Sharing", "Triple Sharing", "Single Room"];
const FLIGHT_TYPES = ["Domestic", "International", "Not required"];
const CALL_TIMES = ["Anytime", "10 AM – 12 PM", "12 – 2 PM", "2 – 4 PM", "4 – 6 PM", "After 6 PM"];

export function EnquireButton({
  packageName,
  packageSlug,
  className,
  variant = "outline",
  label = "Enquire now",
  size = "md",
}: EnquireButtonProps) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [destination, setDestination] = useState(packageName ?? "");
  const [travelDate, setTravelDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [roomType, setRoomType] = useState<string>("Twin Sharing");
  const [flightType, setFlightType] = useState<string>("Domestic");
  const [travelType, setTravelType] = useState<string>("");
  const [hotelCategory, setHotelCategory] = useState<string>("Any");
  const [preferredTime, setPreferredTime] = useState<string>("Anytime");
  const [message, setMessage] = useState("");

  const waMessage = packageName
    ? `Hi ExpertzTrip 👋\n\nI'm interested in the "${packageName}" holiday. Please help me with dates, pricing and what's included.`
    : `Hi ExpertzTrip 👋\n\nI'd like help planning a holiday. Please share options and pricing.`;

  function close() {
    setOpen(false);
    // reset success after close so re-open shows the form again
    setTimeout(() => { setSent(false); setError(null); }, 300);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName, phone, email, destination,
          packageSlug: packageSlug ?? undefined,
          packageName: packageName ?? undefined,
          travelDate, travellers: adults + children, adults, children,
          roomType, flightType,
          travelType, hotelCategory, preferredTime, message,
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

  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
      active ? "border-brand-blue bg-brand-blue text-white" : "border-surface-border bg-white text-ink hover:border-brand-blue/50"
    );

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn(base, sizes, styles, className)}>
        <MessageCircle className="h-4 w-4" /> {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="my-0 w-full max-w-lg rounded-t-3xl bg-white shadow-2xl animate-fade-in sm:my-8 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-surface-border p-5 sm:p-6">
              <div>
                <h3 className="text-xl font-extrabold text-brand-navy">Create my holiday</h3>
                <p className="mt-1 text-sm text-ink-muted">
                  {packageName ? `Enquiring about "${packageName}".` : "Tell us your plan"} — our experts reply fast. No login needed.
                </p>
              </div>
              <button onClick={close} aria-label="Close" className="-mr-1 -mt-1 rounded-lg p-1 text-ink-muted hover:bg-surface-muted hover:text-ink">
                <X className="h-5 w-5" />
              </button>
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
            ) : (
              <form onSubmit={submit} className="max-h-[70vh] space-y-4 overflow-y-auto p-5 sm:p-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name *" className="h-11 rounded-xl border border-surface-border px-3.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10" />
                  <div className="flex items-center gap-2 rounded-xl border border-surface-border px-3.5 focus-within:border-brand-blue focus-within:ring-4 focus-within:ring-brand-blue/10">
                    <span className="text-sm font-semibold text-ink-muted">+91</span>
                    <input required type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))} placeholder="Mobile *" className="h-11 w-full bg-transparent text-sm focus:outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="h-11 rounded-xl border border-surface-border px-3.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10" />
                  <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Destination" className="h-11 rounded-xl border border-surface-border px-3.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10" />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-muted">Travel date</label>
                  <input type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} className="h-11 w-full rounded-xl border border-surface-border px-3.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10" />
                </div>

                {/* Travellers — adults & children */}
                <div className="grid grid-cols-2 gap-3">
                  <Stepper label="Adults" hint="12+ yrs" value={adults} min={1} onChange={setAdults} />
                  <Stepper label="Children" hint="2–11 yrs" value={children} min={0} onChange={setChildren} />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Room type</label>
                  <div className="flex flex-wrap gap-2">
                    {ROOM_TYPES.map((r) => (
                      <button type="button" key={r} onClick={() => setRoomType(r)} className={chip(roomType === r)}>{r}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Flights</label>
                  <div className="flex flex-wrap gap-2">
                    {FLIGHT_TYPES.map((f) => (
                      <button type="button" key={f} onClick={() => setFlightType(f)} className={chip(flightType === f)}>{f}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Type of holiday</label>
                  <div className="flex flex-wrap gap-2">
                    {TRAVEL_TYPES.map((t) => (
                      <button type="button" key={t} onClick={() => setTravelType(travelType === t ? "" : t)} className={chip(travelType === t)}>{t}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Preferred hotel category</label>
                  <div className="flex flex-wrap gap-2">
                    {HOTEL_CATEGORIES.map((h) => (
                      <button type="button" key={h} onClick={() => setHotelCategory(h)} className={chip(hotelCategory === h)}>{h}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Preferred time to call</label>
                  <div className="flex flex-wrap gap-2">
                    {CALL_TIMES.map((t) => (
                      <button type="button" key={t} onClick={() => setPreferredTime(t)} className={chip(preferredTime === t)}>{t}</button>
                    ))}
                  </div>
                </div>

                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Anything specific? (optional)" className="w-full rounded-xl border border-surface-border px-3.5 py-2.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10" />

                {error && <p className="text-sm font-medium text-danger">{error}</p>}

                <button type="submit" disabled={loading} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-orange text-base font-bold text-white transition-colors hover:bg-brand-orangeDark disabled:opacity-60">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Create My Holiday"}
                </button>

                {/* Quick contact */}
                <div className="flex items-center gap-3 pt-1">
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
        </div>
      )}
    </>
  );
}
