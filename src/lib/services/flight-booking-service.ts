import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { getSupplier, type Passenger } from "@/lib/services/flight-supplier";
import { holdForBooking, settleHold, refundToWallet, getWalletSummary } from "@/lib/services/wallet-service";

function bookingReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const b = randomBytes(6);
  let out = ""; for (let i = 0; i < 6; i++) out += alphabet[b[i]! % alphabet.length];
  return `ETB-${out}`;
}

export type BookOutcome =
  | { ok: true; status: string; reference: string; id: string; pending?: boolean }
  | { ok: false; code: "PRICE_CHANGED" | "INSUFFICIENT" | "SUPPLIER_FAILED" | "INVALID" | "TICKETING_FAILED"; error: string; newTotal?: number };

/**
 * The full booking flow (§26). A ticket is only ever marked issued when the
 * supplier confirms issuance. Money: HOLD at booking → DEBIT at ticketing, or
 * the hold is RELEASED on any supplier failure. Never debits before the
 * supplier confirms.
 */
export async function bookFlight(customerId: string, token: string, passengers: Passenger[]): Promise<BookOutcome> {
  const supplier = getSupplier();

  // 1) Revalidate the fare (never trust the client's price).
  const fare = await supplier.revalidateFare(token);
  if (!fare.ok || !fare.offer) return { ok: false, code: "INVALID", error: fare.error ?? "This fare is no longer available." };
  if (fare.changed) return { ok: false, code: "PRICE_CHANGED", error: "The fare changed. Please review the new price.", newTotal: fare.offer.totalFare };

  const offer = fare.offer;
  const pax = Math.max(1, passengers.length);
  const amount = offer.totalFare * pax;
  const reference = bookingReference();

  // 2) Persist the intent (PENDING) before touching money.
  const booking = await db.flightBooking.create({
    data: {
      reference, customerId, status: "PENDING",
      origin: offer.origin, destination: offer.destination, departDate: offer.departDate,
      airline: offer.airline, airlineCode: offer.airlineCode, flightNumber: offer.flightNumber,
      departTime: offer.departTime, arriveTime: offer.arriveTime, durationMins: offer.durationMins, stops: offer.stops,
      cabin: offer.cabin, paxCount: pax, passengers: passengers as unknown as object,
      baseFare: offer.baseFare, taxes: offer.taxes, amount, currency: offer.currency,
      supplier: supplier.key,
    },
    select: { id: true },
  });

  // 3) Wallet hold — only if the balance covers it (§14).
  const hold = await holdForBooking(customerId, amount, reference, `Flight ${offer.origin}→${offer.destination}`);
  if (!hold.ok) {
    await db.flightBooking.update({ where: { id: booking.id }, data: { status: "FAILED", failureReason: hold.error ?? "Insufficient balance" } });
    return { ok: false, code: "INSUFFICIENT", error: hold.error ?? "Insufficient wallet balance." };
  }
  await db.flightBooking.update({ where: { id: booking.id }, data: { status: "BOOKING", holdRef: hold.reference } });

  // 4) Create the supplier booking. On failure → release the hold.
  const created = await supplier.createBooking(offer, passengers).catch(() => ({ ok: false as const, error: "Supplier error." }));
  if (!created.ok) {
    await settleHold(reference, "RELEASE");
    await db.flightBooking.update({ where: { id: booking.id }, data: { status: "FAILED", failureReason: created.error ?? "Supplier declined the booking." } });
    return { ok: false, code: "SUPPLIER_FAILED", error: created.error ?? "The airline declined the booking. Your funds were released." };
  }
  await db.flightBooking.update({ where: { id: booking.id }, data: { status: "CONFIRMED", supplierRef: created.supplierRef, pnr: created.pnr } });

  // 5) Issue the ticket. Only now does money leave the wallet (DEBIT).
  const issued = await supplier.issueTicket(created.supplierRef!, pax).catch(() => ({ ok: false as const, pending: true, error: "Issuance uncertain." }));
  if (issued.ok && issued.ticketNumbers) {
    await settleHold(reference, "DEBIT");
    await db.flightBooking.update({ where: { id: booking.id }, data: { status: "TICKETED", ticketNumbers: issued.ticketNumbers as unknown as object } });
    return { ok: true, status: "TICKETED", reference, id: booking.id };
  }

  if (issued.pending) {
    // Uncertain — keep the hold and mark for verification (§26). No fake ticket.
    await db.flightBooking.update({ where: { id: booking.id }, data: { status: "PENDING_VERIFICATION", failureReason: issued.error ?? null } });
    return { ok: true, status: "PENDING_VERIFICATION", reference, id: booking.id, pending: true };
  }

  // Hard ticketing failure after confirmation — cancel + release, never a fake ticket.
  await supplier.cancelBooking(created.supplierRef!).catch(() => {});
  await settleHold(reference, "RELEASE");
  await db.flightBooking.update({ where: { id: booking.id }, data: { status: "FAILED", failureReason: issued.error ?? "Ticketing failed." } });
  return { ok: false, code: "TICKETING_FAILED", error: "Ticketing failed at the airline. Your funds were released." };
}

export async function listFlightBookings(customerId: string, limit = 30) {
  return db.flightBooking.findMany({ where: { customerId }, orderBy: { createdAt: "desc" }, take: limit });
}

export async function getFlightBooking(customerId: string, id: string) {
  return db.flightBooking.findFirst({ where: { id, customerId } });
}

export type CancelOutcome = { ok: boolean; refundAmount?: number; error?: string };

/** Cancel a ticketed/confirmed booking and refund per policy to the wallet. */
export async function cancelFlightBooking(customerId: string, id: string): Promise<CancelOutcome> {
  const supplier = getSupplier();
  const booking = await db.flightBooking.findFirst({ where: { id, customerId } });
  if (!booking) return { ok: false, error: "Booking not found." };
  if (!["TICKETED", "CONFIRMED", "PENDING_VERIFICATION"].includes(booking.status)) {
    return { ok: false, error: "This booking can't be cancelled." };
  }

  const res = await supplier.cancelBooking(booking.supplierRef ?? "").catch(() => ({ ok: false as const, error: "Supplier error." }));
  if (!res.ok) return { ok: false, error: res.error ?? "The airline could not process the cancellation." };

  // Refund policy: mock refunds the full amount minus a nominal fee. A real
  // supplier returns the refundable amount; we credit exactly that.
  const fee = Math.min(booking.amount, 300 * booking.paxCount);
  const refundAmount = typeof res.refundAmount === "number" ? res.refundAmount : Math.max(0, booking.amount - fee);

  if (refundAmount > 0) {
    await refundToWallet(customerId, refundAmount, booking.reference, `Refund · ${booking.reference}`);
  }
  await db.flightBooking.update({ where: { id: booking.id }, data: { status: "CANCELLED" } });
  return { ok: true, refundAmount };
}

export async function walletCanCover(customerId: string, amount: number): Promise<boolean> {
  const s = await getWalletSummary(customerId);
  return s.available >= amount;
}
