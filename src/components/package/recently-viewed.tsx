"use client";

import { useEffect, useState } from "react";
import { PackageCard } from "@/components/package/package-card";
import { recordViewed, useRecentlyViewed } from "@/lib/recently-viewed";
import type { PackageListItem } from "@/lib/queries";

/**
 * Fire-and-forget view ping.
 *
 * `sendBeacon` is the right primitive: the browser queues it and we never see
 * a response, so nothing is left holding an open stream. The `fetch` fallback
 * explicitly drains the response body for the same reason — an unread body
 * keeps the connection open, which stalls the page's "network idle" state and
 * ties up a server connection per view.
 */
function pingView(slug: string) {
  const url = `/api/packages/${encodeURIComponent(slug)}/view`;
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      if (navigator.sendBeacon(url)) return;
    }
  } catch {
    // sendBeacon can throw under a strict CSP — fall through to fetch.
  }
  fetch(url, { method: "POST" })
    .then((r) => r.arrayBuffer()) // drain so the connection can close
    .catch(() => {});
}

/** Silently records the current package as recently viewed + counts one view (renders nothing). */
export function RecordView({ slug }: { slug: string }) {
  useEffect(() => {
    recordViewed(slug);
    // Count a view at most once per browser session per package.
    try {
      const key = `jst_viewed_${slug}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage unavailable (private mode) — still count the view.
    }
    pingView(slug);
  }, [slug]);
  return null;
}

/**
 * "Recently viewed" rail. Reads slugs from localStorage, fetches fresh card
 * data, and renders nothing until there's at least one to show. `exclude`
 * drops the package currently on screen.
 */
export function RecentlyViewedRail({ exclude, limit = 4 }: { exclude?: string; limit?: number }) {
  const recent = useRecentlyViewed();
  const [items, setItems] = useState<PackageListItem[]>([]);

  const slugs = recent.filter((s) => s !== exclude).slice(0, limit);
  const key = slugs.join(",");

  useEffect(() => {
    let alive = true;
    if (!slugs.length) { setItems([]); return; }
    fetch(`/api/packages/cards?slugs=${encodeURIComponent(key)}`)
      .then((r) => r.json())
      .then((d) => { if (alive && d.ok) setItems(d.items); })
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!items.length) return null;

  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold text-brand-navy">Recently viewed</h2>
      <p className="mt-1 text-sm text-ink-muted">Pick up where you left off.</p>
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => (
          <PackageCard key={p.id} pkg={p} />
        ))}
      </div>
    </section>
  );
}
