// Client-safe flight-booking status labels + tones (shared by portal pages).
export const FLIGHT_STATUS: Record<string, { label: string; tone: string }> = {
  PENDING: { label: "Pending", tone: "text-ink-muted" },
  HELD: { label: "Funds held", tone: "text-warning" },
  BOOKING: { label: "Booking", tone: "text-warning" },
  CONFIRMED: { label: "Confirmed", tone: "text-brand-blue" },
  PENDING_VERIFICATION: { label: "Pending verification", tone: "text-warning" },
  TICKETED: { label: "Ticketed", tone: "text-success" },
  FAILED: { label: "Failed", tone: "text-danger" },
  CANCELLED: { label: "Cancelled", tone: "text-ink-faint" },
  REFUNDED: { label: "Refunded", tone: "text-brand-blue" },
};
