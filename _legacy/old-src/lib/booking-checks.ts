/**
 * Deterministic pre-travel booking checks. These flag real, verifiable issues
 * for staff — they never change a booking on their own. An optional AI narrative
 * can summarize them, but the flags themselves are computed, not invented.
 */

export type CheckLevel = "danger" | "warning" | "info";
export type BookingCheck = { level: CheckLevel; message: string };

export type BookingCheckInput = {
  status: string;
  isInternational: boolean;
  travelDate: Date | null;
  travellers: {
    name: string;
    passportNo: string | null;
    passportExpiry: Date | null;
    dateOfBirth: Date | null;
    panNumber: string | null;
  }[];
  components: { component: string; status: string }[];
  documentsCount: number;
  pax?: { adults: number; children: number; infants: number; rooms: number } | null;
};

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const MONTHS_6_MS = 183 * 24 * 60 * 60 * 1000;

export function computeBookingChecks(b: BookingCheckInput): BookingCheck[] {
  const out: BookingCheck[] = [];
  const who = (n: string) => n?.trim() || "A traveller";

  for (const t of b.travellers) {
    if (b.isInternational && !(t.passportNo && t.passportNo.trim())) {
      out.push({ level: "danger", message: `${who(t.name)} has no passport number — required for international travel.` });
    }
    if (b.isInternational && t.passportExpiry && b.travelDate) {
      if (t.passportExpiry.getTime() - b.travelDate.getTime() < MONTHS_6_MS) {
        out.push({ level: "warning", message: `${who(t.name)}'s passport expires within 6 months of travel — many countries will refuse entry.` });
      }
    }
    if (!t.dateOfBirth) {
      out.push({ level: "warning", message: `${who(t.name)} is missing a date of birth.` });
    }
    if (!(t.panNumber && PAN_RE.test(t.panNumber.trim().toUpperCase()))) {
      out.push({ level: "warning", message: `${who(t.name)} has no valid PAN on file.` });
    }
  }

  if (b.status === "CONFIRMED") {
    const unconfirmed = b.components.filter((c) => c.status !== "CONFIRMED");
    for (const c of unconfirmed) {
      out.push({ level: "danger", message: `Booking is marked Confirmed but ${c.component} is still ${c.status}.` });
    }
    if (b.documentsCount === 0) {
      out.push({ level: "warning", message: "Booking is Confirmed but no documents (tickets/vouchers) have been uploaded yet." });
    }
  }

  if (b.pax) {
    const seats = b.pax.adults + b.pax.children;
    if (b.pax.rooms > 0 && seats / b.pax.rooms > 3) {
      out.push({ level: "info", message: `Room configuration looks tight — ${seats} travellers across ${b.pax.rooms} room(s). Confirm occupancy limits.` });
    }
    if (b.pax.infants > b.pax.adults) {
      out.push({ level: "info", message: "More infants than adults — confirm lap-infant allocation with the airline/hotel." });
    }
  }

  return out;
}
