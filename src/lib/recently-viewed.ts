"use client";

// Per-viewer "recently viewed" list stored in localStorage (works signed-out).
// Holds only package slugs, newest first; card data is fetched fresh so prices
// never go stale.
import { useEffect, useState } from "react";

const KEY = "etx_recent_pkgs";
const EVENT = "etx_recent_pkgs_changed";
const MAX = 12;

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
    localStorage.setItem(KEY, JSON.stringify([...new Set(slugs)].slice(0, MAX)));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* private mode / storage disabled — ignore */
  }
}

/** Move a slug to the front of the recently-viewed list. */
export function recordViewed(slug: string) {
  if (!slug) return;
  const cur = read().filter((s) => s !== slug);
  write([slug, ...cur]);
}

/** Subscribe to the recently-viewed list; re-renders on change. */
export function useRecentlyViewed(): string[] {
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
