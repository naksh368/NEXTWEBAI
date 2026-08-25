"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { submitReviewAction } from "@/app/account/trips/[id]/actions";
import { cn } from "@/lib/utils";

export function ReviewForm({ bookingId, alreadyReviewed }: { bookingId: string; alreadyReviewed: boolean }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(alreadyReviewed);

  if (done) {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-success">
        <CheckCircle2 className="h-4 w-4" /> Thanks for your review — it&apos;s pending moderation.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-muted">How was your holiday? Your review helps other travellers.</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}>
            <Star className={cn("h-7 w-7 transition-colors", (hover || rating) >= n ? "fill-brand-orange text-brand-orange" : "text-surface-border")} />
          </button>
        ))}
      </div>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" className="h-10 w-full rounded-xl border border-surface-border px-3 text-sm focus:border-brand-blue focus:outline-none" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Tell us about your experience (optional)" className="w-full rounded-xl border border-surface-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none" />
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
      <button type="button" disabled={pending || rating === 0}
        onClick={() => { setError(null); start(async () => { const r = await submitReviewAction(bookingId, rating, title, body); if (!r.ok) setError(r.error); else { setDone(true); router.refresh(); } }); }}
        className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-orange px-5 text-sm font-semibold text-white hover:bg-brand-orangeDark disabled:opacity-50">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Submit review
      </button>
    </div>
  );
}
