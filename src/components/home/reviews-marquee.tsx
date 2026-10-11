import { GoogleG } from "@/components/ui/google-rating";
import type { ReviewItem } from "@/lib/reviews";


function Card({ r, hidden }: { r: ReviewItem; hidden?: boolean }) {
  return (
    <figure
      aria-hidden={hidden || undefined}
      className="flex w-[300px] shrink-0 flex-col rounded-2xl border border-surface-border bg-white p-5 shadow-card sm:w-[340px]"
    >
      <div className="flex items-center justify-between gap-3">
        {r.rating !== null ? (
          <span className="text-[15px] tracking-[2px] text-[#FBBC05]" aria-label={`${r.rating} out of 5`}>
            {"★★★★★".slice(0, r.rating)}
            <span className="text-surface-border">{"★★★★★".slice(r.rating)}</span>
          </span>
        ) : (
          <span />
        )}
        {r.source === "GOOGLE" && <GoogleG className="h-5 w-5" />}
      </div>
      <blockquote className="mt-3 line-clamp-6 flex-1 text-sm leading-relaxed text-ink">{r.text}</blockquote>
      <figcaption className="mt-4 flex items-center gap-3 border-t border-surface-border pt-3">
        {r.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- reviewer photos come from Google's own servers
          <img src={r.photoUrl} alt="" width={32} height={32} loading="lazy" referrerPolicy="no-referrer" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-blueLight text-sm font-extrabold text-brand-blue">
            {r.author.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="min-w-0">
          {r.link && !hidden ? (
            <a href={r.link} target="_blank" rel="noopener noreferrer nofollow" className="block truncate text-sm font-bold text-brand-navy hover:text-brand-blue">
              {r.author}
            </a>
          ) : (
            <span className="block truncate text-sm font-bold text-brand-navy">{r.author}</span>
          )}
          {r.meta && <span className="block truncate text-xs text-ink-muted">{r.meta}</span>}
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * Reviews that glide past on their own, endlessly. The list is drawn twice and
 * the track slides by exactly one copy, so the loop has no seam. It pauses on
 * hover or keyboard focus; with reduced motion it becomes a swipeable row.
 */
export function ReviewsMarquee({ items }: { items: ReviewItem[] }) {
  // Short lists are repeated so the strip is always wider than the screen.
  const base = items.length >= 6 ? items : Array.from({ length: Math.ceil(6 / Math.max(1, items.length)) }, () => items).flat();
  const seconds = Math.max(30, base.length * 7);

  return (
    <div className="marquee group relative -mx-4 overflow-hidden sm:mx-0" role="region" aria-label="Customer reviews" tabIndex={0}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-surface-muted to-transparent sm:w-16" aria-hidden />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-surface-muted to-transparent sm:w-16" aria-hidden />
      {/* Two identical copies, each with its trailing gap, so -50% lands exactly on the seam. */}
      <div className="marquee-track flex w-max py-2" style={{ animationDuration: `${seconds}s` }}>
        <div className="flex gap-4 pr-4">
          {base.map((r, i) => (
            <Card key={`a-${i}-${r.key}`} r={r} hidden={i >= items.length} />
          ))}
        </div>
        <div className="flex gap-4 pr-4" aria-hidden="true">
          {base.map((r, i) => (
            <Card key={`b-${i}-${r.key}`} r={r} hidden />
          ))}
        </div>
      </div>
    </div>
  );
}

