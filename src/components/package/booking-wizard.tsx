"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  X, ArrowLeft, ArrowRight, Search, MapPin, ChevronLeft, ChevronRight,
  Users, Plus, Minus, Loader2, ShieldCheck, CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEPARTURE_CITIES } from "@/lib/constants";
import { formatINR, formatDate, cn } from "@/lib/utils";
import type { Pax } from "@/components/package/travellers-selector";
import { paxSummary } from "@/components/package/travellers-selector";
import type { PriceBreakdown } from "@/lib/pricing";

export type WizardDeparture = { date: string; seatsLeft: number | null };

type Props = {
  packageSlug: string;
  packageName: string;
  versionId: string;
  basePrice: number;
  minTravellers: number;
  maxTravellers: number;
  departureCities?: string[] | null;
  departures?: WizardDeparture[];
  nights: number;
  days: number;
  buttonLabel?: string;
  buttonClassName?: string;
};

const STEPS = ["Departure city", "Departure date", "Travellers & rooms", "Review"] as const;

const PRESETS: { label: string; pax: Pax }[] = [
  { label: "2 Adults", pax: { adults: 2, children: 0, childrenAges: [], infants: 0, rooms: 1 } },
  { label: "2 Adults, 1 Child", pax: { adults: 2, children: 1, childrenAges: [6], infants: 0, rooms: 1 } },
  { label: "3 Adults", pax: { adults: 3, children: 0, childrenAges: [], infants: 0, rooms: 1 } },
  { label: "2 Adults, 2 Children", pax: { adults: 2, children: 2, childrenAges: [6, 8], infants: 0, rooms: 1 } },
  { label: "3 Adults, 1 Child", pax: { adults: 3, children: 1, childrenAges: [6], infants: 0, rooms: 1 } },
  { label: "4 Adults", pax: { adults: 4, children: 0, childrenAges: [], infants: 0, rooms: 2 } },
];

const fmtKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const sameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export function BookNowButton(props: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="lg"
        variant="orange"
        className={cn("w-full", props.buttonClassName)}
      >
        {props.buttonLabel ?? "Book now"} <ArrowRight className="h-4 w-4" />
      </Button>
      {mounted && open && createPortal(<Wizard {...props} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function Wizard({ onClose, ...props }: Props & { onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const cities = useMemo(() => {
    const base = (props.departureCities ?? []).filter(Boolean);
    const merged = [...new Set([...base, ...DEPARTURE_CITIES])];
    return merged;
  }, [props.departureCities]);

  const [city, setCity] = useState<string>("");
  const [cityQuery, setCityQuery] = useState("");
  const [date, setDate] = useState<string>("");
  const [pax, setPax] = useState<Pax>({ adults: Math.max(2, props.minTravellers), children: 0, childrenAges: [], infants: 0, rooms: 1 });
  const [custom, setCustom] = useState(false);

  // Price (fetched on the review step) — consistent with server-side reprice.
  const [breakdown, setBreakdown] = useState<PriceBreakdown | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  const travellers = pax.adults + pax.children;

  // Date bounds: 3-day lead time, up to 12 months out.
  const bounds = useMemo(() => {
    const min = new Date(); min.setHours(0, 0, 0, 0); min.setDate(min.getDate() + 3);
    const max = new Date(); max.setHours(0, 0, 0, 0); max.setDate(max.getDate() + 365);
    return { min, max };
  }, []);
  const [viewMonth, setViewMonth] = useState<Date>(startOfMonth(bounds.min));

  const seatsByDate = useMemo(() => {
    const m = new Map<string, number | null>();
    for (const d of props.departures ?? []) {
      // normalise ISO → yyyy-mm-dd
      const key = d.date.slice(0, 10);
      m.set(key, d.seatsLeft);
    }
    return m;
  }, [props.departures]);

  const filteredCities = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => c.toLowerCase().includes(q));
  }, [cities, cityQuery]);

  const fetchPrice = useCallback(async () => {
    setPriceLoading(true); setPriceError(null);
    try {
      const res = await fetch("/api/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId: props.versionId, travellerCount: travellers, selectedOptionIds: [], departureId: null, couponCode: null }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { setPriceError(data.error ?? "Couldn't calculate the price."); return; }
      setBreakdown(data.breakdown as PriceBreakdown);
    } catch {
      setPriceError("Couldn't reach the server. Please retry.");
    } finally {
      setPriceLoading(false);
    }
  }, [props.versionId, travellers]);

  useEffect(() => {
    if (step === 3) fetchPrice();
  }, [step, fetchPrice]);

  function next() { setStep((s) => Math.min(STEPS.length - 1, s + 1)); }
  function back() { if (step === 0) onClose(); else setStep((s) => s - 1); }

  function chooseCity(c: string) { setCity(c); setStep(1); }
  function chooseDate(key: string) { setDate(key); setStep(2); }
  function choosePreset(p: Pax) { setPax(p); setCustom(false); }

  function goToCheckout() {
    const params = new URLSearchParams();
    params.set("travellers", String(travellers));
    params.set("adults", String(pax.adults));
    if (pax.children > 0) { params.set("children", String(pax.children)); params.set("childrenAges", pax.childrenAges.join(",")); }
    if (pax.infants > 0) params.set("infants", String(pax.infants));
    if (pax.rooms > 1) params.set("rooms", String(pax.rooms));
    if (date) params.set("date", date);
    if (city) params.set("city", city);
    router.push(`/packages/${props.packageSlug}/checkout?${params.toString()}`);
  }

  // Build the month grid.
  const monthCells = useMemo(() => {
    const first = startOfMonth(viewMonth);
    const startPad = first.getDay(); // 0=Sun
    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    return cells;
  }, [viewMonth]);

  const canPrevMonth = !sameMonth(viewMonth, bounds.min) && viewMonth > startOfMonth(bounds.min);
  const canNextMonth = viewMonth < startOfMonth(bounds.max);

  const primaryDisabled =
    (step === 0 && !city) ||
    (step === 1 && !date) ||
    (step === 3 && (priceLoading || !!priceError || !breakdown));

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/50 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Book this holiday">
      <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-3xl">
        {/* Header + progress */}
        <div className="shrink-0 border-b border-surface-border px-5 pb-0 pt-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={back} className="inline-flex items-center gap-1 text-sm font-semibold text-ink-muted hover:text-ink">
              <ArrowLeft className="h-4 w-4" /> {step === 0 ? "Close" : "Back"}
            </button>
            <p className="truncate text-sm font-bold text-brand-navy">{STEPS[step]}</p>
            <button type="button" onClick={onClose} aria-label="Close" className="text-ink-muted hover:text-ink"><X className="h-5 w-5" /></button>
          </div>
          <div className="mt-3 flex gap-1.5 pb-4">
            {STEPS.map((_, i) => (
              <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= step ? "bg-brand-orange" : "bg-surface-border")} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {/* STEP 0 — City */}
          {step === 0 && (
            <div>
              <h3 className="text-lg font-bold text-brand-navy">Where will you fly from?</h3>
              <p className="mt-1 text-sm text-ink-muted">Pick your departure city — our team confirms departures from anywhere in India.</p>
              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                <input
                  autoFocus
                  value={cityQuery}
                  onChange={(e) => setCityQuery(e.target.value)}
                  placeholder="Search your city"
                  className="w-full rounded-xl border-2 border-brand-blue/40 bg-white py-3 pl-10 pr-3 text-sm font-medium focus:border-brand-blue focus:outline-none"
                />
              </div>
              <div className="mt-3 max-h-[46vh] space-y-1 overflow-y-auto sm:max-h-72">
                {filteredCities.map((c) => (
                  <button key={c} type="button" onClick={() => chooseCity(c)}
                    className={cn("flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                      city === c ? "border-brand-blue bg-brand-blueLight/60 text-brand-blue" : "border-transparent hover:border-surface-border hover:bg-surface-muted/60")}>
                    <MapPin className="h-4 w-4 shrink-0 text-brand-orange" /> {c}, IN
                  </button>
                ))}
                {cityQuery.trim() && !filteredCities.some((c) => c.toLowerCase() === cityQuery.trim().toLowerCase()) && (
                  <button type="button" onClick={() => chooseCity(cityQuery.trim())}
                    className="flex w-full items-center gap-3 rounded-xl border border-dashed border-surface-border px-4 py-3 text-left text-sm font-medium text-ink-muted hover:border-brand-blue hover:text-brand-blue">
                    <MapPin className="h-4 w-4 shrink-0" /> Use &ldquo;{cityQuery.trim()}&rdquo;
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 1 — Date */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-bold text-brand-navy">Choose your departure date</h3>
              <p className="mt-1 text-sm text-ink-muted">Any day in the next 12 months — from {city}.</p>
              <div className="mt-4 rounded-2xl border border-surface-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <button type="button" onClick={() => canPrevMonth && setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                    disabled={!canPrevMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border text-brand-blue disabled:opacity-30" aria-label="Previous month">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <p className="text-base font-bold text-brand-navy">{viewMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
                  <button type="button" onClick={() => canNextMonth && setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                    disabled={!canNextMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border text-brand-blue disabled:opacity-30" aria-label="Next month">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-ink-faint">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="py-1">{d}</div>)}
                </div>
                <div className="mt-1 grid grid-cols-7 gap-1">
                  {monthCells.map((cell, i) => {
                    if (!cell) return <div key={i} />;
                    const key = fmtKey(cell);
                    const inRange = cell >= bounds.min && cell <= bounds.max;
                    const seats = seatsByDate.get(key);
                    const selected = date === key;
                    return (
                      <button key={i} type="button" disabled={!inRange} onClick={() => chooseDate(key)}
                        className={cn(
                          "flex min-h-[46px] flex-col items-center justify-center rounded-lg border text-sm transition-colors",
                          !inRange ? "cursor-not-allowed border-transparent text-ink-faint/50" :
                          selected ? "border-brand-blue bg-brand-blueLight text-brand-blue" :
                          "border-transparent text-ink hover:border-brand-blue/40 hover:bg-surface-muted/60"
                        )}>
                        <span className="font-semibold">{cell.getDate()}</span>
                        {inRange && seats != null && seats > 0 && (
                          <span className="text-[9px] font-bold uppercase text-success">{seats} left</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              {date && (
                <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-brand-navy">
                  <CalendarDays className="h-4 w-4 text-brand-blue" /> Departing {formatDate(date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                </p>
              )}
            </div>
          )}

          {/* STEP 2 — Travellers */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-bold text-brand-navy">Who&apos;s travelling?</h3>
              <p className="mt-1 text-sm text-ink-muted">Choose a room configuration, or set your own.</p>
              {!custom ? (
                <>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {PRESETS.map((p) => {
                      const active = !custom && paxSummary(pax) === paxSummary(p.pax);
                      return (
                        <button key={p.label} type="button" onClick={() => choosePreset(p.pax)}
                          className={cn("flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3 text-center transition-colors",
                            active ? "border-brand-blue bg-brand-blueLight/50" : "border-surface-border hover:border-brand-blue/50")}>
                          <Users className={cn("h-5 w-5", active ? "text-brand-blue" : "text-ink-muted")} />
                          <span className="text-sm font-semibold text-brand-navy">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <button type="button" onClick={() => setCustom(true)} className="mt-4 text-sm font-semibold text-brand-blue hover:underline">
                    + Custom (more travellers, infants, rooms)
                  </button>
                </>
              ) : (
                <div className="mt-4 divide-y divide-surface-border rounded-2xl border border-surface-border px-4">
                  <CounterRow label="Adults" hint="18+ years" value={pax.adults} min={1}
                    max={Math.max(1, props.maxTravellers - pax.children)} onChange={(v) => setPax({ ...pax, adults: v })} />
                  <CounterRow label="Children" hint="2–17 years" value={pax.children} min={0}
                    max={Math.max(0, props.maxTravellers - pax.adults)}
                    onChange={(v) => { const ages = [...pax.childrenAges]; while (ages.length < v) ages.push(6); ages.length = v; setPax({ ...pax, children: v, childrenAges: ages }); }} />
                  <CounterRow label="Infants" hint="Under 2 years" value={pax.infants} min={0} max={pax.adults} onChange={(v) => setPax({ ...pax, infants: v })} />
                  <CounterRow label="Rooms" hint="Hotel rooms" value={pax.rooms} min={1} max={Math.max(1, pax.adults)} onChange={(v) => setPax({ ...pax, rooms: v })} />
                  {pax.children > 0 && (
                    <div className="py-3">
                      <p className="mb-2 text-xs font-semibold text-ink-muted">Age of each child (at time of travel)</p>
                      <div className="grid grid-cols-2 gap-2">
                        {pax.childrenAges.map((age, i) => (
                          <label key={i} className="flex items-center gap-2 text-sm">
                            <span className="shrink-0 text-xs text-ink-muted">Child {i + 1}</span>
                            <select value={age} onChange={(e) => { const a = [...pax.childrenAges]; a[i] = Number(e.target.value); setPax({ ...pax, childrenAges: a }); }}
                              className="h-9 flex-1 rounded-lg border border-surface-border bg-white px-2 text-sm focus:border-brand-blue focus:outline-none">
                              {Array.from({ length: 16 }, (_, n) => n + 2).map((n) => <option key={n} value={n}>{n} yrs</option>)}
                            </select>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <button type="button" onClick={() => setCustom(false)} className="w-full py-3 text-left text-sm font-semibold text-brand-blue hover:underline">
                    ← Back to quick picks
                  </button>
                </div>
              )}
              <p className="mt-4 rounded-xl bg-surface-muted/60 px-3 py-2 text-sm font-medium text-brand-navy">Selected: {paxSummary(pax)}</p>
            </div>
          )}

          {/* STEP 3 — Review */}
          {step === 3 && (
            <div>
              <h3 className="text-lg font-bold text-brand-navy">Review your holiday</h3>
              <p className="mt-1 text-sm text-ink-muted">{props.packageName}</p>
              <dl className="mt-4 space-y-2.5 rounded-2xl border border-surface-border p-4 text-sm">
                <Line term="Duration" val={`${props.nights}N / ${props.days}D`} />
                <Line term="Departure city" val={city} />
                <Line term="Departure date" val={date ? formatDate(date, { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "—"} />
                <Line term="Travellers" val={paxSummary(pax)} />
              </dl>

              <div className="mt-4 rounded-2xl border border-surface-border bg-surface-muted/40 p-4">
                {priceLoading ? (
                  <div className="flex items-center gap-2 text-sm text-ink-muted"><Loader2 className="h-4 w-4 animate-spin" /> Calculating your price…</div>
                ) : priceError ? (
                  <div className="text-sm text-danger">{priceError}<button onClick={fetchPrice} className="ml-2 font-semibold underline">Retry</button></div>
                ) : breakdown ? (
                  <>
                    <div className="space-y-1.5">
                      {breakdown.items.map((it, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-ink-muted">{it.label}</span>
                          <span className={cn("font-medium tabular-nums", it.amount < 0 ? "text-success" : "text-ink")}>{formatINR(it.amount)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-surface-border pt-2.5">
                      <span className="font-semibold text-brand-navy">Total</span>
                      <span className="text-xl font-extrabold text-brand-navy tabular-nums">{formatINR(breakdown.total)}</span>
                    </div>
                    <p className="text-right text-xs text-ink-muted">for {travellers} traveller{travellers > 1 ? "s" : ""}, incl. taxes</p>
                  </>
                ) : null}
              </div>
              <p className="mt-3 flex items-start gap-2 text-xs text-ink-muted">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-blue" />
                Next you&apos;ll enter each traveller&apos;s details (date of birth, PAN and passport where needed), then pay securely. No charge until you pay.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-surface-border px-5 py-4 sm:px-6">
          {step < 3 ? (
            <Button onClick={next} size="lg" variant="orange" className="w-full" disabled={primaryDisabled}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={goToCheckout} size="lg" variant="orange" className="w-full" disabled={primaryDisabled}>
              Continue to traveller details <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Line({ term, val }: { term: string; val: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-muted">{term}</dt>
      <dd className="font-semibold text-brand-navy">{val || "—"}</dd>
    </div>
  );
}

function CounterRow({ label, hint, value, min, max, onChange }: { label: string; hint: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="font-semibold text-brand-navy">{label}</p>
        <p className="text-xs text-ink-muted">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-surface-border text-brand-blue transition-colors hover:border-brand-blue disabled:opacity-40" aria-label={`Decrease ${label}`}>
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-6 text-center text-lg font-bold tabular-nums">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-surface-border text-brand-blue transition-colors hover:border-brand-blue disabled:opacity-40" aria-label={`Increase ${label}`}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
