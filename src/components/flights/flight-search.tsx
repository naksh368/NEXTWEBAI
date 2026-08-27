"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plane, ArrowRight, Search, X, Loader2, Check, Clock, AlertTriangle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { formatINR } from "@/lib/utils";

type Offer = {
  token: string; supplier: string; origin: string; destination: string; departDate: string;
  airline: string; airlineCode: string; flightNumber: string; departTime: string; arriveTime: string;
  durationMins: number; stops: number; cabin: string; baseFare: number; taxes: number; totalFare: number;
  currency: string; seatsLeft: number; illustrative: boolean;
};
type Pax = { firstName: string; lastName: string; type: "ADULT" | "CHILD" | "INFANT" };

const selectCls = "h-11 w-full rounded-xl border border-surface-border bg-white px-3.5 text-[15px] text-ink focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10";
const dur = (m: number) => `${Math.floor(m / 60)}h ${m % 60}m`;
const todayISO = () => new Date().toISOString().slice(0, 10);

export function FlightSearch({ walletAvailable }: { walletAvailable: number }) {
  const router = useRouter();
  const [from, setFrom] = useState("DEL");
  const [to, setTo] = useState("BOM");
  const [date, setDate] = useState(todayISO());
  const [pax, setPax] = useState(1);
  const [cabin, setCabin] = useState("ECONOMY");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<Offer[] | null>(null);

  const [selected, setSelected] = useState<Offer | null>(null);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true); setError(null); setOffers(null);
    try {
      const res = await fetch("/api/agent/flights/search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: from, destination: to, departDate: date, pax, cabin }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) { setError(json.error ?? "Search failed."); return; }
      setOffers(json.offers as Offer[]);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {/* Search form */}
      <form onSubmit={search} className="rounded-2xl border border-surface-border bg-white p-4 shadow-card sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
          <Field label="From" htmlFor="from"><Input id="from" value={from} onChange={(e) => setFrom(e.target.value.toUpperCase())} placeholder="DEL" maxLength={4} /></Field>
          <Field label="To" htmlFor="to"><Input id="to" value={to} onChange={(e) => setTo(e.target.value.toUpperCase())} placeholder="BOM" maxLength={4} /></Field>
          <Field label="Depart" htmlFor="date"><Input id="date" type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Pax" htmlFor="pax">
            <select id="pax" className={selectCls} value={pax} onChange={(e) => setPax(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <div className="flex items-end">
            <Button type="submit" variant="primary" loading={busy} className="h-11 w-full md:w-auto">
              <Search className="h-4 w-4" /> Search
            </Button>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
          <select className="rounded-lg border border-surface-border bg-white px-2 py-1 text-xs" value={cabin} onChange={(e) => setCabin(e.target.value)}>
            <option value="ECONOMY">Economy</option><option value="PREMIUM_ECONOMY">Premium Economy</option><option value="BUSINESS">Business</option><option value="FIRST">First</option>
          </select>
          <span className="inline-flex items-center gap-1"><Wallet className="h-3.5 w-3.5 text-brand-blue" /> Wallet: <b className="text-brand-navy">{formatINR(walletAvailable)}</b></span>
        </div>
      </form>

      {error && <div className="mt-4 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-medium text-danger">{error}</div>}

      {/* Results */}
      {offers && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-muted">{offers.length} flights · {from} → {to} · {date}</p>
            <span className="rounded-full bg-brand-orangeLight px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-orange">Illustrative fares</span>
          </div>
          {offers.length === 0 ? (
            <div className="rounded-2xl border border-surface-border bg-white px-5 py-10 text-center text-sm text-ink-muted">No flights for this search.</div>
          ) : (
            <div className="space-y-3">
              {offers.map((o) => (
                <div key={o.token} className="flex flex-col gap-4 rounded-2xl border border-surface-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blueLight text-xs font-extrabold text-brand-blue">{o.airlineCode}</span>
                    <div>
                      <p className="font-bold text-brand-navy">{o.departTime} <ArrowRight className="inline h-3.5 w-3.5 text-ink-faint" /> {o.arriveTime}</p>
                      <p className="text-xs text-ink-muted">{o.airline} · {o.flightNumber} · {dur(o.durationMins)} · {o.stops === 0 ? "Non-stop" : `${o.stops} stop`}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-brand-navy">{formatINR(o.totalFare)}</p>
                      <p className="text-[11px] text-ink-faint">per traveller</p>
                    </div>
                    <Button variant="orange" size="sm" onClick={() => setSelected(o)}>Book</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selected && (
        <BookingModal
          offer={selected} pax={pax} walletAvailable={walletAvailable}
          onClose={() => setSelected(null)}
          onBooked={() => { router.refresh(); }}
        />
      )}
    </div>
  );
}

function BookingModal({ offer, pax, walletAvailable, onClose, onBooked }: {
  offer: Offer; pax: number; walletAvailable: number; onClose: () => void; onBooked: () => void;
}) {
  const total = offer.totalFare * pax;
  const insufficient = walletAvailable < total;
  const [passengers, setPassengers] = useState<Pax[]>(Array.from({ length: pax }, () => ({ firstName: "", lastName: "", type: "ADULT" })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ status: string; reference: string; id: string; pending?: boolean } | null>(null);

  const setPax_ = (i: number, k: keyof Pax, v: string) =>
    setPassengers((ps) => ps.map((p, idx) => (idx === i ? { ...p, [k]: v } : p)));

  async function confirm() {
    if (passengers.some((p) => !p.firstName.trim() || !p.lastName.trim())) { setError("Enter every traveller's name."); return; }
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/agent/flights/book", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: offer.token, passengers }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) { setError(json.error ?? "Booking failed."); setBusy(false); return; }
      setResult({ status: json.status, reference: json.reference, id: json.id, pending: json.pending });
      setBusy(false);
      onBooked();
    } catch {
      setError("Network error. Please try again."); setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-brand-navy/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-surface-border bg-white p-6 shadow-cardHover">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-lg p-1 text-ink-muted hover:bg-surface-muted"><X className="h-5 w-5" /></button>

        {result ? (
          <div className="py-2 text-center">
            {result.status === "TICKETED" ? (
              <>
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success"><Check className="h-7 w-7" /></span>
                <h3 className="mt-4 text-xl font-extrabold text-brand-navy">Ticket issued</h3>
                <p className="mt-1.5 text-ink-muted">Booking <b className="text-brand-navy">{result.reference}</b> is confirmed and ticketed.</p>
              </>
            ) : (
              <>
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning/10 text-warning"><Clock className="h-7 w-7" /></span>
                <h3 className="mt-4 text-xl font-extrabold text-brand-navy">Pending verification</h3>
                <p className="mt-1.5 text-ink-muted">Booking <b className="text-brand-navy">{result.reference}</b> is confirmed; the ticket is being verified with the airline. Your funds stay on hold until it&apos;s confirmed.</p>
              </>
            )}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link href={`/dashboard/bookings/${result.id}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 font-bold text-white hover:bg-brand-blueDark">View booking</Link>
              <button onClick={onClose} className="inline-flex h-11 items-center justify-center rounded-xl border border-surface-border px-5 font-bold text-ink hover:border-brand-blue">Done</button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-extrabold text-brand-navy">Review &amp; book</h3>
            <div className="mt-3 rounded-xl border border-surface-border bg-surface-muted/50 p-3 text-sm">
              <p className="font-bold text-brand-navy">{offer.origin} → {offer.destination} · {offer.departDate}</p>
              <p className="text-ink-muted">{offer.airline} {offer.flightNumber} · {offer.departTime}–{offer.arriveTime} · {offer.stops === 0 ? "Non-stop" : `${offer.stops} stop`}</p>
            </div>

            <div className="mt-4 space-y-3">
              {passengers.map((p, i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <Input placeholder={`Traveller ${i + 1} first name`} value={p.firstName} onChange={(e) => setPax_(i, "firstName", e.target.value)} />
                  <Input placeholder="Last name" value={p.lastName} onChange={(e) => setPax_(i, "lastName", e.target.value)} />
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-surface-border p-3">
              <div>
                <p className="text-sm text-ink-muted">Total ({pax} traveller{pax > 1 ? "s" : ""})</p>
                <p className="text-xl font-extrabold text-brand-navy">{formatINR(total)}</p>
              </div>
              <div className="text-right text-xs">
                <p className="text-ink-muted">Wallet: <b className={insufficient ? "text-danger" : "text-brand-navy"}>{formatINR(walletAvailable)}</b></p>
                <p className="text-ink-faint">Debited only after ticketing</p>
              </div>
            </div>

            {insufficient && (
              <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-warning/30 bg-warning/5 px-3.5 py-2.5 text-sm text-warning">
                <span className="inline-flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> Insufficient wallet balance.</span>
                <Link href="/dashboard/wallet" className="font-bold underline">Add money</Link>
              </div>
            )}
            {error && <p className="mt-3 text-sm font-medium text-danger">{error}</p>}

            <Button variant="orange" className="mt-5 w-full" onClick={confirm} loading={busy} disabled={insufficient}>
              {busy ? <>Booking <Loader2 className="h-4 w-4 animate-spin" /></> : <><Plane className="h-4 w-4" /> Confirm &amp; pay from wallet</>}
            </Button>
            <p className="mt-2 text-center text-[11px] text-ink-faint">Funds are held now and debited only when the airline confirms ticketing. No ticket is shown unless issuance succeeds.</p>
          </>
        )}
      </div>
    </div>
  );
}
