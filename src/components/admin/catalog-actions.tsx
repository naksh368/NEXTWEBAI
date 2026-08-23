"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, Clock } from "lucide-react";
import { PACKAGE_STATUS } from "@/lib/constants";
import { setPackageStatusAction, moderateReviewAction, toggleCouponAction, toggleOfferAction, toggleFeaturedAction, toggleDestinationPopularAction, toggleCheckedAction, schedulePublishAction } from "@/app/admin/(panel)/actions";

/** datetime-local min = now (local), formatted YYYY-MM-DDTHH:mm. */
function nowLocal(): string {
  const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}

/** Schedule a package to auto-publish later, or show/clear an existing schedule. */
export function SchedulePublish({ id, publishAt, status }: { id: string; publishAt: string | null; status: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (status === "PUBLISHED") return <span className="text-xs text-ink-faint">—</span>;

  const scheduled = publishAt ? new Date(publishAt) : null;
  const save = (iso: string | null) => start(async () => {
    setError(null);
    const r = await schedulePublishAction(id, iso);
    if (!r.ok) setError(r.error);
    else { setOpen(false); setValue(""); router.refresh(); }
  });

  if (scheduled && !open) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-blueLight px-2 py-0.5 text-xs font-semibold text-brand-blue" title="Auto-publishes at this time">
          <Clock className="h-3 w-3" /> {scheduled.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>
        <button type="button" disabled={pending} onClick={() => save(null)} className="text-xs text-ink-muted hover:text-danger" aria-label="Clear schedule">Clear</button>
      </div>
    );
  }

  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline"><Clock className="h-3.5 w-3.5" /> Schedule</button>;
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <input type="datetime-local" value={value} min={nowLocal()} onChange={(e) => setValue(e.target.value)} className="h-8 rounded-lg border border-surface-border px-2 text-xs" />
        <button type="button" disabled={pending || !value} onClick={() => save(value ? new Date(value).toISOString() : null)} className="rounded-lg bg-brand-blue px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50">Save</button>
        <button type="button" onClick={() => { setOpen(false); setError(null); }} className="text-xs text-ink-muted hover:text-ink">Cancel</button>
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-faint" />}
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

/** Labelled switch for "Feature on home", "ExpertzTrip Checked", and "Popular". */
export function FlagToggle({ id, on: initialOn, kind, label }: { id: string; on: boolean; kind: "featured" | "popular" | "checked"; label: string }) {
  const router = useRouter();
  const [on, setOn] = useState(initialOn);
  const [pending, start] = useTransition();
  const act = (next: boolean) => kind === "featured" ? toggleFeaturedAction(id, next) : kind === "checked" ? toggleCheckedAction(id, next) : toggleDestinationPopularAction(id, next);
  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <button
        type="button" role="switch" aria-checked={on} aria-label={label} disabled={pending}
        onClick={() => { const next = !on; setOn(next); start(async () => { const r = await act(next); if (!r.ok) setOn(!next); else router.refresh(); }); }}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? "bg-brand-orange" : "bg-surface-border"}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${on ? "translate-x-6" : "translate-x-1"}`} />
      </button>
      <span className="text-xs font-medium text-ink-muted">{label}</span>
    </label>
  );
}

export function PackageStatusControl({ packageId, current }: { packageId: string; current: string }) {
  const router = useRouter();
  const [value, setValue] = useState(current);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <select value={value} disabled={pending}
        onChange={(e) => { const v = e.target.value; setValue(v); setError(null); start(async () => { const r = await setPackageStatusAction(packageId, v); if (!r.ok) { setError(r.error); setValue(current); } else router.refresh(); }); }}
        className="h-9 rounded-lg border border-surface-border bg-white px-2 text-sm">
        {PACKAGE_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      {pending && <Loader2 className="h-4 w-4 animate-spin text-ink-faint" />}
      {error && <span className="text-xs text-danger" title={error}>!</span>}
    </div>
  );
}

export function ReviewModerate({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const act = (status: "PUBLISHED" | "REJECTED") => start(async () => { const r = await moderateReviewAction(reviewId, status); if (r.ok) router.refresh(); });
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => act("PUBLISHED")} disabled={pending} className="inline-flex items-center gap-1 rounded-lg bg-[#E7F6EC] px-2.5 py-1 text-xs font-semibold text-success hover:brightness-95"><Check className="h-3.5 w-3.5" /> Publish</button>
      <button onClick={() => act("REJECTED")} disabled={pending} className="inline-flex items-center gap-1 rounded-lg bg-[#FCE9E9] px-2.5 py-1 text-xs font-semibold text-danger hover:brightness-95"><X className="h-3.5 w-3.5" /> Reject</button>
      {pending && <Loader2 className="h-4 w-4 animate-spin text-ink-faint" />}
    </div>
  );
}

export function ActiveToggle({ id, isActive, kind }: { id: string; isActive: boolean; kind: "coupon" | "offer" }) {
  const router = useRouter();
  const [on, setOn] = useState(isActive);
  const [pending, start] = useTransition();
  return (
    <button
      role="switch" aria-checked={on} disabled={pending}
      onClick={() => { const next = !on; setOn(next); start(async () => { const r = kind === "coupon" ? await toggleCouponAction(id, next) : await toggleOfferAction(id, next); if (!r.ok) setOn(!next); else router.refresh(); }); }}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? "bg-brand-blue" : "bg-surface-border"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${on ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}
