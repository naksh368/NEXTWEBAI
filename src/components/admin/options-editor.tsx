"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addOptionAction, deleteOptionAction } from "@/app/admin/(panel)/packages/actions";
import { formatDelta } from "@/lib/utils";

type Opt = { id: string; category: string; label: string; priceDelta: number; isDefault: boolean };
const CATS = ["HOTEL", "FLIGHT", "TRANSFER", "MEAL", "ACTIVITY", "ADDON"] as const;

export function OptionsEditor({ versionId, options }: { versionId: string; options: Opt[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [n, setN] = useState({ category: "HOTEL", label: "", priceDelta: 0, isDefault: false });
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => start(async () => { const r = await fn(); if (!r.ok) setError(r.error ?? "Failed."); else { setError(null); router.refresh(); } });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        {options.map((o) => (
          <div key={o.id} className="flex items-center justify-between gap-2 rounded-lg border border-surface-border px-3 py-2 text-sm">
            <span><span className="text-xs font-semibold text-ink-faint">{o.category}{o.isDefault ? " · default" : ""}</span> — {o.label}</span>
            <span className="flex items-center gap-3">
              <span className="font-semibold tabular-nums">{o.priceDelta === 0 ? "Included" : formatDelta(o.priceDelta)}</span>
              <button onClick={() => run(() => deleteOptionAction(o.id))} disabled={pending} className="text-ink-faint hover:text-danger" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
            </span>
          </div>
        ))}
        {options.length === 0 && <p className="text-sm text-ink-muted">No customization options yet.</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-surface-border p-3">
        <select value={n.category} onChange={(e) => setN({ ...n, category: e.target.value })} className="h-9 rounded-lg border border-surface-border px-2 text-sm">
          {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input value={n.label} onChange={(e) => setN({ ...n, label: e.target.value })} placeholder="Label (e.g. 5★ upgrade)" className="h-9 min-w-[160px] flex-1 rounded-lg border border-surface-border px-3 text-sm" />
        <input type="number" value={n.priceDelta} onChange={(e) => setN({ ...n, priceDelta: parseInt(e.target.value || "0", 10) })} placeholder="₹ diff" className="h-9 w-28 rounded-lg border border-surface-border px-3 text-sm" />
        <label className="flex items-center gap-1.5 text-sm font-medium"><input type="checkbox" checked={n.isDefault} onChange={(e) => setN({ ...n, isDefault: e.target.checked })} className="h-4 w-4 accent-brand-blue" /> Default</label>
        <Button size="sm" variant="outline" disabled={pending || !n.label.trim()} onClick={() => run(async () => { const r = await addOptionAction(versionId, n); if (r.ok) setN({ ...n, label: "", priceDelta: 0 }); return r; })}><Plus className="h-4 w-4" /> Add</Button>
      </div>
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}
