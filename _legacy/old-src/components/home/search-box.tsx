"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Search, MapPin, TrendingUp } from "lucide-react";

const FALLBACK_POPULAR = ["Dubai", "Bali", "Maldives", "Thailand", "Singapore", "Europe"];

/**
 * Single primary search — countries, cities or holiday packages.
 * On focus it opens a Google-style recommendations panel: popular destinations
 * when the box is empty, live-filtered matches as the customer types.
 */
export function SearchBox({ suggestions = [], popular }: { suggestions?: string[]; popular?: string[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const popularList = (popular && popular.length ? popular : FALLBACK_POPULAR).slice(0, 8);

  function submit(term?: string) {
    const value = (term ?? q).trim();
    setOpen(false);
    router.push(value ? `/packages?q=${encodeURIComponent(value)}` : "/packages");
  }

  // What the dropdown shows: matches while typing, else popular destinations.
  const matches = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return suggestions.filter((s) => s.toLowerCase().includes(term)).slice(0, 8);
  }, [q, suggestions]);

  const showingPopular = q.trim() === "";
  const items = showingPopular ? popularList : matches;

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
    else if (e.key === "Enter" && active >= 0 && items[active]) { e.preventDefault(); submit(items[active]); }
    else if (e.key === "Escape") { setOpen(false); }
  }

  return (
    <div className="w-full">
      <div className="relative">
      <form
        onSubmit={(e) => { e.preventDefault(); submit(); }}
        className="flex flex-col gap-2 rounded-2xl border border-surface-border bg-white p-2 shadow-cardHover sm:flex-row sm:items-center"
        role="search"
      >
        <div className="flex flex-1 items-center gap-2 px-3">
          <Search className="h-5 w-5 shrink-0 text-ink-faint" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(-1); setOpen(true); }}
            onFocus={() => { if (blurTimer.current) clearTimeout(blurTimer.current); setOpen(true); }}
            onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 120); }}
            onKeyDown={onKeyDown}
            placeholder="Search countries, cities or holiday packages"
            aria-label="Search countries, cities or holiday packages"
            aria-expanded={open}
            role="combobox"
            aria-controls="home-search-suggestions"
            autoComplete="off"
            className="h-12 w-full bg-transparent text-[15px] text-ink placeholder:text-ink-faint focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-orange px-8 font-semibold text-white transition-colors hover:bg-brand-orangeDark active:scale-[0.98]"
        >
          <Search className="h-4 w-4 sm:hidden" />
          Search
        </button>
      </form>

      {/* Google-style recommendations — anchored right under the search box */}
      {open && items.length > 0 && (
        <div
          id="home-search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 max-h-[min(60vh,340px)] overflow-y-auto rounded-2xl border border-surface-border bg-white text-left shadow-cardHover"
        >
          <p className="flex items-center gap-1.5 px-4 pt-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            {showingPopular ? <><TrendingUp className="h-3.5 w-3.5" /> Popular destinations</> : "Destinations"}
          </p>
          <ul className="py-1.5">
            {items.map((name, i) => (
              <li key={name}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active === i}
                  // onMouseDown fires before the input's onBlur, so the click always lands.
                  onMouseDown={(e) => { e.preventDefault(); submit(name); }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm ${active === i ? "bg-brand-blueLight text-brand-blue" : "text-ink hover:bg-surface-muted/60"}`}
                >
                  <MapPin className={`h-4 w-4 shrink-0 ${active === i ? "text-brand-blue" : "text-brand-orange"}`} />
                  <span className="font-medium">{name}</span>
                </button>
              </li>
            ))}
            {!showingPopular && (
              <li>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); submit(); }}
                  className="flex w-full items-center gap-2.5 border-t border-surface-border px-4 py-2.5 text-left text-sm text-ink-muted hover:bg-surface-muted/60"
                >
                  <Search className="h-4 w-4 shrink-0 text-ink-faint" />
                  Search for &ldquo;<span className="font-medium text-ink">{q.trim()}</span>&rdquo;
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span className="text-sm font-medium text-ink-muted">Popular:</span>
        {popularList.map((p) => (
          <button
            key={p}
            onClick={() => submit(p)}
            className="rounded-full border border-surface-border bg-white px-4 py-1.5 text-sm font-medium text-ink transition-colors hover:border-brand-blue hover:text-brand-blue"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
