import { test } from "node:test";
import assert from "node:assert/strict";
import { canTransition, BOOKING_TRANSITIONS } from "../src/lib/booking-states";
import type { BookingStatus } from "../src/lib/constants";

/**
 * Regression tests for the payment/booking state machine.
 *
 * Bug fixed: after a verified payment the code tried PAYMENT_PENDING →
 * PAYMENT_RECEIVED directly, which is ILLEGAL, so the transition silently
 * failed and the booking stayed PAYMENT_PENDING while the UI (from a URL param)
 * claimed "Payment verified". The correct path walks through PAYMENT_PROCESSING.
 */

test("PAYMENT_PENDING cannot jump straight to PAYMENT_RECEIVED (the original bug)", () => {
  assert.equal(canTransition("PAYMENT_PENDING", "PAYMENT_RECEIVED"), false);
});

test("the verified-payment path is fully legal, step by step", () => {
  assert.ok(canTransition("PAYMENT_PENDING", "PAYMENT_PROCESSING"), "pending → processing");
  assert.ok(canTransition("PAYMENT_PROCESSING", "PAYMENT_RECEIVED"), "processing → received");
  assert.ok(canTransition("PAYMENT_RECEIVED", "BOOKING_PROCESSING"), "received → processing booking");
  assert.ok(canTransition("BOOKING_PROCESSING", "CONFIRMED"), "processing → confirmed");
});

test("payment failure keeps the booking recoverable (pending → failed → pending retry)", () => {
  assert.ok(canTransition("PAYMENT_PENDING", "FAILED"));
  assert.ok(canTransition("FAILED", "PAYMENT_PENDING"), "customer can retry after a failure");
});

test("terminal states allow no further transitions", () => {
  assert.deepEqual(BOOKING_TRANSITIONS.REFUNDED, []);
  assert.deepEqual(BOOKING_TRANSITIONS.COMPLETED, []);
});

test("confirmed booking can only move to modify / cancel / complete", () => {
  assert.deepEqual(
    [...BOOKING_TRANSITIONS.CONFIRMED].sort(),
    ["CANCELLATION_REQUESTED", "COMPLETED", "MODIFICATION_REQUESTED"].sort(),
  );
});

// Mirror of markPaymentReceivedAndProcess's idempotency guard: once a booking is
// at/after PAYMENT_RECEIVED, a duplicate/late webhook must be a no-op.
const POST_PAYMENT: BookingStatus[] = ["PAYMENT_RECEIVED", "BOOKING_PROCESSING", "SUPPLIER_CONFIRMATION_PENDING", "CONFIRMED", "COMPLETED"];
function wouldReprocess(status: BookingStatus): boolean {
  return !POST_PAYMENT.includes(status);
}

test("duplicate webhook after PAYMENT_RECEIVED is a no-op (idempotent)", () => {
  assert.equal(wouldReprocess("PAYMENT_RECEIVED"), false);
  assert.equal(wouldReprocess("BOOKING_PROCESSING"), false);
  assert.equal(wouldReprocess("CONFIRMED"), false);
});

test("a fresh PAYMENT_PENDING booking is still processed once", () => {
  assert.equal(wouldReprocess("PAYMENT_PENDING"), true);
});
