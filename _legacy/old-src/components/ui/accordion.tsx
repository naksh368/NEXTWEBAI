import { ChevronDown } from "lucide-react";

/** Zero-JS accessible accordion using native <details> (Phase 32/37). */
export function Accordion({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <div className="divide-y divide-surface-border rounded-2xl border border-surface-border bg-white">
      {items.map((item, i) => (
        <details key={i} className="group px-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-semibold text-brand-navy [&::-webkit-details-marker]:hidden">
            {item.question}
            <ChevronDown className="h-5 w-5 shrink-0 text-ink-faint transition-transform group-open:rotate-180" />
          </summary>
          <p className="pb-4 pr-8 text-sm leading-relaxed text-ink-muted">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
