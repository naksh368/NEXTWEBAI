import { test } from "node:test";
import assert from "node:assert/strict";
import { computePricing, resolveSelectedOptions, type PricingInputs, type PricingOption } from "../src/lib/pricing";
import { canTransition } from "../src/lib/booking-states";

const OPTIONS: PricingOption[] = [
  { id: "hotel-base", category: "HOTEL", groupKey: "hotel", label: "Base 4★", priceDelta: 0, perPerson: true, isDefault: true },
  { id: "hotel-up", category: "HOTEL", groupKey: "hotel", label: "5★ upgrade", priceDelta: 7000, perPerson: true, isDefault: false },
  { id: "transfer-base", category: "TRANSFER", groupKey: "transfer", label: "Shared", priceDelta: 0, perPerson: true, isDefault: true },
  { id: "transfer-private", category: "TRANSFER", groupKey: "transfer", label: "Private", priceDelta: 3000, perPerson: false, isDefault: false },
  { id: "act-1", category: "ACTIVITY", groupKey: "act-1", label: "City tour", priceDelta: 2500, perPerson: true, isDefault: false },
];

const INPUTS: PricingInputs = {
  currency: "INR",
  basePrice: 40000,
  perPersonPricing: true,
  options: OPTIONS,
  departures: [{ id: "dep-1", priceDelta: 0 }, { id: "dep-2", priceDelta: 3500 }],
};

test("base price multiplies by travellers", () => {
  const b = computePricing(INPUTS, { travellerCount: 2, selectedOptionIds: ["hotel-base", "transfer-base"] });
  const base = b.items.find((i) => i.kind === "BASE")!;
  assert.equal(base.amount, 80000); // 40000 * 2
});

test("per-person option delta scales, flat option does not", () => {
  const b = computePricing(INPUTS, { travellerCount: 2, selectedOptionIds: ["hotel-up", "transfer-private", "act-1"] });
  const hotel = b.items.find((i) => i.label === "5★ upgrade")!;
  const transfer = b.items.find((i) => i.label === "Private")!;
  const act = b.items.find((i) => i.label === "City tour")!;
  assert.equal(hotel.amount, 14000); // 7000 * 2 travellers
  assert.equal(transfer.amount, 3000); // flat
  assert.equal(act.amount, 5000); // 2500 * 2
});

test("resolveSelectedOptions fills exclusive-group defaults and keeps additive picks", () => {
  const resolved = resolveSelectedOptions(OPTIONS, ["act-1"]).map((o) => o.id).sort();
  // hotel + transfer default in, activity kept
  assert.deepEqual(resolved, ["act-1", "hotel-base", "transfer-base"]);
});

test("choosing a non-default in an exclusive group replaces the default", () => {
  const resolved = resolveSelectedOptions(OPTIONS, ["hotel-up"]).map((o) => o.id);
  assert.ok(resolved.includes("hotel-up"));
  assert.ok(!resolved.includes("hotel-base"));
});

test("percent coupon respects cap and 5% tax applies after discount", () => {
  const b = computePricing(INPUTS, {
    travellerCount: 2,
    selectedOptionIds: ["hotel-base", "transfer-base"],
    coupon: { code: "SAVE", kind: "PERCENT", value: 10, maxDiscount: 6000 },
  });
  // subtotal 80000, 10% = 8000 capped at 6000
  assert.equal(b.discount, 6000);
  // tax = round((80000-6000)*0.05) = 3700
  assert.equal(b.tax, 3700);
  assert.equal(b.total, 80000 - 6000 + 3700);
});

test("flat coupon below minAmount does not apply", () => {
  const b = computePricing(INPUTS, {
    travellerCount: 1,
    selectedOptionIds: ["hotel-base", "transfer-base"],
    coupon: { code: "BIG", kind: "FLAT", value: 4000, minAmount: 100000 },
  });
  assert.equal(b.discount, 0); // subtotal 40000 < 100000
});

test("departure surcharge is applied per person", () => {
  const b = computePricing(INPUTS, { travellerCount: 3, selectedOptionIds: ["hotel-base", "transfer-base"], departureId: "dep-2" });
  const dep = b.items.find((i) => i.kind === "DEPARTURE")!;
  assert.equal(dep.amount, 10500); // 3500 * 3
});

test("booking state machine: payment received is NOT directly confirmable", () => {
  assert.equal(canTransition("PAYMENT_RECEIVED", "CONFIRMED"), false);
  assert.equal(canTransition("PAYMENT_RECEIVED", "BOOKING_PROCESSING"), true);
  assert.equal(canTransition("BOOKING_PROCESSING", "CONFIRMED"), true);
  assert.equal(canTransition("CONFIRMED", "COMPLETED"), true);
  assert.equal(canTransition("REFUNDED", "CONFIRMED"), false);
});
