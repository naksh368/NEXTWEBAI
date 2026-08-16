"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronUp, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  addDayAction, updateDayAction, deleteDayAction, moveDayAction, addItemAction, deleteItemAction,
} from "@/app/admin/(panel)/packages/actions";
import { DAY_ITEM_KIND } from "@/lib/constants";

type Item = { id: string; timeslot: string; kind: string; title: string; description: string | null };
type Day = { id: string; dayNumber: number; title: string; summary: string | null; items: Item[] };

export function ItineraryEditor({ versionId, days }: { versionId: string; days: Day[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => start(async () => { const r = await fn(); if (r.ok) router.refresh(); });

  return (
    <div className="space-y-4">
      {days.map((day) => (
        <DayCard key={day.id} day={day} pending={pending} run={run} />
      ))}
      <Button variant="outline" size="sm" onClick={() => run(() => addDayAction(versionId))} disabled={pending}><Plus className="h-4 w-4" /> Add day</Button>
    </div>
  );
}

function DayCard({ day, pending, run }: { day: Day; pending: boolean; run: (fn: () => Promise<{ ok: boolean; error?: string }>) => void }) {
  const [title, setTitle] = useState(day.title);
  const [savedTitle, setSavedTitle] = useState(false);
  const [ni, setNi] = useState({ timeslot: "MORNING", kind: "ACTIVITY", title: "" });

  return (
    <div className="rounded-xl border border-surface-border p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white">{day.dayNumber}</span>
        <input value={title} onChange={(e) => { setTitle(e.target.value); setSavedTitle(false); }} onBlur={() => { if (title !== day.title) run(async () => { const r = await updateDayAction(day.id, title); if (r.ok) setSavedTitle(true); return r; }); }}
          className="h-9 flex-1 rounded-lg border border-surface-border px-3 text-sm font-semibold" />
        {savedTitle && <Check className="h-4 w-4 text-success" />}
        <button onClick={() => run(() => moveDayAction(day.id, "up"))} disabled={pending} className="text-ink-faint hover:text-ink" aria-label="Move up"><ChevronUp className="h-4 w-4" /></button>
        <button onClick={() => run(() => moveDayAction(day.id, "down"))} disabled={pending} className="text-ink-faint hover:text-ink" aria-label="Move down"><ChevronDown className="h-4 w-4" /></button>
        <button onClick={() => { if (confirm("Delete this day?")) run(() => deleteDayAction(day.id)); }} disabled={pending} className="text-ink-faint hover:text-danger" aria-label="Delete day"><Trash2 className="h-4 w-4" /></button>
      </div>

      <ul className="mt-3 space-y-1.5">
        {day.items.map((it) => (
          <li key={it.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface-muted/60 px-3 py-1.5 text-sm">
            <span className="min-w-0"><span className="text-xs font-semibold text-ink-faint">{it.timeslot} · {it.kind}</span> — {it.title}</span>
            <button onClick={() => run(() => deleteItemAction(it.id))} disabled={pending} className="shrink-0 text-ink-faint hover:text-danger" aria-label="Delete item"><Trash2 className="h-3.5 w-3.5" /></button>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select value={ni.timeslot} onChange={(e) => setNi({ ...ni, timeslot: e.target.value })} className="h-9 rounded-lg border border-surface-border px-2 text-sm">
          {["MORNING", "AFTERNOON", "EVENING"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={ni.kind} onChange={(e) => setNi({ ...ni, kind: e.target.value })} className="h-9 rounded-lg border border-surface-border px-2 text-sm">
          {DAY_ITEM_KIND.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input value={ni.title} onChange={(e) => setNi({ ...ni, title: e.target.value })} placeholder="Activity / note title" className="h-9 min-w-[160px] flex-1 rounded-lg border border-surface-border px-3 text-sm" />
        <Button size="sm" variant="outline" disabled={pending || !ni.title.trim()} onClick={() => run(async () => { const r = await addItemAction(day.id, ni); if (r.ok) setNi({ ...ni, title: "" }); return r; })}><Plus className="h-4 w-4" /> Add</Button>
      </div>
    </div>
  );
}
