import { test } from "node:test";
import assert from "node:assert/strict";
import { deducePackage, deduceTier, deducePrice, deduceRoute, deduceNights } from "../src/lib/package-deduce";

const SUPPLIER_MESSAGE = `*ANDAMAN 5N/6D – 3 STAR*
Port Blair (2N) – Havelock (2N) – Neil (1N)
Rs. 22,600/- per person (Min 4 Pax)
Valid 1 Sep 2026 to 31 Jan 2027

Inclusions:
• 5 nights hotel stay on twin sharing
• Daily breakfast
• All transfers by AC vehicle
• Private ferry tickets

Exclusions:
• Airfare
• Water sports

Day 1: Arrival at Port Blair
Pick up from airport, Cellular Jail and Light & Sound Show.
Day 2: Ross Island & North Bay
Boat trip to Ross Island and North Bay.
Day 3: Port Blair to Havelock
Ferry to Havelock, Radhanagar Beach sunset.
Day 4: Havelock – Kalapathar
Day 5: Havelock to Neil
Day 6: Departure`;

test("reads a typical supplier message end to end", () => {
  const p = deducePackage(SUPPLIER_MESSAGE);
  assert.equal(p.theme, "THREE_STAR");
  assert.equal(p.name, "Andaman 5N/6D 3 Star Package");
  assert.equal(p.nights, 5);
  assert.equal(p.days, 6);
  assert.equal(p.basePrice, 22600);
  assert.equal(p.minTravellers, 4);
  assert.deepEqual(p.route, [
    { city: "Port Blair", nights: 2 },
    { city: "Havelock Island", nights: 2 },
    { city: "Neil Island", nights: 1 },
  ]);
  assert.equal(p.mealPlan, "Breakfast included");
  assert.equal(p.inclusions.length, 4);
  assert.equal(p.inclusions[0], "5 nights hotel stay on twin sharing");
  assert.deepEqual(p.exclusions, ["Airfare", "Water sports"]);
  assert.equal(p.itinerary.length, 6);
  assert.equal(p.itinerary[1].title, "Ross Island & North Bay");
  assert.match(p.itinerary[0].description, /Cellular Jail/);
  assert.deepEqual(p.warnings, []);
});

test("hotel words decide the tier", () => {
  assert.equal(deduceTier("stay in 4 star resorts", null).theme, "FOUR_STAR");
  assert.equal(deduceTier("4★ hotels", null).theme, "FOUR_STAR");
  assert.equal(deduceTier("five star luxury", null).theme, "FOUR_STAR");
  assert.equal(deduceTier("2-star hotels", null).theme, "TWO_STAR");
  assert.equal(deduceTier("deluxe rooms", null).theme, "STANDARD");
  assert.equal(deduceTier("budget guesthouses", null).theme, "BUDGET");
});

test("with no hotel words the closest advertised rate decides the tier", () => {
  assert.equal(deduceTier("5 nights Andaman", 15900).theme, "BUDGET");
  assert.equal(deduceTier("5 nights Andaman", 21000).theme, "TWO_STAR");
  assert.equal(deduceTier("5 nights Andaman", 31000).theme, "FOUR_STAR");
});

test("prefers the per-person price over other amounts", () => {
  assert.equal(deducePrice("Total ₹90,400 for the group, ₹22,600 per person")?.price, 22600);
  assert.equal(deducePrice("INR 17400 pp")?.price, 17400);
  assert.equal(deducePrice("cost 31,500 per head")?.price, 31500);
  assert.equal(deducePrice("Package cost: 18000")?.price, 18000);
  assert.equal(deducePrice("26,400/- per person")?.price, 26400);
  assert.equal(deducePrice("valid 1 Sep 2026, 4 pax"), null);
  assert.equal(deducePrice("no money here"), null);
});

test("reads durations in the forms people write them", () => {
  assert.equal(deduceNights("4N/5D")?.nights, 4);
  assert.equal(deduceNights("4 Nights 5 Days")?.nights, 4);
  assert.equal(deduceNights("6 days trip")?.nights, 5);
});

test("reads the route in either order and with local names", () => {
  assert.deepEqual(deduceRoute("2N Port Blair, 2 nights in Swaraj Dweep, Shaheed Dweep 1N"), [
    { city: "Port Blair", nights: 2 },
    { city: "Havelock Island", nights: 2 },
    { city: "Neil Island", nights: 1 },
  ]);
});

test("never invents a price and flags what it could not find", () => {
  const p = deducePackage("Andaman trip with 3 star hotels");
  assert.equal(p.basePrice, null);
  assert.ok(p.warnings.some((w) => /No price/.test(w)));
  assert.ok(p.warnings.some((w) => /No duration/.test(w)));
});

test("warns when the details are for somewhere we do not sell", () => {
  const p = deducePackage("Goa 3N/4D, 3 star, ₹12,000 per person");
  assert.ok(p.warnings.some((w) => /only sell Andaman/.test(w)));
});

test("warns when the route does not add up to the duration", () => {
  const p = deducePackage("5N/6D Port Blair 2N Havelock 2N, ₹20,000 per person");
  assert.ok(p.warnings.some((w) => /adds up to 4 nights/.test(w)));
});
