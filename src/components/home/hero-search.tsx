"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Plane, CalendarDays, Users, Wallet, Search } from "lucide-react";
import { DEPARTURE_CITIES } from "@/lib/constants";

const BUDGET_BANDS = [
  { v: "", label: "Any budget" },
  { v: "50000", label: "Under ₹50k" },
  { v: "100000", label: "₹50k – ₹1L" },
  { v: "200000", label: "₹1L – ₹2L" },
  { v: "999999999", label: "₹2L +" },
];

/** Premium multi-field homepage search: From · To · Dates · Travellers · Budget. */
export function HeroSearch({ destinations }: { destinations: string[] }) {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [travellers, setTravellers] = useState("2");
  const [budget, setBudget] = useState("");
  const [budgetMode, setBudgetMode] = useState<"pp" | "total">("pp");
  const today = new Date().toLocaleDateString("en-CA");

  function go(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams({ build: "1" });
    if (to.trim()) p.set("destination", to.trim());
    if (from.trim()) p.set("from", from.trim());
    if (date) p.set("date", date);
    if (travellers) p.set("travellers", travellers);
    if (budget) {
      let perPerson = Number(budget);
      if (budgetMode === "total") perPerson = Math.round(perPerson / Math.max(1, Number(travellers) || 1));
      if (Number.isFinite(perPerson) && perPerson > 0) p.set("budget", String(perPerson));
    }
    router.push(`/packages?${p.toString()}`);
  }

  const field = "h-12 w-full rounded-xl border border-surface-border bg-white pl-10 pr-3 text-sm font-medium text-brand-navy focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15";
  const icon = "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2";

  return (
    <form onSubmit={go} className="rounded-2xl border border-surface-border bg-white p-2.5 shadow-cardHover">
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-12">
        <label className="relative md:col-span-3">
          <Plane className={`${icon} text-brand-orange`} />
          <input list="hero-cities" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From (city)" className={field} aria-label="Departure city" />
          <datalist id="hero-cities">{DEPARTURE_CITIES.map((c) => <option key={c} value={c} />)}</datalist>
        </label>
        <label className="relative md:col-span-3">
          <MapPin className={`${icon} text-brand-orange`} />
          <input list="hero-destinations" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Where to?" className={field} aria-label="Destination" />
          <datalist id="hero-destinations">{destinations.map((d) => <option key={d} value={d} />)}</datalist>
        </label>
        <label className="relative md:col-span-2">
          <CalendarDays className={`${icon} text-ink-faint`} />
          <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className={field} aria-label="Travel date" />
        </label>
        <label className="relative md:col-span-2">
          <Users className={`${icon} text-ink-faint`} />
          <input type="number" min={1} max={20} value={travellers} onChange={(e) => setTravellers(e.target.value)} className={field} aria-label="Travellers" />
        </label>
        <label className="relative md:col-span-2">
          <Wallet className={`${icon} text-ink-faint`} />
          <select value={budget} onChange={(e) => setBudget(e.target.value)} className={field} aria-label="Budget">
            {BUDGET_BANDS.map((b) => <option key={b.v} value={b.v}>{b.label}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        {budget ? (
          <div className="inline-flex overflow-hidden rounded-lg border border-surface-border text-xs font-semibold">
            {(["pp", "total"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setBudgetMode(m)} className={`px-3 py-1.5 transition-colors ${budgetMode === m ? "bg-brand-blue text-white" : "text-ink-muted hover:text-ink"}`}>
                {m === "pp" ? "Per person" : "Total trip"}
              </button>
            ))}
          </div>
        ) : <span />}
        <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-orange px-8 font-bold text-white transition-colors hover:bg-brand-orangeDark active:scale-[0.98]">
          <Search className="h-4 w-4" /> Find holidays
        </button>
      </div>
    </form>
  );
}
