"use client";

// Per-viewer wishlist stored in localStorage (works signed-out). It holds only
// package slugs; card data is always fetched fresh so prices never go stale.
import { useEffect, useState } from "react";

const KEY = "etx_saved";
const EVENT = "etx_saved_changed";

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function write(slugs: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...new Set(slugs)].slice(0, 50)));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* private mode / storage disabled — ignore */
  }
}

export function toggleSaved(slug: string) {
  const cur = read();
  write(cur.includes(slug) ? cur.filter((s) => s !== slug) : [slug, ...cur]);
}

export function removeSaved(slug: string) {
  write(read().filter((s) => s !== slug));
}

/** Subscribe to the wishlist; re-renders on change (this tab + other tabs). */
export function useWishlist(): string[] {
  const [slugs, setSlugs] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setSlugs(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);
  return slugs;
}
