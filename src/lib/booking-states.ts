import type { BookingStatus } from "./constants";

/**
 * Booking state machine (Phase 17).
 *
 * Critical invariant: PAYMENT_RECEIVED does NOT imply CONFIRMED. A booking only
 * becomes CONFIRMED after real component/supplier confirmation (Phase 18). This
 * map is the single authority for legal transitions — the booking service must
 * validate every status change against it (never trust the client).
 */
export const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  DRAFT: ["PAYMENT_PENDING", "CANCELLED"],
  PAYMENT_PENDING: ["PAYMENT_PROCESSING", "FAILED", "CANCELLED"],
  PAYMENT_PROCESSING: ["PAYMENT_RECEIVED", "FAILED"],
  PAYMENT_RECEIVED: ["BOOKING_PROCESSING", "REFUND_PENDING"],
  BOOKING_PROCESSING: ["SUPPLIER_CONFIRMATION_PENDING", "CONFIRMED", "FAILED"],
  SUPPLIER_CONFIRMATION_PENDING: ["CONFIRMED", "FAILED", "REFUND_PENDING"],
  CONFIRMED: ["MODIFICATION_REQUESTED", "CANCELLATION_REQUESTED", "COMPLETED"],
  MODIFICATION_REQUESTED: ["CONFIRMED", "CANCELLATION_REQUESTED"],
  CANCELLATION_REQUESTED: ["CANCELLED", "REFUND_PENDING", "CONFIRMED"],
  CANCELLED: ["REFUND_PENDING", "REFUNDED"],
  REFUND_PENDING: ["REFUNDED", "PARTIAL_REFUND" as BookingStatus],
  REFUNDED: [],
  FAILED: ["PAYMENT_PENDING", "CANCELLED"],
  COMPLETED: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return BOOKING_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Statuses a customer sees as "active / upcoming" in My Trips. */
export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  "PAYMENT_RECEIVED",
  "BOOKING_PROCESSING",
  "SUPPLIER_CONFIRMATION_PENDING",
  "CONFIRMED",
  "MODIFICATION_REQUESTED",
];

export const TERMINAL_BOOKING_STATUSES: BookingStatus[] = [
  "CANCELLED",
  "REFUNDED",
  "COMPLETED",
];
