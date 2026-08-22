"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus, Users, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Pax = {
  adults: number;
  children: number;
  childrenAges: number[];
  infants: number;
  rooms: number;
};

export const DEFAULT_PAX: Pax = { adults: 2, children: 0, childrenAges: [], infants: 0, rooms: 1 };

export function paxSummary(p: Pax): string {
  const parts = [`${p.adults} Adult${p.adults > 1 ? "s" : ""}`];
  if (p.children > 0) parts.push(`${p.children} Child${p.children > 1 ? "ren" : ""}`);
  if (p.infants > 0) parts.push(`${p.infants} Infant${p.infants > 1 ? "s" : ""}`);
  if (p.rooms > 1) parts.push(`${p.rooms} Rooms`);
  return parts.join(" · ");
}

function Row({ label, hint, value, min, max, onChange }: { label: string; hint: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
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

export function TravellersSelector({ value, onChange, maxTravellers = 12 }: { value: Pax; onChange: (p: Pax) => void; maxTravellers?: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click (desktop popover).
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const totalSeats = value.adults + value.children; // priced travellers (infants excluded)
  const canAddMore = totalSeats < maxTravellers;

  function set(patch: Partial<Pax>) {
    onChange({ ...value, ...patch });
  }
  function setChildren(n: number) {
    const ages = [...value.childrenAges];
    while (ages.length < n) ages.push(6);
    ages.length = n;
    set({ children: n, childrenAges: ages });
  }

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-surface-border bg-white px-3.5 py-3 text-left transition-colors hover:border-brand-blue focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15">
        <span className="flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-blue" />
          <span className="text-sm font-semibold text-brand-navy">{paxSummary(value)}</span>
        </span>
        <span className="text-xs text-ink-muted">Edit</span>
      </button>

      {open && (
        <>
          {/* Mobile scrim */}
          <div className="fixed inset-0 z-40 bg-black/40 sm:hidden" onClick={() => setOpen(false)} aria-hidden />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-3xl border border-surface-border bg-white p-5 shadow-2xl animate-fade-in sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:right-0 sm:top-full sm:mt-2 sm:max-h-none sm:rounded-2xl sm:p-4">
            <div className="mb-1 flex items-center justify-between sm:hidden">
              <p className="text-base font-bold text-brand-navy">Travellers &amp; rooms</p>
            </div>
            <div className="divide-y divide-surface-border">
              <Row label="Adults" hint="18+ years" value={value.adults} min={1} max={canAddMore ? value.adults + 1 : value.adults} onChange={(v) => set({ adults: v })} />
              <Row label="Children" hint="2–17 years" value={value.children} min={0} max={canAddMore ? value.children + 1 : value.children} onChange={setChildren} />
              <Row label="Infants" hint="Under 2 years" value={value.infants} min={0} max={value.adults} onChange={(v) => set({ infants: v })} />
              <Row label="Rooms" hint="Hotel rooms" value={value.rooms} min={1} max={Math.max(1, value.adults)} onChange={(v) => set({ rooms: v })} />
            </div>

            {value.children > 0 && (
              <div className="mt-3 rounded-xl bg-surface-muted/60 p-3">
                <p className="mb-2 text-xs font-semibold text-ink-muted">Age of each child (at time of travel)</p>
                <div className="grid grid-cols-2 gap-2">
                  {value.childrenAges.map((age, i) => (
                    <label key={i} className="flex items-center gap-2 text-sm">
                      <span className="shrink-0 text-xs text-ink-muted">Child {i + 1}</span>
                      <select value={age} onChange={(e) => { const a = [...value.childrenAges]; a[i] = Number(e.target.value); set({ childrenAges: a }); }}
                        className="h-9 flex-1 rounded-lg border border-surface-border bg-white px-2 text-sm focus:border-brand-blue focus:outline-none">
                        {Array.from({ length: 16 }, (_, n) => n + 2).map((n) => <option key={n} value={n}>{n} yrs</option>)}
                      </select>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {value.infants > 0 && (
              <p className="mt-2 text-xs text-ink-muted">Infants under 2 typically travel on a parent&apos;s lap and are not counted as a paid seat — our team confirms infant fares.</p>
            )}

            <button type="button" onClick={() => setOpen(false)}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-blue font-semibold text-white transition-colors hover:bg-brand-blueDark">
              <Check className="h-4 w-4" /> Done
            </button>
          </div>
        </>
      )}
    </div>
  );
}
