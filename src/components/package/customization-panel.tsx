"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Loader2, Tag, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR, formatDelta, formatDate, cn } from "@/lib/utils";
import type { PriceBreakdown } from "@/lib/pricing";

export type OptionVM = {
  id: string; category: string; groupKey: string; label: string;
  description?: string | null; priceDelta: number; perPerson: boolean; isDefault: boolean;
};
export type DepartureVM = { id: string; date: string; priceDelta: number };

export type CustomizationProps = {
  versionId: string;
  packageSlug: string;
  basePrice: number;
  currency: string;
  minTravellers: number;
  maxTravellers: number;
  allow: { hotel: boolean; flight: boolean; transfer: boolean; meal: boolean; activity: boolean; addons: boolean; date: boolean };
  options: OptionVM[];
  departures: DepartureVM[];
};

const GROUP_META: Record<string, { title: string; multi: boolean; allowKey: keyof CustomizationProps["allow"] }> = {
  HOTEL: { title: "Hotel", multi: false, allowKey: "hotel" },
  FLIGHT: { title: "Flights", multi: false, allowKey: "flight" },
  TRANSFER: { title: "Transfers", multi: false, allowKey: "transfer" },
  MEAL: { title: "Meal plan", multi: false, allowKey: "meal" },
  ACTIVITY: { title: "Add activities", multi: true, allowKey: "activity" },
  ADDON: { title: "Add-ons", multi: true, allowKey: "addons" },
};

const CATEGORY_ORDER = ["HOTEL", "FLIGHT", "TRANSFER", "MEAL", "ACTIVITY", "ADDON"];

export function CustomizationPanel(props: CustomizationProps) {
  const router = useRouter();

  // Default exclusive selections
  const initialSelected = useMemo(() => {
    const ids: string[] = [];
    const byGroup = new Map<string, OptionVM[]>();
    for (const o of props.options) {
      if (!byGroup.has(o.groupKey)) byGroup.set(o.groupKey, []);
      byGroup.get(o.groupKey)!.push(o);
    }
    for (const [, opts] of byGroup) {
      const isExclusive = opts.every((o) => o.category !== "ACTIVITY" && o.category !== "ADDON");
      if (isExclusive) {
        const def = opts.find((o) => o.isDefault) ?? opts[0];
        if (def) ids.push(def.id);
      }
    }
    return ids;
  }, [props.options]);

  const [travellers, setTravellers] = useState(Math.max(2, props.minTravellers));
  const [selected, setSelected] = useState<string[]>(initialSelected);

  // Free calendar — the customer picks any day in the next 12 months.
  const dateBounds = useMemo(() => {
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const min = new Date(); min.setDate(min.getDate() + 3);   // 3-day lead time
    const max = new Date(); max.setDate(max.getDate() + 365); // up to 1 year out
    const def = new Date(); def.setDate(def.getDate() + 14);
    return { min: fmt(min), max: fmt(max), def: fmt(def) };
  }, []);
  const [travelDate, setTravelDate] = useState(dateBounds.def);
  const departureId = null; // fixed departures replaced by the free calendar

  const [breakdown, setBreakdown] = useState<PriceBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, OptionVM[]>();
    for (const o of props.options) {
      if (!map.has(o.groupKey)) map.set(o.groupKey, []);
      map.get(o.groupKey)!.push(o);
    }
    return map;
  }, [props.options]);

  const reprice = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          versionId: props.versionId,
          travellerCount: travellers,
          selectedOptionIds: selected,
          departureId,
          couponCode: null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Couldn't update the price. Please try again.");
        return;
      }
      setBreakdown(data.breakdown as PriceBreakdown);
      setCouponMessage(data.couponMessage ?? null);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError("Couldn't reach the server. Please retry.");
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, [props.versionId, travellers, selected, departureId]);

  // Debounced reprice on any change
  useEffect(() => {
    const t = setTimeout(reprice, 250);
    return () => clearTimeout(t);
  }, [reprice]);

  function toggleOption(opt: OptionVM) {
    setSelected((prev) => {
      const meta = GROUP_META[opt.category];
      if (meta?.multi) {
        return prev.includes(opt.id) ? prev.filter((id) => id !== opt.id) : [...prev, opt.id];
      }
      // exclusive: replace others in the same group
      const groupIds = new Set((groups.get(opt.groupKey) ?? []).map((o) => o.id));
      return [...prev.filter((id) => !groupIds.has(id)), opt.id];
    });
  }

  function continueToBook() {
    const params = new URLSearchParams();
    params.set("travellers", String(travellers));
    if (selected.length) params.set("options", selected.join(","));
    if (travelDate) params.set("date", travelDate);
    router.push(`/packages/${props.packageSlug}/checkout?${params.toString()}`);
  }

  return (
    <div className="space-y-5">
      {/* Travellers */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-navy">Travellers</p>
          <p className="text-xs text-ink-muted">Price is per person</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTravellers((t) => Math.max(props.minTravellers, t - 1))}
            disabled={travellers <= props.minTravellers}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border disabled:opacity-40"
            aria-label="Decrease travellers"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-6 text-center font-semibold tabular-nums">{travellers}</span>
          <button
            onClick={() => setTravellers((t) => Math.min(props.maxTravellers, t + 1))}
            disabled={travellers >= props.maxTravellers}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border disabled:opacity-40"
            aria-label="Increase travellers"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Departure date — free calendar, any day in the next 12 months */}
      <div>
        <p className="mb-2 text-sm font-semibold text-brand-navy">Choose departure date</p>
        <div className="rounded-xl border border-surface-border bg-white p-1.5 focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-brand-blue/20">
          <input
            type="date"
            value={travelDate}
            min={dateBounds.min}
            max={dateBounds.max}
            onChange={(e) => setTravelDate(e.target.value)}
            aria-label="Departure date"
            className="w-full rounded-lg bg-transparent px-3 py-2 text-sm font-semibold text-brand-navy focus:outline-none"
          />
        </div>
        <p className="mt-1.5 text-xs text-ink-muted">
          {travelDate ? `Departing ${formatDate(travelDate, { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · ` : ""}
          pick any day in the next 12 months.
        </p>
      </div>

      {/* Option groups — one heading per category (exclusive = radios, additive = checkboxes) */}
      {CATEGORY_ORDER.map((category) => {
        const meta = GROUP_META[category];
        if (!meta || !props.allow[meta.allowKey]) return null;
        const opts = props.options.filter((o) => o.category === category);
        if (opts.length === 0) return null;
        // hide single-option exclusive groups with no upgrades
        if (!meta.multi && opts.length <= 1) return null;
        return (
          <div key={category}>
            <p className="mb-2 text-sm font-semibold text-brand-navy">{meta.title}</p>
            <div className="space-y-2">
              {opts.map((o) => {
                const isSelected = selected.includes(o.id);
                return (
                  <label
                    key={o.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                      isSelected ? "border-brand-blue bg-brand-blueLight/50" : "border-surface-border hover:border-brand-blue/50"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border",
                        meta.multi ? "rounded-md" : "rounded-full",
                        isSelected ? "border-brand-blue bg-brand-blue text-white" : "border-surface-border"
                      )}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <input
                      type={meta.multi ? "checkbox" : "radio"}
                      name={o.groupKey}
                      checked={isSelected}
                      onChange={() => toggleOption(o)}
                      className="sr-only"
                    />
                    <span className="flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-ink">{o.label}</span>
                        <span className={cn("text-sm font-semibold", o.priceDelta > 0 ? "text-brand-navy" : "text-success")}>
                          {o.priceDelta === 0 ? "Included" : formatDelta(o.priceDelta)}
                        </span>
                      </span>
                      {o.description && <span className="mt-0.5 block text-xs text-ink-muted">{o.description}</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Offers auto-apply — no code to enter */}
      {couponMessage && breakdown && breakdown.discount > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-[#E7F6EC] px-3 py-2 text-sm font-medium text-success">
          <Tag className="h-4 w-4" /> {couponMessage}
        </div>
      )}

      {/* Breakdown */}
      <div className="rounded-xl border border-surface-border bg-surface-muted/50 p-4">
        <p className="mb-3 text-sm font-semibold text-brand-navy">Price breakdown</p>
        {error ? (
          <div className="text-sm text-danger">
            {error}
            <button onClick={reprice} className="ml-2 font-semibold underline">Retry</button>
          </div>
        ) : !breakdown ? (
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Calculating…
          </div>
        ) : (
          <div className={cn("space-y-2 transition-opacity", loading && "opacity-60")}>
            {breakdown.items.map((it, i) => (
              <div key={i} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink-muted">{it.label}</span>
                <span className={cn("font-medium tabular-nums", it.amount < 0 ? "text-success" : "text-ink")}>
                  {it.kind === "BASE" ? formatINR(it.amount) : formatDelta(it.amount)}
                </span>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-surface-border pt-3">
              <span className="font-semibold text-brand-navy">Total</span>
              <span className="text-xl font-bold text-brand-navy tabular-nums">{formatINR(breakdown.total)}</span>
            </div>
            <p className="text-right text-xs text-ink-muted">for {travellers} traveller{travellers > 1 ? "s" : ""}, incl. taxes</p>
          </div>
        )}
      </div>

      <Button onClick={continueToBook} size="lg" variant="orange" className="w-full" disabled={!breakdown || !!error}>
        Continue to book <ArrowRight className="h-4 w-4" />
      </Button>
      <p className="text-center text-xs text-ink-muted">
        Prices are confirmed on our servers before payment. No charge until you pay.
      </p>
    </div>
  );
}
