"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * While a booking is in a transient payment/processing state, poll the backend
 * for the canonical status and refresh the server component when it changes.
 * This makes the customer page self-correct after a real payment even if the
 * Razorpay webhook is delayed or the client callback and webhook race.
 *
 * Stops polling once the booking reaches a settled state.
 */
const TRANSIENT = new Set([
  "PAYMENT_PENDING", "PAYMENT_PROCESSING", "PAYMENT_RECEIVED", "BOOKING_PROCESSING", "SUPPLIER_CONFIRMATION_PENDING",
]);

export function BookingStatusWatcher({ bookingId, currentStatus }: { bookingId: string; currentStatus: string }) {
  const router = useRouter();
  const lastStatus = useRef(currentStatus);

  useEffect(() => {
    lastStatus.current = currentStatus;
    if (!TRANSIENT.has(currentStatus)) return; // settled — nothing to watch

    let stopped = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 40; // ~4 min at 6s

    async function tick() {
      if (stopped) return;
      attempts += 1;
      try {
        const res = await fetch(`/api/bookings/${bookingId}/status`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.bookingStatus && data.bookingStatus !== lastStatus.current) {
            lastStatus.current = data.bookingStatus;
            router.refresh(); // re-render the server component with fresh DB data
            if (!TRANSIENT.has(data.bookingStatus)) { stopped = true; return; }
          }
        }
      } catch {
        /* transient network error — keep polling */
      }
      if (!stopped && attempts < MAX_ATTEMPTS) {
        timer = setTimeout(tick, 6000);
      }
    }

    let timer = setTimeout(tick, 4000);
    // Also refresh when the tab regains focus (e.g. returning from Razorpay).
    const onFocus = () => router.refresh();
    window.addEventListener("focus", onFocus);

    return () => { stopped = true; clearTimeout(timer); window.removeEventListener("focus", onFocus); };
  }, [bookingId, currentStatus, router]);

  return null;
}
