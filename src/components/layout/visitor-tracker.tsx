"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Records a page view on each public-site navigation by beaconing the current
 * path to /api/track. No personal data leaves the browser — the server keeps
 * only the path and an anonymous first-party visitor id (for unique-visitor
 * counts). Admin and account routes are skipped here and on the server.
 */
export function VisitorTracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (/^\/(admin|sign-in|account)(\/|$)/.test(pathname)) return;
    if (last.current === pathname) return; // de-dupe Strict-Mode double effect
    last.current = pathname;

    const body = JSON.stringify({
      path: pathname,
      referrer: typeof document !== "undefined" ? document.referrer || "" : "",
    });
    // Prefer sendBeacon so the request survives a fast navigation away.
    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
        return;
      }
    } catch {
      // fall through to fetch
    }
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
