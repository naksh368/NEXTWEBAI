/**
 * A tiny, dependency-free PDF writer.
 *
 * Why hand-rolled: generating the itinerary as a real .pdf file needs to work
 * on a serverless Node runtime, where a headless browser is not available and
 * a rendering library is a heavy dependency for one document. PDF's text model
 * is simple enough that the standard (built-in) Helvetica faces cover an
 * itinerary properly — no font embedding, no binary assets, deterministic
 * output, and nothing new in package.json.
 *
 * Scope and limits:
 *  · Text, headings, bullets, rules, filled boxes, page numbers and JPEG
 *    images (embedded losslessly via /DCTDecode — the bytes go in as-is, so
 *    there is no decoding or re-encoding to do).
 *  · Standard Helvetica / Helvetica-Bold in WinAnsi encoding, so the text is
 *    transliterated to Latin-1 first (see `toWinAnsi`) — "₹" becomes "INR",
 *    curly quotes become straight ones, and so on. Glyphs the encoding has no
 *    answer for are dropped rather than rendered as mojibake.
 *  · No images, tables or colour profiles. Those belong in the HTML print view.
 */

const PT_PER_MM = 2.834645669;
export const A4 = { width: 595.28, height: 841.89 };

type FontName = "Helvetica" | "Helvetica-Bold";

/**
 * Adobe's standard character widths (per 1000 units) for the two base faces,
 * for ASCII 32–126. Everything else falls back to the average below, which is
 * only reachable for characters `toWinAnsi` could not simplify.
 */
const W_REGULAR: Record<number, number> = {};
const W_BOLD: Record<number, number> = {};
const FALLBACK_WIDTH = 556;

function loadWidths(target: Record<number, number>, start: number, widths: number[]) {
  widths.forEach((w, i) => { target[start + i] = w; });
}

// 32 (space) … 126 (~)
loadWidths(W_REGULAR, 32, [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
]);
loadWidths(W_BOLD, 32, [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
  975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
  333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
  611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
]);

/**
 * Reduce arbitrary text to what WinAnsi can actually show. Typographic
 * characters we deliberately use elsewhere on the site (₹, —, ·, curly quotes)
 * get readable ASCII equivalents rather than being dropped.
 */
export function toWinAnsi(input: string): string {
  const map: Record<string, string> = {
    "₹": "INR ", // ₹
    "—": " - ",  // em dash
    "–": "-",    // en dash
    "‘": "'", "’": "'",
    "“": '"', "”": '"',
    "·": "-",    // middle dot
    "•": "-",    // bullet
    "…": "...",
    " ": " ",
    "→": "->",
    "×": "x",
    "✓": "+",
    "©": "(c)",
  };
  let out = "";
  for (const ch of input.normalize("NFC")) {
    if (map[ch] !== undefined) { out += map[ch]; continue; }
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 32 && code <= 126) { out += ch; continue; }
    if (code === 10) { out += "\n"; continue; }
    // Strip accents where we can, otherwise drop the character.
    const stripped = ch.normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (stripped.length === 1) {
      const c = stripped.codePointAt(0) ?? 0;
      if (c >= 32 && c <= 126) { out += stripped; continue; }
    }
  }
  return out;
}

/** Width of an already-WinAnsi string, in points. */
export function textWidth(text: string, font: FontName, size: number): number {
  const table = font === "Helvetica-Bold" ? W_BOLD : W_REGULAR;
  let units = 0;
  for (let i = 0; i < text.length; i++) units += table[text.charCodeAt(i)] ?? FALLBACK_WIDTH;
  return (units * size) / 1000;
}

/** Greedy word wrap to a maximum line width. */
export function wrapText(text: string, font: FontName, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of toWinAnsi(text).split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) { lines.push(""); continue; }
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (textWidth(candidate, font, size) <= maxWidth) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        // A single word longer than the column is broken on character count.
        if (textWidth(word, font, size) > maxWidth) {
          let chunk = "";
          for (const ch of word) {
            if (textWidth(chunk + ch, font, size) > maxWidth) { lines.push(chunk); chunk = ch; }
            else chunk += ch;
          }
          line = chunk;
        } else {
          line = word;
        }
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

/** Escape the three characters that are special inside a PDF string literal. */
function pdfString(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export type RGB = [number, number, number];

export type JpegInfo = { width: number; height: number; channels: number; bits: number };

/**
 * Read the dimensions and colour model out of a JPEG's SOF marker.
 *
 * Returns null for anything that is not a baseline/progressive JPEG we can
 * embed (a PNG, a WebP, a truncated download), so the caller can simply skip
 * the image rather than produce a corrupt PDF.
 */
export function readJpeg(bytes: Buffer): JpegInfo | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null; // not SOI
  let i = 2;
  while (i < bytes.length - 1) {
    if (bytes[i] !== 0xff) { i++; continue; }
    const marker = bytes[i + 1];
    i += 2;
    // Standalone markers carry no length.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (marker === 0xd9 || marker === 0xda) break; // EOI or start of scan
    if (i + 1 >= bytes.length) break;
    const length = bytes.readUInt16BE(i);
    // SOF0..SOF15, excluding the non-frame markers DHT (c4), JPG (c8), DAC (cc).
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      if (i + 7 >= bytes.length) return null;
      return {
        bits: bytes[i + 2],
        height: bytes.readUInt16BE(i + 3),
        width: bytes.readUInt16BE(i + 5),
        channels: bytes[i + 7],
      };
    }
    i += length;
  }
  return null;
}

/**
 * Builds a multi-page document. Coordinates are in points from the top-left,
 * which the writer converts to PDF's bottom-left origin.
 */
export class PdfDoc {
  private pages: string[] = [];
  private current: string[] = [];
  /** Embedded JPEGs, keyed by the /Im<n> name used in the content stream. */
  private images: { name: string; bytes: Buffer; info: JpegInfo }[] = [];
  readonly width = A4.width;
  readonly height = A4.height;
  readonly margin = 20 * PT_PER_MM;
  /** Vertical cursor, measured down from the top of the page. */
  y = 0;

  constructor() {
    this.newPage();
  }

  get contentWidth(): number {
    return this.width - this.margin * 2;
  }

  newPage() {
    if (this.current.length) this.pages.push(this.current.join("\n"));
    this.current = [];
    this.y = this.margin;
  }

  /** Start a new page when `needed` points would not fit above the footer. */
  ensure(needed: number) {
    if (this.y + needed > this.height - this.margin - 26) this.newPage();
  }

  private op(line: string) {
    this.current.push(line);
  }

  private pdfY(topY: number): number {
    return this.height - topY;
  }

  /**
   * Place a JPEG. Returns false when the bytes are not an embeddable JPEG, so
   * a failed image never breaks the document — the layout just carries on.
   */
  image(bytes: Buffer, x: number, topY: number, w: number, h: number): boolean {
    const info = readJpeg(bytes);
    if (!info || !info.width || !info.height) return false;
    const name = `Im${this.images.length + 1}`;
    this.images.push({ name, bytes, info });
    this.op(
      `q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${(this.pdfY(topY) - h).toFixed(2)} cm /${name} Do Q`
    );
    return true;
  }

  /**
   * Place a JPEG cropped to fill a box (object-fit: cover), so photographs of
   * any aspect ratio sit in a consistent grid without distortion.
   */
  imageCover(bytes: Buffer, x: number, topY: number, boxW: number, boxH: number): boolean {
    const info = readJpeg(bytes);
    if (!info || !info.width || !info.height) return false;
    const scale = Math.max(boxW / info.width, boxH / info.height);
    const drawW = info.width * scale;
    const drawH = info.height * scale;
    const offsetX = x - (drawW - boxW) / 2;
    const offsetY = topY - (drawH - boxH) / 2;

    const name = `Im${this.images.length + 1}`;
    this.images.push({ name, bytes, info });
    // Clip to the box, then draw the oversized image behind it.
    this.op(
      `q ${x.toFixed(2)} ${(this.pdfY(topY) - boxH).toFixed(2)} ${boxW.toFixed(2)} ${boxH.toFixed(2)} re W n ` +
        `${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${offsetX.toFixed(2)} ${(this.pdfY(offsetY) - drawH).toFixed(2)} cm /${name} Do Q`
    );
    return true;
  }

  rect(x: number, topY: number, w: number, h: number, color: RGB) {
    const [r, g, b] = color;
    this.op(`q ${r} ${g} ${b} rg ${x.toFixed(2)} ${(this.pdfY(topY) - h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f Q`);
  }

  line(x1: number, topY: number, x2: number, color: RGB, thickness = 0.7) {
    const [r, g, b] = color;
    const y = this.pdfY(topY).toFixed(2);
    this.op(`q ${r} ${g} ${b} RG ${thickness} w ${x1.toFixed(2)} ${y} m ${x2.toFixed(2)} ${y} l S Q`);
  }

  /** Draw one already-wrapped line at an absolute position. */
  drawLine(text: string, x: number, topY: number, font: FontName, size: number, color: RGB) {
    const [r, g, b] = color;
    this.op(
      `BT /${font === "Helvetica-Bold" ? "F2" : "F1"} ${size} Tf ${r} ${g} ${b} rg ` +
        `1 0 0 1 ${x.toFixed(2)} ${(this.pdfY(topY) - size).toFixed(2)} Tm (${pdfString(text)}) Tj ET`
    );
  }

  /** Flow a paragraph at the cursor, paginating as needed. Returns the height used. */
  text(
    content: string,
    opts: { font?: FontName; size?: number; color?: RGB; leading?: number; x?: number; maxWidth?: number; gapAfter?: number } = {}
  ): void {
    const font = opts.font ?? "Helvetica";
    const size = opts.size ?? 10;
    const color = opts.color ?? [0.09, 0.17, 0.27];
    const leading = opts.leading ?? size * 1.42;
    const x = opts.x ?? this.margin;
    const maxWidth = opts.maxWidth ?? this.width - this.margin - x;

    for (const line of wrapText(content, font, size, maxWidth)) {
      this.ensure(leading);
      if (line) this.drawLine(line, x, this.y, font, size, color);
      this.y += leading;
    }
    this.y += opts.gapAfter ?? 0;
  }

  /** A bulleted list item with a hanging indent. */
  bullet(content: string, opts: { size?: number; color?: RGB; marker?: string; indent?: number } = {}) {
    const size = opts.size ?? 9.5;
    const color = opts.color ?? [0.25, 0.31, 0.39];
    const indent = opts.indent ?? 12;
    const marker = toWinAnsi(opts.marker ?? "-");
    const leading = size * 1.42;
    const lines = wrapText(content, "Helvetica", size, this.contentWidth - indent);

    lines.forEach((line, i) => {
      this.ensure(leading);
      if (i === 0) this.drawLine(marker, this.margin, this.y, "Helvetica-Bold", size, color);
      this.drawLine(line, this.margin + indent, this.y, "Helvetica", size, color);
      this.y += leading;
    });
  }

  /** Serialise the document to PDF bytes. */
  build(footer?: (page: number, total: number) => { left?: string; right?: string }): Buffer {
    if (this.current.length) { this.pages.push(this.current.join("\n")); this.current = []; }

    const total = this.pages.length;
    const streams = this.pages.map((content, i) => {
      if (!footer) return content;
      const f = footer(i + 1, total);
      const y = (this.height - (this.height - this.margin + 14)).toFixed(2);
      const parts = [content];
      const grey = "0.45 0.52 0.60 rg";
      if (f.left) {
        parts.push(`BT /F1 8 Tf ${grey} 1 0 0 1 ${this.margin.toFixed(2)} ${y} Tm (${pdfString(toWinAnsi(f.left))}) Tj ET`);
      }
      if (f.right) {
        const t = toWinAnsi(f.right);
        const x = this.width - this.margin - textWidth(t, "Helvetica", 8);
        parts.push(`BT /F1 8 Tf ${grey} 1 0 0 1 ${x.toFixed(2)} ${y} Tm (${pdfString(t)}) Tj ET`);
      }
      return parts.join("\n");
    });

    // ── Object assembly ──
    // Each object is either a text body or a binary stream (an embedded JPEG),
    // so the writer assembles the file from Buffers and tracks byte offsets
    // itself. Using string concatenation for a binary stream would corrupt it.
    const objects: Buffer[] = [];
    const add = (body: Buffer | string) => {
      objects.push(typeof body === "string" ? Buffer.from(body, "latin1") : body);
      return objects.length; // 1-based object number
    };

    const fontRegular = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
    const fontBold = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");

    // Embedded images, shared by every page's resource dictionary.
    const imageIds = this.images.map(({ bytes, info }) =>
      add(
        Buffer.concat([
          Buffer.from(
            `<< /Type /XObject /Subtype /Image /Width ${info.width} /Height ${info.height} ` +
              `/ColorSpace ${info.channels === 1 ? "/DeviceGray" : info.channels === 4 ? "/DeviceCMYK" : "/DeviceRGB"} ` +
              `/BitsPerComponent ${info.bits || 8} /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`,
            "latin1"
          ),
          bytes,
          Buffer.from("\nendstream", "latin1"),
        ])
      )
    );
    const xobjectDict = this.images.length
      ? ` /XObject << ${this.images.map((im, i) => `/${im.name} ${imageIds[i]} 0 R`).join(" ")} >>`
      : "";

    const pageIds: number[] = [];
    const parentPlaceholder = "__PAGES_PARENT__";
    for (const stream of streams) {
      const contentId = add(`<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`);
      pageIds.push(
        add(
          `<< /Type /Page /Parent ${parentPlaceholder} 0 R /MediaBox [0 0 ${this.width.toFixed(2)} ${this.height.toFixed(2)}] ` +
            `/Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >>${xobjectDict} >> /Contents ${contentId} 0 R >>`
        )
      );
    }

    const pagesId = add(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`);
    const catalogId = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

    // The /Pages id is only known once every page object exists, so page
    // objects are written with a placeholder and patched here.
    for (const id of pageIds) {
      objects[id - 1] = Buffer.from(objects[id - 1].toString("latin1").replace(parentPlaceholder, String(pagesId)), "latin1");
    }

    const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n%\u00E2\u00E3\u00CF\u00D3\n", "latin1")];
    let offset = chunks[0].length;
    const offsets: number[] = [];
    for (let i = 0; i < objects.length; i++) {
      offsets.push(offset);
      const head = Buffer.from(`${i + 1} 0 obj\n`, "latin1");
      const tail = Buffer.from("\nendobj\n", "latin1");
      chunks.push(head, objects[i], tail);
      offset += head.length + objects[i].length + tail.length;
    }

    let trailer = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (const off of offsets) trailer += `${String(off).padStart(10, "0")} 00000 n \n`;
    trailer += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${offset}\n%%EOF`;
    chunks.push(Buffer.from(trailer, "latin1"));

    return Buffer.concat(chunks);
  }
}

export const PDF_COLORS = {
  navy: [0.063, 0.169, 0.306] as RGB,
  blue: [0.031, 0.494, 0.729] as RGB,
  turquoise: [0.094, 0.722, 0.808] as RGB,
  orange: [0.949, 0.396, 0.208] as RGB,
  ink: [0.090, 0.169, 0.271] as RGB,
  muted: [0.388, 0.455, 0.541] as RGB,
  white: [1, 1, 1] as RGB,
  softBg: [0.965, 0.976, 0.988] as RGB,
  border: [0.886, 0.918, 0.945] as RGB,
};
