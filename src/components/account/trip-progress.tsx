import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Post-payment progress tracker:
 *   Payment → Confirming → Booking confirmed → Documents → Trip ready
 * Every step is derived from the backend booking.status + component statuses +
 * documents — never from URL params — so it can't contradict the status banner.
 */
type StepState = "done" | "active" | "pending";

const PAID = new Set(["PAYMENT_RECEIVED", "BOOKING_PROCESSING", "SUPPLIER_CONFIRMATION_PENDING", "CONFIRMED", "COMPLETED"]);
const CONFIRMING = new Set(["PAYMENT_RECEIVED", "BOOKING_PROCESSING", "SUPPLIER_CONFIRMATION_PENDING"]);
const CONFIRMED = new Set(["CONFIRMED", "COMPLETED"]);

export function TripProgress({ status, documentCount }: { status: string; documentCount: number }) {
  // Not meaningful for un-paid / terminal cancelled states.
  if (!PAID.has(status)) return null;

  const paid = PAID.has(status);
  const confirming = CONFIRMING.has(status);
  const confirmed = CONFIRMED.has(status);
  const hasDocs = documentCount > 0;
  const tripReady = confirmed && hasDocs;

  const steps: { label: string; state: StepState }[] = [
    { label: "Payment", state: paid ? "done" : "pending" },
    { label: "Confirming", state: confirmed ? "done" : confirming ? "active" : "pending" },
    { label: "Booking confirmed", state: confirmed ? "done" : "pending" },
    { label: "Documents", state: hasDocs ? "done" : confirmed ? "active" : "pending" },
    { label: "Trip ready", state: tripReady ? "done" : "pending" },
  ];

  const doneCount = steps.filter((s) => s.state === "done").length;
  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="mt-5 rounded-2xl border border-surface-border bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Trip progress</h2>
        <span className="text-sm font-bold text-brand-blue">{pct}%</span>
      </div>
      <ol className="flex items-start justify-between gap-1">
        {steps.map((s, i) => (
          <li key={s.label} className="flex flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span className={cn("h-0.5 flex-1", i === 0 ? "bg-transparent" : steps[i - 1].state === "done" ? "bg-success" : "bg-surface-border")} />
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  s.state === "done" && "bg-success text-white",
                  s.state === "active" && "bg-brand-blue text-white ring-4 ring-brand-blue/15",
                  s.state === "pending" && "bg-surface-muted text-ink-faint",
                )}
              >
                {s.state === "done" ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={cn("h-0.5 flex-1", i === steps.length - 1 ? "bg-transparent" : s.state === "done" ? "bg-success" : "bg-surface-border")} />
            </div>
            <span className={cn("mt-2 text-[11px] font-semibold leading-tight sm:text-xs", s.state === "pending" ? "text-ink-faint" : "text-brand-navy")}>
              {s.label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
