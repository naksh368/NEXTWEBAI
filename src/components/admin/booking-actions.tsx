"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BOOKING_STATUS_META } from "@/lib/constants";
import { updateBookingStatusAction, updateComponentStatusAction, addBookingNoteAction, assignBookingAction, setSupplierCostAction } from "@/app/admin/(panel)/actions";
import { formatINR } from "@/lib/utils";

export function BookingStatusControl({ bookingId, current, allowed }: { bookingId: string; current: string; allowed: string[] }) {
  const router = useRouter();
  const [to, setTo] = useState(allowed[0] ?? "");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (allowed.length === 0) {
    return <p className="text-sm text-ink-muted">No further status changes available from <strong>{BOOKING_STATUS_META[current]?.label ?? current}</strong>.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <select value={to} onChange={(e) => setTo(e.target.value)} className="h-10 flex-1 rounded-xl border border-surface-border bg-white px-3 text-sm">
          {allowed.map((s) => <option key={s} value={s}>{BOOKING_STATUS_META[s]?.label ?? s}</option>)}
        </select>
        <Button size="sm" loading={pending} onClick={() => {
          setError(null);
          start(async () => {
            const r = await updateBookingStatusAction(bookingId, to, note || undefined);
            if (!r.ok) setError(r.error); else { setNote(""); router.refresh(); }
          });
        }}>Update status</Button>
      </div>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note (shown on timeline)"
        className="h-10 w-full rounded-xl border border-surface-border px-3 text-sm" />
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}

export function ComponentStatusControl({ bookingId, component, status }: { bookingId: string; component: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <select defaultValue={status} disabled={pending}
        onChange={(e) => start(async () => {
          const r = await updateComponentStatusAction(bookingId, component, e.target.value);
          if (r.ok) { setSaved(true); router.refresh(); setTimeout(() => setSaved(false), 1500); }
        })}
        className="h-9 rounded-lg border border-surface-border bg-white px-2 text-sm">
        {["PENDING", "CONFIRMED", "FAILED"].map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      {pending && <Loader2 className="h-4 w-4 animate-spin text-ink-faint" />}
      {saved && <Check className="h-4 w-4 text-success" />}
    </div>
  );
}

export function AssignSpecialistControl({ bookingId, current, staff }: { bookingId: string; current: string | null; staff: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select defaultValue={current ?? ""} disabled={pending}
          onChange={(e) => { setError(null); start(async () => {
            const r = await assignBookingAction(bookingId, e.target.value);
            if (!r.ok) setError(r.error); else { setSaved(true); router.refresh(); setTimeout(() => setSaved(false), 1500); }
          }); }}
          className="h-10 flex-1 rounded-xl border border-surface-border bg-white px-3 text-sm">
          <option value="">Unassigned</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {pending && <Loader2 className="h-4 w-4 animate-spin text-ink-faint" />}
        {saved && <Check className="h-4 w-4 text-success" />}
      </div>
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}

export function SupplierCostControl({ bookingId, customerPrice, supplierCost }: { bookingId: string; customerPrice: number; supplierCost: number | null }) {
  const router = useRouter();
  const [value, setValue] = useState(supplierCost != null ? String(supplierCost) : "");
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  const cost = value.trim() === "" ? null : Number(value);
  const margin = cost != null ? customerPrice - cost : null;
  const marginPct = cost != null && customerPrice > 0 ? Math.round((margin! / customerPrice) * 1000) / 10 : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm"><span className="text-ink-muted">Customer price</span><span className="font-semibold tabular-nums">{formatINR(customerPrice)}</span></div>
      <div className="flex items-center gap-2">
        <label className="flex-1 text-sm">
          <span className="mb-1 block text-ink-muted">Supplier cost (₹)</span>
          <input type="number" min={0} value={value} onChange={(e) => { setValue(e.target.value); setSaved(false); }} placeholder="cost of goods"
            className="h-10 w-full rounded-xl border border-surface-border px-3 text-sm focus:border-brand-blue focus:outline-none" />
        </label>
        <button type="button" disabled={pending} onClick={() => start(async () => { const r = await setSupplierCostAction(bookingId, cost); if (r.ok) { setSaved(true); router.refresh(); } })}
          className="mt-6 inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-blue px-3 text-sm font-semibold text-white hover:bg-brand-blueDark disabled:opacity-60">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null} Save
        </button>
      </div>
      {margin != null && (
        <div className="rounded-xl bg-surface-muted/60 p-3 text-sm">
          <div className="flex items-center justify-between"><span className="text-ink-muted">Gross margin</span><span className={`font-bold tabular-nums ${margin >= 0 ? "text-success" : "text-danger"}`}>{formatINR(margin)}</span></div>
          {marginPct != null && <div className="mt-0.5 flex items-center justify-between"><span className="text-ink-muted">Margin %</span><span className="font-semibold tabular-nums">{marginPct}%</span></div>}
        </div>
      )}
    </div>
  );
}

export function AddNoteForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!note.trim()) return; start(async () => { const r = await addBookingNoteAction(bookingId, note); if (r.ok) { setNote(""); router.refresh(); } }); }}
      className="flex flex-col gap-2 sm:flex-row">
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note…" className="h-10 flex-1 rounded-xl border border-surface-border px-3 text-sm" />
      <Button size="sm" variant="outline" loading={pending} type="submit">Add note</Button>
    </form>
  );
}
