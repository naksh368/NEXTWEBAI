import { Plane, Car, BedDouble, Ticket, Utensils, Coffee, Info, Sun, Sunset, Moon } from "lucide-react";
import type { ComponentType } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { cn } from "@/lib/utils";

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
// On-brand chips only (blue / orange / navy) — no purple.
const SLOT_CHIP: Record<string, string> = {
  MORNING: "bg-brand-orangeLight text-brand-orangeDark",
  AFTERNOON: "bg-brand-blueLight text-brand-blue",
  EVENING: "bg-brand-navy/10 text-brand-navy",
};

/**
 * Rich day-by-day itinerary. Each day is a chapter card; each item shows a real
 * package photo (cycled from the gallery — never fabricated), a colour-coded
 * time-slot chip, and its description. Free-time items render as a soft
 * "At leisure" block. Images are optional; without them a kind icon is shown.
 */
export function Itinerary({ days, images = [] }: { days: Day[]; images?: string[] }) {
  let imgCursor = 0;
  const nextImage = () => (images.length ? images[imgCursor++ % images.length] : undefined);

  return (
    <div className="space-y-5">
      {days.map((day) => (
        <div key={day.id} className="overflow-hidden rounded-2xl border border-surface-border bg-white">
          {/* Day header */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-surface-border bg-brand-blueLight/40 px-5 py-3.5">
            <span className="inline-flex h-7 items-center rounded-lg bg-brand-blue px-2.5 text-xs font-bold uppercase tracking-wide text-white">
              Day {String(day.dayNumber).padStart(2, "0")}
            </span>
            <h3 className="text-base font-bold text-brand-navy">{day.title}</h3>
            {day.summary && <span className="w-full text-sm text-ink-muted sm:w-auto sm:before:mx-1 sm:before:text-ink-faint sm:before:content-['·']">{day.summary}</span>}
          </div>

          {/* Items */}
          <div className="grid grid-cols-1 divide-y divide-surface-border sm:grid-cols-2 sm:divide-y-0">
            {day.items.map((item, idx) => {
              const Icon = KIND_ICON[item.kind] ?? Info;
              const Slot = SLOT_ICON[item.timeslot] ?? Sun;
              const isLeisure = item.kind === "FREE_TIME";
              const img = isLeisure ? undefined : nextImage();
              return (
                <div key={item.id} className={cn("flex gap-3.5 p-4 sm:p-5", idx % 2 === 0 ? "sm:border-r sm:border-surface-border" : "")}>
                  {/* Thumbnail / icon tile */}
                  {img ? (
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl sm:h-[68px] sm:w-[68px]">
                      <SmartImage src={img} alt={item.title} sizes="68px" className="h-full" />
                    </div>
                  ) : (
                    <span className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-xl sm:h-[68px] sm:w-[68px]",
                      isLeisure ? "bg-surface-muted text-ink-faint" : "bg-brand-blueLight text-brand-blue")}>
                      <Icon className="h-6 w-6" />
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", SLOT_CHIP[item.timeslot] ?? "bg-surface-muted text-ink-muted")}>
                      <Slot className="h-3 w-3" /> {SLOT_LABEL[item.timeslot] ?? item.timeslot}
                    </span>
                    {isLeisure ? (
                      <p className="mt-1.5 text-sm font-semibold text-ink-muted">At leisure — explore at your own pace.</p>
                    ) : (
                      <p className="mt-1.5 text-sm font-semibold leading-snug text-ink">{item.title}</p>
                    )}
                    {item.description && <p className="mt-0.5 text-sm leading-snug text-ink-muted">{item.description}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
