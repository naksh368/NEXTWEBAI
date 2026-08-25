import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { n: 1, label: "Choose & customize" },
  { n: 2, label: "Traveller details" },
  { n: 3, label: "Secure payment" },
  { n: 4, label: "Confirmation" },
];

/**
 * Visual progress for the booking journey. `current` is the 1-based active step
 * (the checkout page sits on step 2 → details, flowing into 3 → payment).
 */
export function CheckoutSteps({ current = 2 }: { current?: number }) {
  return (
    <ol className="mt-6 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
      {STEPS.map((s, i) => {
        const done = s.n < current;
        const active = s.n === current;
        return (
          <li key={s.n} className="flex items-center gap-2 whitespace-nowrap">
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors",
                done && "bg-success text-white",
                active && "bg-brand-blue text-white ring-4 ring-brand-blue/15",
                !done && !active && "bg-surface-muted text-ink-faint"
              )}
            >
              {done ? <Check className="h-4 w-4" /> : s.n}
            </span>
            <span className={cn("text-sm font-semibold", active ? "text-brand-navy" : done ? "text-ink" : "text-ink-faint")}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && <span className={cn("mx-1 h-px w-6 sm:w-10", done ? "bg-success" : "bg-surface-border")} />}
          </li>
        );
      })}
    </ol>
  );
}
