"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

const POPULAR = ["Dubai", "Bali", "Maldives", "Thailand", "Singapore", "Europe"];

/** Single primary search (Phase 5) — countries, cities or holiday packages. */
export function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(term?: string) {
    const value = (term ?? q).trim();
    router.push(value ? `/packages?q=${encodeURIComponent(value)}` : "/packages");
  }

  return (
    <div className="w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-card sm:flex-row sm:items-center"
        role="search"
      >
        <div className="flex flex-1 items-center gap-2 px-3">
          <Search className="h-5 w-5 shrink-0 text-ink-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search countries, cities or holiday packages"
            aria-label="Search countries, cities or holiday packages"
            className="h-11 w-full bg-transparent text-[15px] text-ink placeholder:text-ink-faint focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-orange px-6 font-semibold text-white transition-colors hover:bg-brand-orangeDark active:scale-[0.98]"
        >
          <Search className="h-4 w-4 sm:hidden" />
          Search
        </button>
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-sm text-white/80">Popular:</span>
        {POPULAR.map((p) => (
          <button
            key={p}
            onClick={() => submit(p)}
            className="rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/25"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
