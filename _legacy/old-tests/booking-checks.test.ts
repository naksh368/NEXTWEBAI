import { test } from "node:test";
import assert from "node:assert/strict";
import { computeBookingChecks, type BookingCheckInput } from "../src/lib/booking-checks";

const base: BookingCheckInput = {
  status: "BOOKING_PROCESSING",
  isInternational: false,
  travelDate: new Date("2026-10-12"),
  travellers: [{ name: "Asha Rao", passportNo: null, passportExpiry: null, dateOfBirth: new Date("1990-01-01"), panNumber: "ABCDE1234F" }],
  components: [{ component: "HOTEL", status: "PENDING" }],
  documentsCount: 0,
  pax: { adults: 2, children: 0, infants: 0, rooms: 1 },
};

test("clean domestic booking has no traveller-doc flags", () => {
  const flags = computeBookingChecks(base);
  assert.equal(flags.filter((f) => f.message.includes("passport")).length, 0);
  assert.equal(flags.filter((f) => f.message.includes("PAN")).length, 0);
});

test("international booking flags missing passport as danger", () => {
  const flags = computeBookingChecks({ ...base, isInternational: true });
  const p = flags.find((f) => f.message.includes("no passport number"));
  assert.ok(p);
  assert.equal(p!.level, "danger");
});

test("passport expiring within 6 months of travel is flagged", () => {
  const flags = computeBookingChecks({
    ...base,
    isInternational: true,
    travellers: [{ name: "Asha", passportNo: "M1234567", passportExpiry: new Date("2026-12-01"), dateOfBirth: new Date("1990-01-01"), panNumber: "ABCDE1234F" }],
  });
  assert.ok(flags.some((f) => f.message.includes("expires within 6 months")));
});

test("confirmed booking with an unconfirmed component is danger", () => {
  const flags = computeBookingChecks({ ...base, status: "CONFIRMED" });
  assert.ok(flags.some((f) => f.level === "danger" && f.message.includes("still PENDING")));
  assert.ok(flags.some((f) => f.message.includes("no documents")));
});

test("missing PAN is flagged", () => {
  const flags = computeBookingChecks({ ...base, travellers: [{ name: "Asha", passportNo: null, passportExpiry: null, dateOfBirth: new Date("1990-01-01"), panNumber: null }] });
  assert.ok(flags.some((f) => f.message.includes("no valid PAN")));
});

test("tight room configuration is an info flag", () => {
  const flags = computeBookingChecks({ ...base, pax: { adults: 4, children: 3, infants: 0, rooms: 2 } });
  assert.ok(flags.some((f) => f.level === "info" && f.message.includes("tight")));
});
