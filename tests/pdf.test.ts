import { test } from "node:test";
import assert from "node:assert/strict";
import { PdfDoc, readJpeg, textWidth, toWinAnsi, wrapText } from "../src/lib/pdf";

test("toWinAnsi turns the rupee sign into readable ASCII", () => {
  // The standard PDF fonts have no ₹ glyph, so it must be transliterated
  // rather than silently dropped (which would print "22,600" with no currency).
  assert.equal(toWinAnsi("₹22,600"), "INR 22,600");
});

test("toWinAnsi normalises typographic punctuation", () => {
  assert.equal(toWinAnsi("Havelock — Neil"), "Havelock  -  Neil");
  assert.equal(toWinAnsi("Havelock’s coast"), "Havelock's coast");
  assert.equal(toWinAnsi("“quoted”"), '"quoted"');
});

test("toWinAnsi strips accents rather than emitting mojibake", () => {
  assert.equal(toWinAnsi("café"), "cafe");
});

test("toWinAnsi drops characters it cannot represent", () => {
  const out = toWinAnsi("Andaman 🏝 Islands");
  assert.ok(!/[^\x20-\x7e]/.test(out), `unexpected non-ASCII in ${JSON.stringify(out)}`);
  assert.ok(out.includes("Andaman"));
  assert.ok(out.includes("Islands"));
});

test("textWidth grows with the string and with the point size", () => {
  const a = textWidth("Andaman", "Helvetica", 10);
  const b = textWidth("Andaman Islands", "Helvetica", 10);
  assert.ok(b > a);
  assert.ok(textWidth("Andaman", "Helvetica", 20) > a);
  // Bold is wider than regular at the same size.
  assert.ok(textWidth("Andaman", "Helvetica-Bold", 10) > a);
});

test("wrapText never produces a line wider than the column", () => {
  const text =
    "Inter-island ferry timings are allotted by the operators and can be changed or cancelled " +
    "at short notice because of sea conditions.";
  const maxWidth = 200;
  const lines = wrapText(text, "Helvetica", 9, maxWidth);
  assert.ok(lines.length > 1, "long text should wrap");
  for (const line of lines) {
    assert.ok(
      textWidth(line, "Helvetica", 9) <= maxWidth + 0.01,
      `line too wide: ${JSON.stringify(line)}`
    );
  }
});

test("wrapText breaks a single over-long word instead of overflowing", () => {
  const lines = wrapText("A".repeat(400), "Helvetica", 10, 100);
  assert.ok(lines.length > 1);
  for (const line of lines) assert.ok(textWidth(line, "Helvetica", 10) <= 100.01);
});

test("wrapText preserves explicit line breaks", () => {
  assert.deepEqual(wrapText("one\ntwo", "Helvetica", 10, 500), ["one", "two"]);
});

test("readJpeg rejects data that is not a JPEG", () => {
  assert.equal(readJpeg(Buffer.from("not an image")), null);
  // A PNG signature must not be mistaken for a JPEG.
  assert.equal(readJpeg(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), null);
});

test("readJpeg reads dimensions from an SOF0 marker", () => {
  // SOI, then a minimal SOF0 frame: 8-bit, 120 high, 240 wide, 3 channels.
  const jpeg = Buffer.from([
    0xff, 0xd8,
    0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x78, 0x00, 0xf0, 0x03,
    0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
  ]);
  const info = readJpeg(jpeg);
  assert.ok(info, "expected the SOF0 frame to be parsed");
  assert.equal(info.width, 240);
  assert.equal(info.height, 120);
  assert.equal(info.channels, 3);
  assert.equal(info.bits, 8);
});

test("a built document is a valid, single-page PDF", () => {
  const doc = new PdfDoc();
  doc.text("Andaman 3 Star Package", { font: "Helvetica-Bold", size: 18 });
  doc.text("5 nights / 6 days across Port Blair, Havelock and Neil.");
  const out = doc.build();
  const head = out.subarray(0, 8).toString("latin1");

  assert.ok(head.startsWith("%PDF-1.4"), `bad header: ${head}`);
  assert.ok(out.subarray(-6).toString("latin1").includes("%%EOF"), "missing EOF marker");
  assert.equal((out.toString("latin1").match(/\/Type \/Page[^s]/g) ?? []).length, 1);
});

test("content longer than a page paginates and the footer numbers every page", () => {
  const doc = new PdfDoc();
  for (let i = 0; i < 160; i++) doc.text(`Day ${i}: a line of itinerary text that takes up vertical space.`);
  const out = doc.build((page, total) => ({ left: "JST Andaman Travels", right: `Page ${page} of ${total}` }));
  const text = out.toString("latin1");

  const pageCount = (text.match(/\/Type \/Page[^s]/g) ?? []).length;
  assert.ok(pageCount > 1, `expected multiple pages, got ${pageCount}`);
  assert.ok(text.includes(`Page 1 of ${pageCount}`), "first page footer missing");
  assert.ok(text.includes(`Page ${pageCount} of ${pageCount}`), "last page footer missing");
});

test("every page object points at the real /Pages object", () => {
  const doc = new PdfDoc();
  for (let i = 0; i < 120; i++) doc.text("filler line to force a second page");
  const text = doc.build().toString("latin1");

  // The writer uses a placeholder for /Parent until the page tree exists;
  // none may survive into the output, or readers reject the file.
  assert.ok(!text.includes("__PAGES_PARENT__"), "unresolved /Parent placeholder");

  const parents = [...text.matchAll(/\/Parent (\d+) 0 R/g)].map((m) => m[1]);
  assert.ok(parents.length > 0);
  const pagesId = parents[0];
  assert.ok(parents.every((p) => p === pagesId), "pages disagree about their parent");
  assert.ok(new RegExp(`${pagesId} 0 obj\\n<< /Type /Pages`).test(text), "/Parent does not point at a /Pages object");
});

test("xref offsets point at the start of each object", () => {
  const doc = new PdfDoc();
  doc.text("Reference check");
  const out = doc.build();
  const text = out.toString("latin1");

  const xrefStart = Number(text.slice(text.lastIndexOf("startxref") + 9).trim().split("\n")[0]);
  assert.ok(Number.isFinite(xrefStart) && xrefStart > 0, "startxref missing");
  assert.equal(text.slice(xrefStart, xrefStart + 4), "xref", "startxref does not point at the xref table");

  const rows = text.slice(xrefStart).split("\n").filter((l) => /^\d{10} \d{5} n\s*$/.test(l));
  assert.ok(rows.length > 0, "no in-use xref entries");
  rows.forEach((row, i) => {
    const offset = Number(row.slice(0, 10));
    assert.ok(
      text.startsWith(`${i + 1} 0 obj`, offset),
      `xref entry ${i + 1} points at ${JSON.stringify(text.slice(offset, offset + 12))}`
    );
  });
});

test("parentheses and backslashes in content are escaped, not left to break the syntax", () => {
  const doc = new PdfDoc();
  doc.text("Havelock (Swaroop Dweep) \\ Neil");
  const text = doc.build().toString("latin1");
  assert.ok(text.includes("Havelock \\(Swaroop Dweep\\)"), "unescaped parentheses would corrupt the stream");
});
