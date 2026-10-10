"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, MapPin, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

export type GalleryImage = {
  id: string;
  url: string;
  alt: string;
  caption: string | null;
  location: string | null;
  category: string;
};

/**
 * Responsive gallery grid with category filters and a full-screen viewer.
 *
 * Images are served through next/image, so they are resized and lazily loaded;
 * only the first row is eager. The viewer is keyboard-navigable (← → Esc) and
 * returns focus to the page when it closes.
 */
export function GalleryGrid({
  items,
  categories,
}: {
  items: GalleryImage[];
  categories: { key: string; label: string }[];
}) {
  const [active, setActive] = useState<string>("ALL");
  const [index, setIndex] = useState<number | null>(null);

  // Only offer a filter chip for a category that actually has photographs.
  const available = useMemo(
    () => categories.filter((c) => items.some((i) => i.category === c.key)),
    [categories, items]
  );

  const visible = useMemo(
    () => (active === "ALL" ? items : items.filter((i) => i.category === active)),
    [items, active]
  );

  const close = useCallback(() => setIndex(null), []);
  const step = useCallback(
    (delta: number) =>
      setIndex((i) => (i === null ? null : (i + delta + visible.length) % visible.length)),
    [visible.length]
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [index, close, step]);

  const current = index === null ? null : visible[index];

  return (
    <>
      {available.length > 1 && (
        <div className="no-scrollbar -mx-4 mb-7 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          <FilterChip label="All photos" count={items.length} active={active === "ALL"} onClick={() => { setActive("ALL"); setIndex(null); }} />
          {available.map((c) => (
            <FilterChip
              key={c.key}
              label={c.label}
              count={items.filter((i) => i.category === c.key).length}
              active={active === c.key}
              onClick={() => { setActive(c.key); setIndex(null); }}
            />
          ))}
        </div>
      )}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((item, i) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="group relative block w-full overflow-hidden rounded-xl bg-surface-muted"
              aria-label={`Open photo: ${item.alt}`}
            >
              <span className="relative block aspect-square">
                <Image
                  src={item.url}
                  alt={item.alt}
                  fill
                  sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
                  priority={i < 4}
                  loading={i < 4 ? undefined : "lazy"}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </span>
              <span className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-brand-navy/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <span className="w-full p-3 text-left">
                  {item.caption && <span className="block text-xs font-semibold text-white">{item.caption}</span>}
                  {item.location && (
                    <span className="mt-0.5 flex items-center gap-1 text-[11px] text-white/80">
                      <MapPin className="h-3 w-3" /> {item.location}
                    </span>
                  )}
                </span>
              </span>
              <span className="pointer-events-none absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/85 text-brand-navy opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <ZoomIn className="h-3.5 w-3.5" />
              </span>
            </button>
          </li>
        ))}
      </ul>

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.alt}
          className="fixed inset-0 z-[100] flex flex-col bg-brand-navyDark/95 backdrop-blur-sm"
          onClick={close}
        >
          <div className="flex items-center justify-between gap-4 px-4 py-3 text-white/80">
            <span className="tabular text-sm font-semibold">
              {index! + 1} / {visible.length}
            </span>
            <button
              type="button"
              onClick={close}
              aria-label="Close photo viewer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4" onClick={(e) => e.stopPropagation()}>
            {visible.length > 1 && (
              <ViewerArrow side="left" onClick={() => step(-1)} />
            )}
            <div className="relative h-full w-full max-w-5xl">
              <Image
                src={current.url}
                alt={current.alt}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>
            {visible.length > 1 && <ViewerArrow side="right" onClick={() => step(1)} />}
          </div>

          {(current.caption || current.location) && (
            <div className="px-4 pb-6 text-center" onClick={(e) => e.stopPropagation()}>
              {current.caption && <p className="text-sm font-semibold text-white">{current.caption}</p>}
              {current.location && (
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-white/70">
                  <MapPin className="h-3 w-3" /> {current.location}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function FilterChip({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-colors",
        active
          ? "border-brand-blue bg-brand-blue text-white"
          : "border-surface-border bg-white text-ink-muted hover:border-brand-blue hover:text-brand-blue"
      )}
    >
      {label} <span className={cn("tabular ml-1 text-xs", active ? "text-white/70" : "text-ink-faint")}>{count}</span>
    </button>
  );
}

function ViewerArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous photo" : "Next photo"}
      className={cn(
        "absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25",
        side === "left" ? "left-2 sm:left-5" : "right-2 sm:right-5"
      )}
    >
      <Icon className="h-6 w-6" />
    </button>
  );
}
