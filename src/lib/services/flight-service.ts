import { db } from "@/lib/db";
import { makeReference } from "@/lib/utils";
import { createHold, captureHold, releaseHold } from "./wallet-service";

/**
 * Flight supplier abstraction (spec §13–§15).
 *
 * The portal is never hard-coded to one supplier. All flight operations go
 * through this service, which resolves a configured supplier adapter. When no
 * supplier is configured we report that honestly — we NEVER fabricate fares,
 * PNRs or tickets. A booking only reaches TICKETED when a real supplier confirms
 * issuance; an ambiguous/timeout response parks it at CONFIRMATION_PENDING.
 *
 * Supplier credentials live server-side only, referenced by env, never sent to
 * the browser. To add a supplier, implement FlightSupplier and register it in
 * `resolveSupplier()`.
 */

export type FlightQuery = {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  tripType: "ONEWAY" | "ROUND";
  cabin: string;
  adults: number;
  children: number;
  infants: number;
};

export type FareOffer = {
  id: string;
  supplier: string;
  airline: string;
  flightNumber: string;
  departTime: string;
  arriveTime: string;
  durationMinutes: number;
  stops: number;
  cabin: string;
  baseFare: number;
  taxes: number;
  total: number;
  currency: string;
};

export interface FlightSupplier {
  key: string;
  search(q: FlightQuery): Promise<FareOffer[]>;
  revalidate(offerId: string): Promise<{ ok: boolean; offer?: FareOffer }>;
  book(offerId: string, passengers: unknown[]): Promise<{ status: "TICKETED" | "PENDING" | "FAILED"; pnr?: string; supplierRef?: string; note?: string }>;
}

/**
 * Returns the configured supplier, or null when none is set up. Real adapters
 * (e.g. TripJack, TBO, Amadeus) plug in here reading their own env credentials.
 */
export function resolveSupplier(): FlightSupplier | null {
  const key = process.env.FLIGHT_SUPPLIER; // e.g. "tripjack"
  if (!key) return null;
  // Intentionally no fake adapter — a supplier must be genuinely integrated.
  return null;
}

export function isFlightSupplierConfigured(): boolean {
  return resolveSupplier() !== null;
}

export async function searchFlights(q: FlightQuery): Promise<{ configured: boolean; offers: FareOffer[] }> {
  const supplier = resolveSupplier();
  if (!supplier) return { configured: false, offers: [] };
  return { configured: true, offers: await supplier.search(q) };
}

async function logEvent(bookingId: string, toStatus: string, fromStatus: string | null, message?: string, actor = "system") {
  await db.flightBookingEvent.create({ data: { bookingId, toStatus, fromStatus, message, actor } });
}

/**
 * Book a flight against the resolved supplier, wiring the wallet money flow:
 *   available → HOLD → (TICKETED ⇒ capture) | (FAILED ⇒ release).
 * A ticket is shown only when the supplier confirms issuance.
 */
export async function createBooking(input: {
  agentId: string;
  offerId: string;
  query: FlightQuery;
  offer: FareOffer;
  passengers: Array<{ title: string; firstName: string; lastName: string; type: string }>;
}): Promise<{ ok: boolean; reference?: string; status?: string; error?: string }> {
  const supplier = resolveSupplier();
  if (!supplier) return { ok: false, error: "No flight supplier is configured yet." };

  const reference = makeReference("ETB");
  const booking = await db.flightBooking.create({
    data: {
      reference,
      agentId: input.agentId,
      supplier: supplier.key,
      origin: input.query.origin,
      destination: input.query.destination,
      departDate: new Date(input.query.departDate),
      returnDate: input.query.returnDate ? new Date(input.query.returnDate) : null,
      tripType: input.query.tripType,
      cabin: input.query.cabin,
      itinerary: input.offer as never,
      baseFare: input.offer.baseFare,
      taxes: input.offer.taxes,
      totalAmount: input.offer.total,
      status: "REVALIDATED",
      passengers: {
        create: input.passengers.map((p) => ({ title: p.title, firstName: p.firstName, lastName: p.lastName, type: p.type })),
      },
    },
  });
  await logEvent(booking.id, "REVALIDATED", "DRAFT");

  // Hold the fare from the wallet.
  let holdId: string;
  try {
    const hold = await createHold(input.agentId, input.offer.total, reference);
    holdId = hold.holdId;
  } catch {
    await db.flightBooking.update({ where: { id: booking.id }, data: { status: "FAILED", statusNote: "Insufficient wallet balance" } });
    await logEvent(booking.id, "FAILED", "REVALIDATED", "Insufficient wallet balance");
    return { ok: false, reference, status: "FAILED", error: "Insufficient wallet balance." };
  }
  await db.flightBooking.update({ where: { id: booking.id }, data: { status: "HOLD", holdId } });
  await logEvent(booking.id, "HOLD", "REVALIDATED");

  // Supplier booking.
  await db.flightBooking.update({ where: { id: booking.id }, data: { status: "SUPPLIER_PROCESSING" } });
  const result = await supplier.book(input.offerId, input.passengers).catch(() => ({ status: "PENDING" as const, note: "Supplier timeout" }));

  if (result.status === "TICKETED") {
    await captureHold(holdId);
    await db.flightBooking.update({
      where: { id: booking.id },
      data: { status: "TICKETED", pnr: result.pnr, supplierRef: result.supplierRef },
    });
    await logEvent(booking.id, "TICKETED", "SUPPLIER_PROCESSING", `PNR ${result.pnr ?? ""}`);
    return { ok: true, reference, status: "TICKETED" };
  }
  if (result.status === "FAILED") {
    await releaseHold(holdId, "Booking failed at supplier");
    await db.flightBooking.update({ where: { id: booking.id }, data: { status: "FAILED", statusNote: result.note } });
    await logEvent(booking.id, "FAILED", "SUPPLIER_PROCESSING", result.note);
    return { ok: false, reference, status: "FAILED", error: result.note ?? "Booking failed." };
  }
  // Ambiguous / timeout — never fake a ticket. Keep the hold; ops reconciles.
  await db.flightBooking.update({ where: { id: booking.id }, data: { status: "CONFIRMATION_PENDING", statusNote: result.note } });
  await logEvent(booking.id, "CONFIRMATION_PENDING", "SUPPLIER_PROCESSING", result.note);
  return { ok: true, reference, status: "CONFIRMATION_PENDING" };
}
