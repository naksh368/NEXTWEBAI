import { toBlocks } from "@/lib/page-content";
import { cn } from "@/lib/utils";

/** Edited text as paragraphs and bullet lists (see `toBlocks`). */
export function RichBlocks({ text, className, tone = "muted" }: { text: string; className?: string; tone?: "muted" | "light" }) {
  const colour = tone === "light" ? "text-white/80" : "text-ink-muted";
  return (
    <div className={cn("space-y-3", className)}>
      {toBlocks(text).map((b, i) =>
        b.type === "p" ? (
          <p key={i} className={cn("text-[15px] leading-relaxed", colour)}>{b.text}</p>
        ) : (
          <ul key={i} className="space-y-2 pt-1">
            {b.items.map((item, j) => (
              <li key={j} className={cn("flex gap-3 text-[15px] leading-relaxed", colour)}>
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-turquoise" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
