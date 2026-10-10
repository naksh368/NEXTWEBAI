import { cn } from "@/lib/utils";

/** Google's multicolour "G" mark. */
export function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
    </svg>
  );
}

const STAR = "M10 1.5l2.6 5.3 5.9.9-4.25 4.15 1 5.85L10 14.95 4.75 17.7l1-5.85L1.5 7.7l5.9-.9z";

/** Five stars filled to the exact score, e.g. 4.8 → four and four-fifths. */
function Stars({ score, className }: { score: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5", className)} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, score - i));
        return (
          <svg key={i} viewBox="0 0 20 20" className="h-4 w-4">
            <path d={STAR} fill="#D9DEE5" />
            {fill > 0 && (
              <path d={STAR} fill="#FBBC05" style={{ clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` }} />
            )}
          </svg>
        );
      })}
    </span>
  );
}

/**
 * The business's Google rating. Renders nothing unless an administrator has
 * entered a score, and always links to the reviews so it can be checked.
 */
export function GoogleRating({
  score,
  count,
  url,
  tone = "light",
  className,
}: {
  score: number | null;
  count?: number | null;
  url?: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  if (score === null || !url) return null;
  const dark = tone === "dark";
  const label = `Rated ${score.toFixed(1)} out of 5 on Google${count ? ` from ${count} reviews` : ""} — read the reviews`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn(
        "group inline-flex items-center gap-3 rounded-2xl px-4 py-2.5 transition-shadow",
        dark ? "bg-white text-brand-navy hover:shadow-lift" : "border border-surface-border bg-white text-brand-navy shadow-card hover:shadow-cardHover",
        className
      )}
    >
      <GoogleG className="h-7 w-7 shrink-0" />
      <span className="flex flex-col leading-tight">
        <span className="flex items-center gap-2">
          <span className="tabular text-lg font-extrabold">{score.toFixed(1)}</span>
          <Stars score={score} />
        </span>
        <span className="text-xs font-semibold text-ink-muted group-hover:text-brand-blue">
          Google rating{count ? ` · ${count.toLocaleString("en-IN")} reviews` : ""}
        </span>
      </span>
    </a>
  );
}
