"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { PACKAGE_STATUS } from "@/lib/constants";
import { setPackageStatusAction, moderateReviewAction, toggleCouponAction, toggleOfferAction } from "@/app/admin/(panel)/actions";

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
