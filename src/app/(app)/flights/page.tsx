import Link from "next/link";
import { Plane, TrendingUp } from "lucide-react";
import { FlightSearchCard } from "@/components/app/flight-search-card";
import { inr } from "@/lib/utils";

export const metadata = { title: "Search Flights" };

const POPULAR = [
  { from: "DEL", to: "DXB", label: "Delhi → Dubai", price: 18500 },
  { from: "BOM", to: "GOI", label: "Mumbai → Goa", price: 4800 },
  { from: "BLR", to: "SIN", label: "Bengaluru → Singapore", price: 31200 },
  { from: "DEL", to: "BOM", label: "Delhi → Mumbai", price: 5200 },
  { from: "HYD", to: "BKK", label: "Hyderabad → Bangkok", price: 22400 },
  { from: "MAA", to: "CMB", label: "Chennai → Colombo", price: 12900 },
];

export default function FlightsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">Search Flights</h1>
        <p className="mt-1 text-ink-muted">
          Compare fares across the connected supplier network and book in a few clicks.
        </p>
      </div>

      <FlightSearchCard />

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-navy">
          <TrendingUp size={18} className="text-orange" /> Popular Routes
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR.map((r) => (
            <Link
              key={r.label}
              href={`/flights/results?from=${r.from}&to=${r.to}&depart=2026-09-18&trip=oneway&adults=1&children=0&cabin=Economy`}
              className="group flex items-center justify-between rounded-xl border border-surface-border bg-white p-5 shadow-card transition-shadow hover:shadow-cardHover"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue transition-colors group-hover:bg-blue group-hover:text-white">
                  <Plane size={18} />
                </span>
                <div>
                  <p className="text-sm font-bold text-navy">{r.label}</p>
                  <p className="text-xs text-ink-faint">from {inr(r.price)}</p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-blue">Search →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
