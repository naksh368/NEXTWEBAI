import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePlace } from "../src/lib/services/google-reviews";

// Shape of a Google Places API (New) response, trimmed to the fields we request.
const SAMPLE = {
  rating: 4.8,
  userRatingCount: 54,
  googleMapsUri: "https://maps.google.com/?cid=123",
  reviews: [
    {
      rating: 5,
      relativePublishTimeDescription: "2 weeks ago",
      publishTime: "2026-09-27T10:00:00Z",
      text: { text: "Smooth trip, every ferry on time.", languageCode: "en" },
      authorAttribution: { displayName: "A. Traveller", uri: "https://www.google.com/maps/contrib/1", photoUri: "https://lh3.googleusercontent.com/a" },
    },
    { rating: 5, authorAttribution: { displayName: "Stars only" } },
    { rating: 4, originalText: { text: "Good hotels." }, authorAttribution: { displayName: "B" } },
  ],
};

test("reads the rating, count, profile link and written reviews", () => {
  const p = parsePlace(SAMPLE)!;
  assert.equal(p.rating, 4.8);
  assert.equal(p.count, 54);
  assert.equal(p.url, "https://maps.google.com/?cid=123");
  assert.equal(p.reviews.length, 2, "a star-only review has no text to show");
  assert.deepEqual(p.reviews[0], {
    author: "A. Traveller",
    authorUrl: "https://www.google.com/maps/contrib/1",
    photoUrl: "https://lh3.googleusercontent.com/a",
    rating: 5,
    text: "Smooth trip, every ferry on time.",
    when: "2 weeks ago",
    publishTime: "2026-09-27T10:00:00Z",
  });
  assert.equal(p.reviews[1].text, "Good hotels.");
});

test("an error or empty response shows nothing rather than guessing", () => {
  assert.equal(parsePlace(null), null);
  assert.equal(parsePlace({ error: { code: 403 } }), null);
  assert.equal(parsePlace({ reviews: "nope" }), null);
});
