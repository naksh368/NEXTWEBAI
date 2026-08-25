"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleSaved, useWishlist } from "@/lib/wishlist";

/** Heart toggle to save a package to the (per-viewer) wishlist. */
export function SaveButton({ slug, className }: { slug: string; className?: string }) {
  const saved = useWishlist();
  const isSaved = saved.includes(slug);
  return (
    <button
      type="button"
      aria-pressed={isSaved}
      aria-label={isSaved ? "Remove from saved" : "Save this holiday"}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSaved(slug); }}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-colors hover:bg-white",
        className
      )}
    >
      <Heart className={cn("h-4.5 w-4.5 transition-colors", isSaved ? "fill-brand-orange text-brand-orange" : "text-ink-muted")} />
    </button>
  );
}
