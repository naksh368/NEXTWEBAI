"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Wallet, Sparkles, Users, Search } from "lucide-react";

const THEMES = [
  { value: "", label: "Any style" },
  { value: "HONEYMOON", label: "Honeymoon" },
  { value: "FAMILY", label: "Family" },
  { value: "LUXURY", label: "Luxury" },
  { value: "BEACH", label: "Beach" },
  { value: "ADVENTURE", label: "Adventure" },
  { value: "GROUP", label: "Group" },
];
const BUDGETS = [
  { value: "", label: "Any budget" },
  { value: "50000", label: "Under ₹50,000" },
  { value: "100000", label: "₹50,000 – ₹1L" },
  { value: "200000", label: "₹1L – ₹2L" },
  { value: "999999999", label: "₹2L+" },
];

/** Combined "Build my holiday" search → /packages with match scoring. */
export function BuildMyHoliday({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [budget, setBudget] = useState("");
  const [theme, setTheme] = useState("");
  const [travellers, setTravellers] = useState("2");

  function go(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams({ build: "1" });
    if (destination.trim()) p.set("destination", destination.trim());
    if (theme) p.set("theme", theme);
    if (budget) p.set("budget", budget);
    if (travellers) p.set("travellers", travellers);
    router.push(`/packages?${p.toString()}`);
  }

  const field = "h-11 w-full rounded-xl border border-surface-border bg-white pl-9 pr-3 text-sm font-medium text-brand-navy focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15";

  return (
    <form onSubmit={go} className={`grid gap-3 rounded-2xl border border-surface-border bg-white p-3 shadow-card ${compact ? "sm:grid-cols-2 lg:grid-cols-5" : "sm:grid-cols-2 lg:grid-cols-5"}`}>
      <label className="relative block">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-orange" />
        <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Where to?" className={field} />
      </label>
      <label className="relative block">
        <Wallet className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <select value={budget} onChange={(e) => setBudget(e.target.value)} className={field}>
          {BUDGETS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
        </select>
      </label>
      <label className="relative block">
        <Sparkles className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <select value={theme} onChange={(e) => setTheme(e.target.value)} className={field}>
          {THEMES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </label>
      <label className="relative block">
        <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input type="number" min={1} max={20} value={travellers} onChange={(e) => setTravellers(e.target.value)} placeholder="Travellers" className={field} />
      </label>
      <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-orange px-5 font-bold text-white transition-colors hover:bg-brand-orangeDark">
        <Search className="h-4 w-4" /> Find my holiday
      </button>
    </form>
  );
}
