"use client";

import { createContext, useContext, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Star, ShieldCheck, Archive, Eye, EyeOff, X, Copy } from "lucide-react";
import { bulkPackageAction, deletePackageAction, duplicatePackageAction } from "@/app/admin/(panel)/packages/actions";

// ── Selection context (shared across the table) ─────────────
type Ctx = { selected: Set<string>; toggle: (id: string) => void; setMany: (ids: string[], on: boolean) => void; clear: () => void };
const SelectionCtx = createContext<Ctx | null>(null);
function useSelection() {
  const c = useContext(SelectionCtx);
  if (!c) throw new Error("useSelection must be used within BulkProvider");
  return c;
}

export function BulkProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const setMany = (ids: string[], on: boolean) => setSelected((s) => { const n = new Set(s); ids.forEach((id) => on ? n.add(id) : n.delete(id)); return n; });
  const clear = () => setSelected(new Set());
  return <SelectionCtx.Provider value={{ selected, toggle, setMany, clear }}>{children}</SelectionCtx.Provider>;
}

export function RowSelect({ id }: { id: string }) {
  const { selected, toggle } = useSelection();
  return (
    <input
      type="checkbox"
      checked={selected.has(id)}
      onChange={() => toggle(id)}
      className="h-4 w-4 cursor-pointer rounded border-surface-border text-brand-blue focus:ring-brand-blue"
      aria-label="Select package"
    />
  );
}

export function SelectAll({ ids }: { ids: string[] }) {
  const { selected, setMany } = useSelection();
  const allOn = ids.length > 0 && ids.every((i) => selected.has(i));
  return (
    <input
      type="checkbox"
      checked={allOn}
      onChange={() => setMany(ids, !allOn)}
      className="h-4 w-4 cursor-pointer rounded border-surface-border text-brand-blue focus:ring-brand-blue"
      aria-label="Select all packages on this page"
    />
  );
}

/** Floating action bar — appears when one or more packages are selected. */
export function BulkBar() {
  const { selected, clear } = useSelection();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  if (selected.size === 0) return null;
  const ids = [...selected];

  const run = (op: Parameters<typeof bulkPackageAction>[1], confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setMsg(null);
    start(async () => {
      const r = await bulkPackageAction(ids, op);
      if (!r.ok) { setMsg(r.error); return; }
      clear();
      router.refresh();
    });
  };

  const btn = "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50";

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-fit max-w-[95vw] flex-wrap items-center gap-2 rounded-2xl border border-surface-border bg-white px-3 py-2.5 shadow-cardHover">
      <span className="inline-flex items-center gap-2 pl-1 pr-2 text-sm font-bold text-brand-navy">
        {pending && <Loader2 className="h-4 w-4 animate-spin text-brand-blue" />}
        {selected.size} selected
      </span>
      <button disabled={pending} onClick={() => run("publish")} className={`${btn} bg-[#E7F6EC] text-success hover:brightness-95`}><Eye className="h-3.5 w-3.5" /> Publish</button>
      <button disabled={pending} onClick={() => run("draft")} className={`${btn} bg-surface-muted text-ink-muted hover:brightness-95`}><EyeOff className="h-3.5 w-3.5" /> Draft</button>
      <button disabled={pending} onClick={() => run("feature")} className={`${btn} bg-brand-orangeLight text-brand-orangeDark hover:brightness-95`}><Star className="h-3.5 w-3.5" /> Feature</button>
      <button disabled={pending} onClick={() => run("check")} className={`${btn} bg-brand-blueLight text-brand-blue hover:brightness-95`}><ShieldCheck className="h-3.5 w-3.5" /> Check</button>
      <button disabled={pending} onClick={() => run("archive", `Archive ${selected.size} package(s)? They'll be hidden from the site.`)} className={`${btn} bg-surface-muted text-ink hover:brightness-95`}><Archive className="h-3.5 w-3.5" /> Archive</button>
      <button disabled={pending} onClick={() => run("delete", `Permanently delete ${selected.size} package(s)? This cannot be undone. Packages with bookings are skipped.`)} className={`${btn} bg-[#FCE9E9] text-danger hover:brightness-95`}><Trash2 className="h-3.5 w-3.5" /> Delete</button>
      {msg && <span className="max-w-[240px] text-xs text-danger">{msg}</span>}
      <button onClick={clear} className="ml-1 rounded-lg p-1.5 text-ink-faint hover:bg-surface-muted" aria-label="Clear selection"><X className="h-4 w-4" /></button>
    </div>
  );
}

/** Per-row duplicate — clones the package as a draft and opens it for editing. */
export function DuplicatePackage({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => { setErr(null); start(async () => {
          const r = await duplicatePackageAction(id);
          if (r.ok) router.push(`/admin/packages/${r.packageId}/edit`);
          else setErr(r.error);
        }); }}
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-brand-blue"
        title={err ?? "Duplicate as draft"}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      {err && <span className="ml-1 text-xs text-danger" title={err}>!</span>}
    </>
  );
}

/** Per-row permanent delete with confirmation. */
export function DeletePackage({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Permanently delete “${name}”? This cannot be undone.`)) return;
          setErr(null);
          start(async () => {
            const r = await deletePackageAction(id);
            if (!r.ok) setErr(r.error);
            else router.refresh();
          });
        }}
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-danger"
        title={err ?? "Delete permanently"}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </button>
      {err && <span className="ml-1 text-xs text-danger" title={err}>!</span>}
    </>
  );
}
