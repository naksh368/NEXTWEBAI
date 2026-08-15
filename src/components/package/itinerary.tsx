import { Plane, Car, BedDouble, Ticket, Utensils, Coffee, Info, Sun, Sunset, Moon } from "lucide-react";
import type { ComponentType } from "react";

type Item = { id: string; timeslot: string; kind: string; title: string; description?: string | null };
type Day = { id: string; dayNumber: number; title: string; summary?: string | null; items: Item[] };

const KIND_ICON: Record<string, ComponentType<{ className?: string }>> = {
  FLIGHT: Plane, TRANSFER: Car, HOTEL: BedDouble, ACTIVITY: Ticket,
  MEAL: Utensils, FREE_TIME: Coffee, NOTE: Info,
};
const SLOT_ICON: Record<string, ComponentType<{ className?: string }>> = {
  MORNING: Sun, AFTERNOON: Sunset, EVENING: Moon,
};
const SLOT_LABEL: Record<string, string> = { MORNING: "Morning", AFTERNOON: "Afternoon", EVENING: "Evening" };

export function Itinerary({ days }: { days: Day[] }) {
  return (
    <ol className="relative space-y-6 border-l-2 border-surface-border pl-6">
      {days.map((day) => (
        <li key={day.id} className="relative">
          <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white ring-4 ring-white">
            {day.dayNumber}
          </span>
          <div className="rounded-2xl border border-surface-border bg-white p-5">
            <h3 className="text-base font-semibold text-brand-navy">
              Day {day.dayNumber}: {day.title}
            </h3>
            {day.summary && <p className="mt-1 text-sm text-ink-muted">{day.summary}</p>}
            <div className="mt-4 space-y-3">
              {day.items.map((item) => {
                const Icon = KIND_ICON[item.kind] ?? Info;
                const Slot = SLOT_ICON[item.timeslot] ?? Sun;
                return (
                  <div key={item.id} className="flex gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-blueLight text-brand-blue">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                        <Slot className="h-3 w-3" /> {SLOT_LABEL[item.timeslot] ?? item.timeslot}
                      </div>
                      <p className="text-sm font-medium text-ink">{item.title}</p>
                      {item.description && <p className="text-sm text-ink-muted">{item.description}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
