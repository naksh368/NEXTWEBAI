"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, Info } from "lucide-react";
import type { FlightOffer } from "@/lib/types";
import { FlightCard } from "./flight-card";
import { cn } from "@/lib/utils";

type Sort = "cheapest" | "fastest" | "value" | "departure";

const SORTS: { id: Sort; label: string }[] = [
  { id: "cheapest", label: "Lowest Price" },
  { id: "fastest", label: "Fastest" },
  { id: "value", label: "Best Value" },
  { id: "departure", label: "Departure Time" },
];

export function FlightResults({
  offers,
  travellers,
}: {
  offers: FlightOffer[];
  travellers: number;
}) {
  const [sort, setSort] = useState<Sort>("cheapest");
  const [stops, setStops] = useState<"any" | "0" | "1">("any");
  const [refundableOnly, setRefundableOnly] = useState(false);
  const [airlines, setAirlines] = useState<string[]>([]);
  const [depWindow, setDepWindow] = useState<string[]>([]);
  const [minBaggage, setMinBaggage] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const allAirlines = useMemo(
    () => Array.from(new Set(offers.map((o) => o.segments[0].airline.name))).sort(),
    [offers],
  );

  const filtered = useMemo(() => {
    let list = [...offers];
    if (stops !== "any") list = list.filter((o) => o.stops === Number(stops));
    if (refundableOnly)
      list = list.filter((o) => o.fares.some((f) => f.conditions.refundable));
    if (airlines.length)
      list = list.filter((o) => airlines.includes(o.segments[0].airline.name));
    if (minBaggage)
      list = list.filter((o) =>
        o.fares.some((f) => parseInt(f.conditions.checkInBaggage) >= 20),
      );
    if (depWindow.length)
      list = list.filter((o) => {
        const h = parseInt(o.departTime.split(":")[0]);
        return depWindow.some((w) => {
          if (w === "morning") return h >= 5 && h < 12;
          if (w === "afternoon") return h >= 12 && h < 17;
          if (w === "evening") return h >= 17 && h < 21;
          return h >= 21 || h < 5;
        });
      });

    list.sort((a, b) => {
      if (sort === "cheapest") return a.fares[0].total - b.fares[0].total;
      if (sort === "fastest") return a.totalDurationMins - b.totalDurationMins;
      if (sort === "departure")
        return a.departTime.localeCompare(b.departTime);
      // best value: blend of price + duration
      const score = (o: FlightOffer) =>
        o.fares[0].total + o.totalDurationMins * 12;
      return score(a) - score(b);
    });
    return list;
  }, [offers, sort, stops, refundableOnly, airlines, depWindow, minBaggage]);

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
      {/* Filters */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="mb-3 flex w-full items-center justify-between rounded-lg border border-surface-border bg-white px-4 py-3 text-sm font-bold text-navy lg:hidden"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-blue" /> Filters
          </span>
        </button>

        <div
          className={cn(
            "space-y-5 rounded-xl border border-surface-border bg-white p-5 shadow-card",
            !showFilters && "hidden lg:block",
          )}
        >
          <FilterGroup title="Stops">
            {[
              { id: "any", label: "Any" },
              { id: "0", label: "Non-stop" },
              { id: "1", label: "1 Stop" },
            ].map((s) => (
              <label key={s.id} className="flex cursor-pointer items-center gap-2 py-1">
                <input
                  type="radio"
                  name="stops"
                  checked={stops === s.id}
                  onChange={() => setStops(s.id as typeof stops)}
                  className="accent-[#1455D9]"
                />
                <span className="text-sm font-semibold text-navy">{s.label}</span>
              </label>
            ))}
          </FilterGroup>

          <FilterGroup title="Departure Time">
            {[
              { id: "morning", label: "Morning · 5–12" },
              { id: "afternoon", label: "Afternoon · 12–17" },
              { id: "evening", label: "Evening · 17–21" },
              { id: "night", label: "Night · 21–5" },
            ].map((w) => (
              <label key={w.id} className="flex cursor-pointer items-center gap-2 py-1">
                <input
                  type="checkbox"
                  checked={depWindow.includes(w.id)}
                  onChange={() => toggle(depWindow, setDepWindow, w.id)}
                  className="accent-[#1455D9]"
                />
                <span className="text-sm font-semibold text-navy">{w.label}</span>
              </label>
            ))}
          </FilterGroup>

          <FilterGroup title="Airline">
            {allAirlines.map((a) => (
              <label key={a} className="flex cursor-pointer items-center gap-2 py-1">
                <input
                  type="checkbox"
                  checked={airlines.includes(a)}
                  onChange={() => toggle(airlines, setAirlines, a)}
                  className="accent-[#1455D9]"
                />
                <span className="text-sm font-semibold text-navy">{a}</span>
              </label>
            ))}
          </FilterGroup>

          <FilterGroup title="Fare">
            <label className="flex cursor-pointer items-center gap-2 py-1">
              <input
                type="checkbox"
                checked={refundableOnly}
                onChange={(e) => setRefundableOnly(e.target.checked)}
                className="accent-[#1455D9]"
              />
              <span className="text-sm font-semibold text-navy">Refundable only</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 py-1">
              <input
                type="checkbox"
                checked={minBaggage}
                onChange={(e) => setMinBaggage(e.target.checked)}
                className="accent-[#1455D9]"
              />
              <span className="text-sm font-semibold text-navy">Check-in ≥ 20 kg</span>
            </label>
          </FilterGroup>
        </div>
      </aside>

      {/* Results */}
      <div>
        {/* Sort bar */}
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-surface-border bg-white p-2 shadow-card">
          <span className="px-2 text-xs font-extrabold uppercase tracking-wide text-ink-faint">
            Sort
          </span>
          {SORTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSort(s.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-bold transition-colors",
                sort === s.id
                  ? "bg-blue text-white"
                  : "text-ink-muted hover:bg-surface-muted",
              )}
            >
              {s.label}
            </button>
          ))}
          <span className="ml-auto px-2 text-sm font-bold text-navy">
            {filtered.length} flights
          </span>
        </div>

        <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue">
          <Info size={14} /> Indicative fares from the connected supplier. Final price and
          seats are confirmed at booking.
        </p>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-surface-border bg-white p-10 text-center">
              <p className="font-bold text-navy">No flights match your filters</p>
              <p className="mt-1 text-sm text-ink-muted">Try widening your selection.</p>
            </div>
          ) : (
            filtered.map((o) => (
              <FlightCard key={o.id} offer={o} travellers={travellers} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[0.72rem] font-extrabold uppercase tracking-wide text-ink-muted">
        {title}
      </p>
      {children}
    </div>
  );
}
