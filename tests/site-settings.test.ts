import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SITE_SETTINGS, promoIsActive, siteSettingsSchema, telLinkFor, whatsappLinkFor } from "../src/lib/site-settings";
import { parseRange } from "../src/lib/filters";

const at = (iso: string) => new Date(`${iso}T12:00:00Z`);

test("the shipped defaults are a valid settings document", () => {
  assert.equal(siteSettingsSchema.safeParse(DEFAULT_SITE_SETTINGS).success, true);
});

test("no social proof is published by default", () => {
  // Inventing a rating or a traveller count is the one thing the brief rules
  // out outright, so the defaults must leave every figure empty.
  assert.equal(DEFAULT_SITE_SETTINGS.reviewScore, null);
  assert.equal(DEFAULT_SITE_SETTINGS.reviewCount, null);
  assert.equal(DEFAULT_SITE_SETTINGS.travellersServed, null);
  assert.equal(DEFAULT_SITE_SETTINGS.registrationInfo, "");
});

test("an older saved document is filled in from the defaults, not rejected", () => {
  const parsed = siteSettingsSchema.safeParse({ brandName: "JST Andaman Travels" });
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.brandName, "JST Andaman Travels");
    assert.equal(parsed.data.defaultMinTravellers, 4);
    assert.ok(parsed.data.addressLines.length > 0);
  }
});

test("unknown keys from a future version are dropped rather than stored", () => {
  const parsed = siteSettingsSchema.safeParse({ ...DEFAULT_SITE_SETTINGS, somethingNew: "x" });
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal("somethingNew" in parsed.data, false);
});

test("a review score outside 0-5 is rejected", () => {
  assert.equal(siteSettingsSchema.safeParse({ reviewScore: 7 }).success, false);
  assert.equal(siteSettingsSchema.safeParse({ reviewScore: 4.8 }).success, true);
});

test("the promotional window is inclusive of both end dates", () => {
  const s = { ...DEFAULT_SITE_SETTINGS, promoValidFrom: "2026-09-01", promoValidTo: "2027-01-31" };
  assert.equal(promoIsActive(s, at("2026-08-31")), false, "before the window");
  assert.equal(promoIsActive(s, at("2026-09-01")), true, "first day");
  assert.equal(promoIsActive(s, at("2026-11-15")), true, "mid window");
  assert.equal(promoIsActive(s, at("2027-01-31")), true, "last day is still valid");
  assert.equal(promoIsActive(s, at("2027-02-01")), false, "expired");
});

test("an unparseable end date leaves the promotion running rather than hiding prices", () => {
  const s = { ...DEFAULT_SITE_SETTINGS, promoValidFrom: "", promoValidTo: "" };
  assert.equal(promoIsActive(s, at("2030-01-01")), true);
});

test("WhatsApp links are suppressed when the admin turns WhatsApp off", () => {
  const on = { ...DEFAULT_SITE_SETTINGS, whatsappEnabled: true, whatsappE164: "919434284365" };
  const off = { ...DEFAULT_SITE_SETTINGS, whatsappEnabled: false, whatsappE164: "919434284365" };
  const blank = { ...DEFAULT_SITE_SETTINGS, whatsappEnabled: true, whatsappE164: "" };

  assert.ok(whatsappLinkFor(on, "hello")?.startsWith("https://wa.me/919434284365?text="));
  assert.equal(whatsappLinkFor(off, "hello"), null);
  assert.equal(whatsappLinkFor(blank, "hello"), null);
});

test("the WhatsApp message is URL-encoded", () => {
  const link = whatsappLinkFor({ ...DEFAULT_SITE_SETTINGS, whatsappE164: "919434284365" }, "Hi & bye?");
  assert.ok(link?.includes("Hi%20%26%20bye%3F"), link ?? "no link");
});

test("tel: links are built from digits only, and omitted when unset", () => {
  assert.equal(telLinkFor({ ...DEFAULT_SITE_SETTINGS, phonePrimaryE164: "+91 94342 84365" }), "tel:+919434284365");
  assert.equal(telLinkFor({ ...DEFAULT_SITE_SETTINGS, phonePrimaryE164: "" }), null);
});

test("parseRange reads open-ended and closed filter ranges", () => {
  assert.deepEqual(parseRange(undefined), {});
  assert.deepEqual(parseRange(""), {});
  assert.deepEqual(parseRange("15000-20000"), { min: 15000, max: 20000 });
  assert.deepEqual(parseRange("-15000"), { min: undefined, max: 15000 }, "under X");
  assert.deepEqual(parseRange("35000-"), { min: 35000, max: undefined }, "over X");
  assert.deepEqual(parseRange("4-5"), { min: 4, max: 5 });
});

test("parseRange ignores junk instead of producing NaN bounds", () => {
  const r = parseRange("abc-def");
  assert.equal(r.min, undefined);
  assert.equal(r.max, undefined);
});

test("the announcement {price} placeholder follows the catalogue", async () => {
  const { fillPrice } = await import("../src/lib/site-settings");
  const text = "Andaman holiday packages from {price} per person · 5 nights / 6 days";
  assert.equal(fillPrice(text, 15600), "Andaman holiday packages from ₹15,600 per person · 5 nights / 6 days");
  assert.equal(fillPrice(text, 16900), "Andaman holiday packages from ₹16,900 per person · 5 nights / 6 days");
  // No priced package: the phrase goes, never "from ₹0" or a stale number.
  assert.equal(fillPrice(text, null), "Andaman holiday packages · 5 nights / 6 days");
  assert.equal(fillPrice("Book now", null), "Book now");
});
