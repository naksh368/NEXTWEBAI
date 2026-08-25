import { test } from "node:test";
import assert from "node:assert/strict";
import { isVersionSellable } from "../src/lib/package-availability";

/**
 * Regression: a package published via the admin has package.status = PUBLISHED
 * but its current version's isPublished flag can still be false. Pricing/booking
 * must treat it as sellable, otherwise the customer sees
 * "This package is no longer available" and Continue to book is disabled.
 */

test("explicitly published version is sellable", () => {
  assert.equal(isVersionSellable({ isPublished: true, packageStatus: "DRAFT", packageCurrentVersionId: "other", versionId: "v1" }), true);
});

test("current version of a PUBLISHED package is sellable even when version.isPublished is false (the bug)", () => {
  assert.equal(isVersionSellable({ isPublished: false, packageStatus: "PUBLISHED", packageCurrentVersionId: "v1", versionId: "v1" }), true);
});

test("unpublished version of a DRAFT package is NOT sellable", () => {
  assert.equal(isVersionSellable({ isPublished: false, packageStatus: "DRAFT", packageCurrentVersionId: "v1", versionId: "v1" }), false);
});

test("an old (non-current) version of a published package is NOT sellable", () => {
  assert.equal(isVersionSellable({ isPublished: false, packageStatus: "PUBLISHED", packageCurrentVersionId: "v2", versionId: "v1" }), false);
});

test("a PAUSED/ARCHIVED package version is NOT sellable", () => {
  assert.equal(isVersionSellable({ isPublished: false, packageStatus: "PAUSED", packageCurrentVersionId: "v1", versionId: "v1" }), false);
  assert.equal(isVersionSellable({ isPublished: false, packageStatus: "ARCHIVED", packageCurrentVersionId: "v1", versionId: "v1" }), false);
});
