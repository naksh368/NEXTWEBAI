"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "", label: "All styles" },
  { value: "HONEYMOON", label: "Honeymoon" },
  { value: "FAMILY", label: "Family" },
  { value: "BEACH", label: "Beach" },
  { value: "LUXURY", label: "Luxury" },
  { value: "ADVENTURE", label: "Adventure" },
];

const SORTS = [
  { value: "popular", label: "Most popular" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

const DESTINATIONS = [
  { value: "", label: "All destinations" },
  { value: "dubai", label: "Dubai" },
  { value: "bali", label: "Bali" },
  { value: "maldives", label: "Maldives" },
  { value: "thailand", label: "Thailand" },
  { value: "singapore", label: "Singapore" },
  { value: "europe", label: "Europe" },
];

/** URL-driven filters with a debounced search input (Phase 3/32). */
export function PackageFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  const update = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      next.delete("page"); // reset to page 1 on any filter change
      startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
    },
    [params, pathname, router]
  );

  // Debounce search input → URL
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (q === current) return;
    const t = setTimeout(() => update({ q: q || undefined }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const selectCls =
    "h-10 rounded-xl border border-surface-border bg-white px-3 text-sm font-medium text-ink focus:border-brand-blue focus:outline-none";

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative flex-1 lg:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search destinations or packages"
          aria-label="Search packages"
          className="h-10 w-full rounded-xl border border-surface-border bg-white pl-9 pr-9 text-sm focus:border-brand-blue focus:outline-none"
        />
        {q && (
          <button onClick={() => setQ("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className={cn("flex flex-wrap gap-2")}>
        <select className={selectCls} value={params.get("destination") ?? ""} onChange={(e) => update({ destination: e.target.value || undefined })} aria-label="Destination">
          {DESTINATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
        <select className={selectCls} value={params.get("theme") ?? ""} onChange={(e) => update({ theme: e.target.value || undefined })} aria-label="Holiday style">
          {THEMES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select className={selectCls} value={params.get("sort") ?? "popular"} onChange={(e) => update({ sort: e.target.value })} aria-label="Sort by">
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
    </div>
  );
}
