import { test } from "node:test";
import assert from "node:assert/strict";
import { aboutSchema, DEFAULT_TERMS, fillTokens, homeSchema, privacySchema, termsSchema, toBlocks } from "../src/lib/page-content";
import { DEFAULT_SITE_SETTINGS } from "../src/lib/site-settings";

test("an empty saved page reads as the original site text", () => {
  assert.equal(homeSchema.parse({}).planTitle, "Tell us your dates. We'll plan the rest.");
  assert.equal(aboutSchema.parse({}).principles.length, 6);
  assert.equal(termsSchema.parse({}).sections.length, 13);
  assert.ok(privacySchema.parse({}).sections.length >= 10);
});

test("a partly saved or damaged page keeps every other field", () => {
  const home = homeSchema.parse({ planTitle: "Book your island escape", features: "not a list" });
  assert.equal(home.planTitle, "Book your island escape");
  assert.equal(home.features.length, 4);
  assert.equal(home.ctaTitle, "Tell us when you want to travel");
});

test("the cancellation section keeps the anchor the footer links to", () => {
  assert.equal(DEFAULT_TERMS.sections.find((s) => s.id === "cancellation")?.heading, "5. Cancellation and refunds");
});

test("placeholders are filled from the business details", () => {
  const s = { ...DEFAULT_SITE_SETTINGS, brandName: "JST Andaman Travels", email: "", phonePrimary: "+91 94342 84365" };
  assert.equal(fillTokens("Ask {brand} on {contact}.", s), "Ask JST Andaman Travels on +91 94342 84365.");
  assert.equal(fillTokens("Write to {email}", { ...s, email: "" }), "Write to our email address");
  assert.ok(!/\{(brand|contact|address)\}/.test(fillTokens(DEFAULT_TERMS.contactLine + DEFAULT_TERMS.intro, s)));
});

test("edited text becomes paragraphs and bullet lists in order", () => {
  assert.deepEqual(toBlocks("First paragraph\ncontinues here.\n\nWe ask that:\n- one\n• two\n\nLast."), [
    { type: "p", text: "First paragraph continues here." },
    { type: "p", text: "We ask that:" },
    { type: "ul", items: ["one", "two"] },
    { type: "p", text: "Last." },
  ]);
});
