"use client";

import { useState } from "react";
import { Search, Plane, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/utils";

type Offer = {
  id: string; airline: string; flightNumber: string; departTime: string; arriveTime: string;
  stops: number; cabin: string; total: number;
};

export function FlightSearch() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [tripType, setTripType] = useState<"ONEWAY" | "ROUND">("ONEWAY");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ configured: boolean; offers: Offer[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    setError(null); setBusy(true); setResult(null);
    try {
      const res = await fetch("/api/agent/flights/search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination, departDate, tripType, adults: 1 }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setResult({ configured: j.configured, offers: j.offers });
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
        <div className="mb-4 flex gap-2">
          {(["ONEWAY", "ROUND"] as const).map((t) => (
            <button key={t} onClick={() => setTripType(t)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tripType === t ? "bg-brand-blueLight text-brand-blue" : "text-ink-muted"}`}>
              {t === "ONEWAY" ? "One way" : "Round trip"}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">From</label>
            <Input value={origin} onChange={(e) => setOrigin(e.target.value.toUpperCase())} placeholder="DEL" maxLength={3} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">To</label>
            <Input value={destination} onChange={(e) => setDestination(e.target.value.toUpperCase())} placeholder="BOM" maxLength={3} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Departure</label>
            <Input type="date" value={departDate} onChange={(e) => setDepartDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button className="w-full" loading={busy} onClick={search} disabled={!origin || !destination || !departDate}>
              <Search size={17} /> Search
            </Button>
          </div>
        </div>
      </div>

      {error && <div className="rounded-xl border border-danger/20 bg-[#FCE9E9] px-4 py-3 text-sm font-medium text-danger">{error}</div>}

      {result && !result.configured && (
        <div className="rounded-2xl border border-surface-border bg-white p-8 text-center shadow-card">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-blueLight text-brand-blue"><Info size={22} /></span>
          <h3 className="mt-4 text-lg font-bold">Live flight search is being onboarded</h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-muted">
            No flight supplier is connected to this environment yet, so we can&apos;t show live fares. We never display placeholder or fake fares. Your wallet, bookings and reports are fully live — flight inventory switches on the moment a supplier is configured.
          </p>
        </div>
      )}

      {result?.configured && result.offers.length === 0 && (
        <div className="rounded-2xl border border-dashed border-surface-border bg-surface-muted/40 p-10 text-center">
          <p className="text-sm font-semibold text-ink">No flights found for this route and date</p>
          <p className="mt-0.5 text-xs text-ink-muted">Try a different date or nearby airports.</p>
        </div>
      )}

      {result?.configured && result.offers.length > 0 && (
        <div className="space-y-3">
          {result.offers.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-4 rounded-xl border border-surface-border bg-white p-4 shadow-card">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blueLight text-brand-blue"><Plane size={18} /></span>
                <div>
                  <p className="text-sm font-bold">{o.airline} {o.flightNumber}</p>
                  <p className="text-xs text-ink-faint">{o.departTime} → {o.arriveTime} · {o.stops === 0 ? "Non-stop" : `${o.stops} stop`}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-extrabold text-brand-blue">{formatINR(o.total)}</p>
                <Button size="sm" variant="orange">Select</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
