import { promises as fs } from "node:fs";
import path from "node:path";
import { db } from "./db";

/**
 * Image loading for server-generated PDFs.
 *
 * The PDF writer embeds JPEG bytes directly, so every source has to arrive as
 * a JPEG. Three sources are supported, and each one fails soft — a photograph
 * that cannot be fetched is simply left out, never allowed to break the
 * document.
 */

const FETCH_TIMEOUT_MS = 6000;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function isJpeg(bytes: Buffer): boolean {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[bytes.length - 2] === 0xff;
}

/** Ask an Unsplash URL for a JPEG at roughly the size the PDF will draw. */
function normaliseRemote(url: string, targetWidth: number): string {
  try {
    const u = new URL(url);
    if (u.hostname.endsWith("images.unsplash.com")) {
      u.searchParams.set("fm", "jpg");
      u.searchParams.set("w", String(targetWidth));
      u.searchParams.set("q", "72");
      u.searchParams.set("fit", "crop");
      u.searchParams.delete("auto"); // `auto=format` can return WebP/AVIF
    }
    return u.toString();
  } catch {
    return url;
  }
}

async function loadRemote(url: string, targetWidth: number): Promise<Buffer | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(normaliseRemote(url, targetWidth), {
      signal: controller.signal,
      headers: { Accept: "image/jpeg" },
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (type && !type.includes("jpeg") && !type.includes("jpg")) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > MAX_IMAGE_BYTES || !isJpeg(bytes)) return null;
    return bytes;
  } catch {
    return null; // timeout, DNS, TLS — the PDF just omits this photograph
  } finally {
    clearTimeout(timer);
  }
}

/** A media-library asset stored in the database (served at /api/media/<id>). */
async function loadMediaAsset(id: string): Promise<Buffer | null> {
  try {
    const asset = await db.mediaAsset.findUnique({ where: { id }, select: { data: true, contentType: true } });
    if (!asset) return null;
    const bytes = Buffer.from(asset.data);
    return isJpeg(bytes) ? bytes : null; // PNG/WebP cannot go in as DCTDecode
  } catch {
    return null;
  }
}

/** A file shipped in /public. */
async function loadLocal(relativePath: string): Promise<Buffer | null> {
  try {
    const safe = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
    const bytes = await fs.readFile(path.join(process.cwd(), "public", safe));
    return isJpeg(bytes) ? bytes : null;
  } catch {
    return null;
  }
}

/**
 * Resolve any image reference the app stores — an absolute URL, a
 * `/api/media/<id>` reference, or a path in /public — to JPEG bytes.
 */
export async function loadImageBytes(src: string, targetWidth = 900): Promise<Buffer | null> {
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) return loadRemote(src, targetWidth);

  const media = src.match(/^\/api\/media\/([A-Za-z0-9_-]+)/);
  if (media) return loadMediaAsset(media[1]);

  if (src.startsWith("/")) return loadLocal(src.slice(1));
  return null;
}

/** Load several images at once, preserving order; failures become null. */
export async function loadImages(sources: string[], targetWidth = 900): Promise<(Buffer | null)[]> {
  return Promise.all(sources.map((s) => loadImageBytes(s, targetWidth)));
}

/** The flattened, JPEG copy of the brand logo used on PDF mastheads. */
export const PDF_LOGO_PATH = "brand/jst-andaman-travels-logo-print.jpg";

export async function loadBrandLogo(): Promise<Buffer | null> {
  return loadLocal(PDF_LOGO_PATH);
}
