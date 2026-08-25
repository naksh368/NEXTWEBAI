"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Search, Plane, Users } from "lucide-react";
import { AIRPORTS } from "@/data/airports";
import { Field, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Trip = "oneway" | "roundtrip";

export function FlightSearchCard({
  compact = false,
}: {
  compact?: boolean;
}) {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip>("roundtrip");
  const [from, setFrom] = useState("DEL");
  const [to, setTo] = useState("DXB");
  const [depart, setDepart] = useState("2026-09-18");
  const [ret, setRet] = useState("2026-09-24");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [cabin, setCabin] = useState("Economy");

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const search = () => {
    const p = new URLSearchParams({
      from,
      to,
      depart,
      trip,
      adults: String(adults),
      children: String(children),
      cabin,
    });
    if (trip === "roundtrip") p.set("ret", ret);
    router.push(`/flights/results?${p.toString()}`);
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-surface-border bg-white p-5 shadow-card sm:p-6",
        compact && "p-4 sm:p-4",
      )}
    >
      {/* Trip type */}
      <div className="mb-5 flex items-center gap-2">
        {(["roundtrip", "oneway"] as Trip[]).map((t) => (
          <button
            key={t}
            onClick={() => setTrip(t)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-bold transition-colors",
              trip === t
                ? "bg-blue-50 text-blue"
                : "text-ink-muted hover:bg-surface-muted",
            )}
          >
            {t === "roundtrip" ? "Round Trip" : "One Way"}
          </button>
        ))}
        <span className="ml-auto hidden items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 text-xs font-bold text-ink-muted sm:flex">
          <Plane size={13} className="text-blue" /> Flights only
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-12">
        {/* From / To with swap */}
        <div className="relative grid gap-3 sm:grid-cols-2 lg:col-span-5">
          <Field label="From">
            <Select value={from} onChange={(e) => setFrom(e.target.value)}>
              {AIRPORTS.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.city} ({a.code})
                </option>
              ))}
            </Select>
          </Field>
          <button
            onClick={swap}
            aria-label="Swap origin and destination"
            className="absolute left-1/2 top-[2.1rem] z-10 hidden h-8 w-8 -translate-x-1/2 place-items-center rounded-full border border-surface-border bg-white text-blue shadow-sm hover:bg-blue-50 sm:grid"
          >
            <ArrowLeftRight size={15} />
          </button>
          <Field label="To">
            <Select value={to} onChange={(e) => setTo(e.target.value)}>
              {AIRPORTS.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.city} ({a.code})
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {/* Dates */}
        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-4">
          <Field label="Departure">
            <input
              type="date"
              value={depart}
              onChange={(e) => setDepart(e.target.value)}
              className="h-11 w-full rounded-lg border border-surface-border bg-white px-3.5 text-sm font-semibold text-ink outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10"
            />
          </Field>
          <Field label="Return">
            <input
              type="date"
              value={ret}
              disabled={trip === "oneway"}
              onChange={(e) => setRet(e.target.value)}
              className="h-11 w-full rounded-lg border border-surface-border bg-white px-3.5 text-sm font-semibold text-ink outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-faint"
            />
          </Field>
        </div>

        {/* Travellers + cabin */}
        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-3">
          <Field label="Travellers">
            <Select
              value={`${adults}-${children}`}
              onChange={(e) => {
                const [a, c] = e.target.value.split("-").map(Number);
                setAdults(a);
                setChildren(c);
              }}
            >
              <option value="1-0">1 Adult</option>
              <option value="2-0">2 Adults</option>
              <option value="2-1">2 Adults, 1 Child</option>
              <option value="3-0">3 Adults</option>
              <option value="4-0">4 Adults</option>
            </Select>
          </Field>
          <Field label="Cabin">
            <Select value={cabin} onChange={(e) => setCabin(e.target.value)}>
              <option>Economy</option>
              <option>Premium Economy</option>
              <option>Business</option>
            </Select>
          </Field>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="hidden items-center gap-1.5 text-xs text-ink-faint sm:flex">
          <Users size={13} /> Indicative fares — availability confirmed at booking.
        </p>
        <Button onClick={search} variant="accent" size="lg" className="ml-auto w-full sm:w-auto">
          <Search size={18} /> Search Flights
        </Button>
      </div>
    </div>
  );
}
