"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Sparkles, Search, MapPin } from "lucide-react";
import { MediaUploader } from "@/components/admin/media-library";
import { createActivityAction, deleteActivityAction, harvestActivitiesAction } from "@/app/admin/(panel)/activities/actions";
import { formatINR } from "@/lib/utils";

export type ActivityRow = {
  id: string; title: string; summary: string | null; city: string | null; country: string | null;
  timeslot: string; kind: string; priceFrom: number | null; imageUrl: string | null;
};

const TIMESLOTS = ["MORNING", "AFTERNOON", "EVENING"];
const KINDS = ["ACTIVITY", "MEAL", "TRANSFER", "HOTEL", "FLIGHT", "FREE_TIME", "NOTE"];
const empty = { title: "", summary: "", city: "", country: "", timeslot: "MORNING", kind: "ACTIVITY", priceFrom: "", imageUrl: "" };

export function ActivitiesManager({ activities }: { activities: ActivityRow[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ ...empty });
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return activities;
    return activities.filter((a) => `${a.title} ${a.city ?? ""} ${a.kind}`.toLowerCase().includes(t));
  }, [q, activities]);

  const create = () => {
    setError(null); setMsg(null);
    start(async () => {
      const r = await createActivityAction({ ...form, priceFrom: form.priceFrom === "" ? null : Number(form.priceFrom) });
      if (!r.ok) { setError(r.error); return; }
      setForm({ ...empty });
      router.refresh();
    });
  };
  const harvest = () => {
    setError(null); setMsg(null);
    start(async () => {
      const r = await harvestActivitiesAction();
      if (!r.ok) { setError(r.error); return; }
      setMsg(r.added ? `Added ${r.added} activities from your packages.` : "No new activities found in your packages.");
      router.refresh();
    });
  };

  const inp = "h-10 w-full rounded-lg border border-surface-border px-3 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15";

  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="rounded-2xl border border-surface-border bg-white p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-brand-navy">Add an activity</h2>
          <button type="button" onClick={harvest} disabled={pending} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-surface-border px-3 text-xs font-bold text-brand-navy hover:border-brand-blue disabled:opacity-50">
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-brand-orange" />} Harvest from packages
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title (e.g. Uluwatu Sunset & Kecak Dance)" className={`${inp} sm:col-span-2 lg:col-span-3`} />
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City (e.g. Uluwatu)" className={inp} />
          <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Country (e.g. Indonesia)" className={inp} />
          <input value={form.priceFrom} onChange={(e) => setForm({ ...form, priceFrom: e.target.value })} type="number" min={0} placeholder="Price from ₹ (optional)" className={inp} />
          <select value={form.timeslot} onChange={(e) => setForm({ ...form, timeslot: e.target.value })} className={inp}>
            {TIMESLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className={inp}>
            {KINDS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex items-center gap-2">
            {form.imageUrl
              ? <><img src={form.imageUrl} alt="" className="h-10 w-14 rounded object-cover" /><button type="button" onClick={() => setForm({ ...form, imageUrl: "" })} className="text-xs text-ink-muted hover:text-danger">Remove</button></>
              : <MediaUploader compact onUploaded={(url) => setForm((f) => ({ ...f, imageUrl: url }))} />}
          </div>
          <textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="Short description (optional)" rows={2} className="rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none sm:col-span-2 lg:col-span-3" />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button type="button" onClick={create} disabled={pending || form.title.trim().length < 2} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-blue px-5 text-sm font-bold text-white hover:bg-brand-blueDark disabled:opacity-50">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add activity
          </button>
          {error && <span className="text-sm text-danger">{error}</span>}
          {msg && <span className="text-sm text-success">{msg}</span>}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search activities…" className="h-10 w-full rounded-xl border border-surface-border bg-white pl-9 pr-3 text-sm focus:border-brand-blue focus:outline-none" />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-surface-border bg-white p-8 text-center text-sm text-ink-muted">
          {activities.length === 0 ? "No activities yet — add one above, or click “Harvest from packages”." : "No activities match your search."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((a) => <ActivityCard key={a.id} a={a} pending={pending} start={start} router={router} />)}
        </div>
      )}
    </div>
  );
}

function ActivityCard({ a, pending, start, router }: { a: ActivityRow; pending: boolean; start: React.TransitionStartFunction; router: ReturnType<typeof useRouter> }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-surface-border bg-white">
      <div className="relative aspect-[4/3] bg-surface-muted">
        {a.imageUrl
          ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={a.imageUrl} alt={a.title} className="h-full w-full object-cover" loading="lazy" />
          : <div className="flex h-full items-center justify-center text-ink-faint"><MapPin className="h-6 w-6" /></div>}
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-navy">{a.timeslot}</span>
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-semibold text-brand-navy">{a.title}</p>
        <p className="mt-0.5 text-xs text-ink-muted">{[a.city, a.kind].filter(Boolean).join(" · ")}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-bold text-brand-navy">{a.priceFrom ? formatINR(a.priceFrom) : "—"}</span>
          <button
            type="button"
            disabled={pending}
            onClick={() => { if (!window.confirm(`Delete “${a.title}”?`)) return; start(async () => { await deleteActivityAction(a.id); router.refresh(); }); }}
            className="text-ink-faint hover:text-danger" aria-label="Delete activity"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
