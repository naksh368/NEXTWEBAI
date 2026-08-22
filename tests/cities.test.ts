import { test } from "node:test";
import assert from "node:assert/strict";
import { searchCities, INDIAN_CITIES } from "../src/lib/data/indian-cities";

test("empty query returns popular cities", () => {
  const r = searchCities("");
  assert.ok(r.length > 0);
  assert.ok(r.every((c) => c.popular));
});

test("'del' finds New Delhi", () => {
  const r = searchCities("del");
  assert.equal(r[0].city, "New Delhi");
});

test("'mum' finds Mumbai", () => {
  assert.equal(searchCities("mum")[0].city, "Mumbai");
});

test("'goa' finds Goa exactly", () => {
  assert.equal(searchCities("goa")[0].city, "Goa");
});

test("alias 'bangalore' finds Bengaluru", () => {
  assert.equal(searchCities("bangalore")[0].city, "Bengaluru");
});

test("airport code 'blr' finds Bengaluru", () => {
  assert.equal(searchCities("blr")[0].city, "Bengaluru");
});

test("nonsense query returns nothing", () => {
  assert.equal(searchCities("zzzzzznope").length, 0);
});

test("results never duplicate a city", () => {
  const r = searchCities("a", 20);
  const names = r.map((c) => c.city);
  assert.equal(names.length, new Set(names).size);
});

test("dataset has no duplicate city+state rows", () => {
  const keys = INDIAN_CITIES.map((c) => `${c.city}|${c.state}`);
  assert.equal(keys.length, new Set(keys).size);
});
