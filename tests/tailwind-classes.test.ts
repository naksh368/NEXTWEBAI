import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Tailwind 3 only generates opacity modifiers on its scale (0, 5, 10 … 100).
// Anything else, e.g. `from-brand-navy/92`, silently produces no CSS — which
// once left white text on a bright photo. Arbitrary values (`/[0.92]`) are fine.
const SCALE = new Set(Array.from({ length: 21 }, (_, i) => String(i * 5)));
const MODIFIER = /\b(?:bg|text|border|ring|from|via|to|fill|stroke|shadow|outline|decoration|divide|placeholder|caret|accent)-[a-zA-Z]+(?:-[a-zA-Z0-9]+)*\/(\d+)\b/g;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(tsx?|css)$/.test(name) ? [path] : [];
  });
}

test("every Tailwind opacity modifier is one Tailwind actually generates", () => {
  const bad: string[] = [];
  for (const file of sourceFiles(join(__dirname, "..", "src"))) {
    for (const match of readFileSync(file, "utf8").matchAll(MODIFIER)) {
      if (!SCALE.has(match[1])) bad.push(`${file}: ${match[0]}`);
    }
  }
  assert.deepEqual(bad, []);
});
