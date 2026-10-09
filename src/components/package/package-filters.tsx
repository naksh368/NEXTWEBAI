"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * URL-driven package filters.
 *
 * Every control writes to the query string, so a filtered view is shareable,
 * bookmarkable and server-rendered — the results themselves are always a real
 * database query (see `listPackages`), never a client-side slice.
 */

const TIERS = [
  { value: "", label: "All categories" },
  { value: "BUDGET", label: "Budget" },
  { value: "STANDARD", label: "Standard" },
  { value: "TWO_STAR", label: "2 Star" },
  { value: "THREE_STAR", label: "3 Star" },
  { value: "FOUR_STAR", label: "4 Star" },
];

const DURATIONS = [
  { value: "", label: "Any duration" },
  { value: "0-3", label: "Up to 3 nights" },
  { value: "4-5", label: "4 – 5 nights" },
  { value: "6-7", label: "6 – 7 nights" },
  { value: "8-", label: "8 nights or more" },
];

const PRICES = [
  { value: "", label: "Any price" },
  { value: "-15000", label: "Under ₹15,000" },
  { value: "15000-20000", label: "₹15,000 – ₹20,000" },
  { value: "20000-25000", label: "₹20,000 – ₹25,000" },
  { value: "25000-35000", label: "₹25,000 – ₹35,000" },
  { value: "35000-", label: "Above ₹35,000" },
];

const GROUP_SIZES = [
  { value: "", label: "Any group size" },
  { value: "2", label: "2 travellers" },
  { value: "4", label: "4 travellers" },
  { value: "6", label: "6 travellers" },
  { value: "8", label: "8 travellers" },
  { value: "12", label: "12 or more" },
];

const SORTS = [
  { value: "popular", label: "Recommended" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "duration-asc", label: "Shortest first" },
];

export type FilterDestination = { slug: string; name: string };

export function PackageFilters({ destinations = [] }: { destinations?: FilterDestination[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [openOnMobile, setOpenOnMobile] = useState(false);

  const update = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      next.delete("page"); // any filter change returns to page 1
      const qs = next.toString();
      startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [params, pathname, router]
  );

  // Keep the local search box in step when the URL changes from elsewhere
  // (back button, a "clear filters" link) without clobbering typing.
  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  // Debounce typing → URL.
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (q === current) return;
    const t = setTimeout(() => update({ q: q || undefined }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const activeCount = useMemo(
    () => ["destination", "theme", "duration", "price", "group"].filter((k) => params.get(k)).length,
    [params]
  );

  const selectCls =
    "h-11 w-full min-w-0 rounded-xl border border-surface-border bg-white px-3 pr-8 text-sm font-semibold text-ink " +
    "focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10 sm:w-auto";

  const controls = (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
      {destinations.length > 1 && (
        <select
          className={selectCls}
          value={params.get("destination") ?? ""}
          onChange={(e) => update({ destination: e.target.value || undefined })}
          aria-label="Island"
        >
          <option value="">All islands</option>
          {destinations.map((d) => (
            <option key={d.slug} value={d.slug}>{d.name}</option>
          ))}
        </select>
      )}
      <select className={selectCls} value={params.get("theme") ?? ""} onChange={(e) => update({ theme: e.target.value || undefined })} aria-label="Hotel category">
        {TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      <select className={selectCls} value={params.get("duration") ?? ""} onChange={(e) => update({ duration: e.target.value || undefined })} aria-label="Duration">
        {DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
      </select>
      <select className={selectCls} value={params.get("price") ?? ""} onChange={(e) => update({ price: e.target.value || undefined })} aria-label="Price range">
        {PRICES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select>
      <select className={selectCls} value={params.get("group") ?? ""} onChange={(e) => update({ group: e.target.value || undefined })} aria-label="Group size">
        {GROUP_SIZES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
      </select>
      <select className={selectCls} value={params.get("sort") ?? "popular"} onChange={(e) => update({ sort: e.target.value })} aria-label="Sort by">
        {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => update({ destination: undefined, theme: undefined, duration: undefined, price: undefined, group: undefined })}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-bold text-brand-orangeDark hover:bg-brand-orangeLight"
        >
          <X className="h-4 w-4" /> Clear filters
        </button>
      )}
    </div>
  );

  return (
    <div className="rounded-2xl border border-surface-border bg-surface-muted p-3.5 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="relative w-full lg:w-[260px] lg:shrink-0">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search packages or islands"
            aria-label="Search packages"
            className="h-11 w-full rounded-xl border border-surface-border bg-white pl-10 pr-9 text-sm focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10"
          />
          {q && (
            <button onClick={() => setQ("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpenOnMobile((v) => !v)}
          aria-expanded={openOnMobile}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-surface-border bg-white px-4 text-sm font-bold text-ink lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="tabular flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-blue px-1 text-[11px] text-white">
              {activeCount}
            </span>
          )}
        </button>

        <div className="hidden min-w-0 flex-1 lg:block">{controls}</div>
      </div>

      <div className={cn("mt-3 lg:hidden", !openOnMobile && "hidden")}>{controls}</div>
    </div>
  );
}
