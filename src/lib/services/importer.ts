import { lookup } from "node:dns/promises";
import net from "node:net";

/**
 * Secure server-side fetch + factual extraction for the internal Package
 * Importer. HTTPS-only, SSRF-protected (blocks private / link-local / loopback
 * targets after DNS resolution), size- and time-capped.
 *
 * Extraction returns FACTS only — the admin reviews and rewrites into original
 * ExpertzTrip copy. Nothing here is auto-published.
 */

const MAX_BYTES = 2_000_000; // 2 MB
const TIMEOUT_MS = 12_000;

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10) return true;
    if (a === 127) return true;                       // loopback
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;          // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true;          // private
    if (a === 100 && b >= 64 && b <= 127) return true;// CGNAT
    return false;
  }
  const v = ip.toLowerCase();
  if (v === "::1" || v === "::") return true;          // loopback / unspecified
  if (v.startsWith("fc") || v.startsWith("fd")) return true; // unique local
  if (v.startsWith("fe80")) return true;               // link-local
  if (v.startsWith("::ffff:")) return isPrivateIp(v.replace("::ffff:", "")); // mapped v4
  return false;
}

export type FetchResult =
  | { ok: true; html: string; finalUrl: string; host: string }
  | { ok: false; error: string };

export async function safeFetchHtml(rawUrl: string): Promise<FetchResult> {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return { ok: false, error: "That doesn't look like a valid URL." };
  }
  if (url.protocol !== "https:") {
    return { ok: false, error: "Only https:// URLs are allowed." };
  }
  const host = url.hostname;
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    return { ok: false, error: "That host is not allowed." };
  }

  // Resolve DNS and reject private / internal targets (SSRF protection).
  try {
    const results = await lookup(host, { all: true });
    if (!results.length) return { ok: false, error: "Could not resolve that host." };
    if (results.some((r) => isPrivateIp(r.address))) {
      return { ok: false, error: "That address is not allowed." };
    }
  } catch {
    return { ok: false, error: "Could not resolve that host." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "ExpertzTripImporter/1.0 (+internal research tool)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return { ok: false, error: `Unable to read this page (HTTP ${res.status}).` };
    const ctype = res.headers.get("content-type") ?? "";
    if (!ctype.includes("html")) return { ok: false, error: "That URL did not return an HTML page." };

    // Read with a size cap.
    const reader = res.body?.getReader();
    if (!reader) return { ok: false, error: "Unable to read this page." };
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.length;
        if (total > MAX_BYTES) { reader.cancel(); break; }
        chunks.push(value);
      }
    }
    const html = new TextDecoder("utf-8").decode(concat(chunks));
    return { ok: true, html, finalUrl: res.url || url.toString(), host };
  } catch (e) {
    if ((e as Error).name === "AbortError") return { ok: false, error: "The page took too long to respond." };
    return { ok: false, error: "Unable to read this page." };
  } finally {
    clearTimeout(timer);
  }
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

// ── Extraction ──────────────────────────────────────────────
const NA = "Not published on source.";

export type ExtractedFacts = {
  name: string | null;
  summary: string | null;
  priceCandidates: number[];
  durationNights: number | null;
  durationDays: number | null;
  headings: string[];
  listItems: string[];
  imageUrls: string[];
  destinationGuess: string | null;
  note: string;
};

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&rsquo;/g, "'").replace(/&#x27;/g, "'");
}
function firstMatch(re: RegExp, s: string): string | null {
  const m = re.exec(s);
  return m ? decodeEntities(m[1].trim()) : null;
}

export function extractFacts(html: string): ExtractedFacts {
  const facts: ExtractedFacts = {
    name: null, summary: null, priceCandidates: [], durationNights: null, durationDays: null,
    headings: [], listItems: [], imageUrls: [], destinationGuess: null, note: "",
  };

  // JSON-LD (most reliable, structured)
  const ldBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const b of ldBlocks) {
    try {
      const parsed = JSON.parse(b[1].trim());
      const nodes = Array.isArray(parsed) ? parsed : (parsed["@graph"] ?? [parsed]);
      for (const node of nodes) {
        const t = String(node["@type"] ?? "").toLowerCase();
        if (!facts.name && node.name && (t.includes("product") || t.includes("trip") || t.includes("tour") || t.includes("event"))) {
          facts.name = decodeEntities(String(node.name)).slice(0, 120);
        }
        if (!facts.summary && node.description) facts.summary = decodeEntities(stripTags(String(node.description))).slice(0, 400);
        const offers = node.offers ? (Array.isArray(node.offers) ? node.offers : [node.offers]) : [];
        for (const off of offers) {
          const p = Number(String(off.price ?? off.lowPrice ?? "").replace(/[^\d.]/g, ""));
          if (p > 0) facts.priceCandidates.push(Math.round(p));
        }
        if (node.image) {
          const imgs = Array.isArray(node.image) ? node.image : [node.image];
          for (const im of imgs) { const u = typeof im === "string" ? im : im?.url; if (u) facts.imageUrls.push(u); }
        }
      }
    } catch { /* ignore malformed json-ld */ }
  }

  // Title / og:title
  if (!facts.name) {
    const raw =
      firstMatch(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i, html) ??
      firstMatch(/<h1[^>]*>([\s\S]*?)<\/h1>/i, html) ??
      firstMatch(/<title[^>]*>([\s\S]*?)<\/title>/i, html);
    facts.name = raw ? stripTags(raw).slice(0, 120) : null;
  }
  // Description / og:description
  if (!facts.summary) {
    facts.summary =
      firstMatch(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i, html) ??
      firstMatch(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i, html);
    if (facts.summary) facts.summary = facts.summary.slice(0, 400);
  }

  // Duration — "5 Nights / 6 Days", "5N/6D", "5 Nights 6 Days"
  const dur = /(\d{1,2})\s*(?:nights?|n)\s*[\/&,-]?\s*(\d{1,2})\s*(?:days?|d)/i.exec(stripTags(html));
  if (dur) { facts.durationNights = Number(dur[1]); facts.durationDays = Number(dur[2]); }

  // Prices — ₹ / Rs / INR followed by a number (collect plausible package prices)
  const priceRe = /(?:₹|rs\.?|inr)\s*([\d,]{3,})/gi;
  const text = stripTags(html);
  let pm: RegExpExecArray | null;
  const seen = new Set(facts.priceCandidates);
  while ((pm = priceRe.exec(text)) !== null) {
    const n = Number(pm[1].replace(/,/g, ""));
    if (n >= 1000 && n <= 5_000_000 && !seen.has(n)) { seen.add(n); facts.priceCandidates.push(n); }
  }
  facts.priceCandidates = facts.priceCandidates.slice(0, 8);

  // Headings (h2/h3) — factual section labels only
  facts.headings = [...html.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi)]
    .map((m) => stripTags(m[1])).filter((h) => h.length >= 3 && h.length <= 80).slice(0, 20);

  // List items — candidate inclusions/facts (admin selects & rewrites)
  facts.listItems = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((m) => decodeEntities(stripTags(m[1])))
    .filter((t) => t.length >= 4 && t.length <= 120)
    .filter((t, i, a) => a.indexOf(t) === i)
    .slice(0, 40);

  // Image urls (research only — not auto-published)
  const ogImg = firstMatch(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i, html);
  if (ogImg) facts.imageUrls.unshift(ogImg);
  facts.imageUrls = facts.imageUrls.filter((u, i, a) => a.indexOf(u) === i).slice(0, 12);

  if (!facts.name && !facts.summary && facts.priceCandidates.length === 0 && facts.listItems.length === 0) {
    facts.note = "Page content could not be reliably extracted (it may be JavaScript-rendered).";
  } else if (!facts.durationNights || facts.priceCandidates.length === 0) {
    facts.note = "Some information is missing — fields marked below need manual entry.";
  }

  return facts;
}

export const NOT_ON_SOURCE = NA;

/** Cleaned, readable page text for AI extraction (scripts/styles/tags removed, capped). */
export function extractMainText(html: string, cap = 14000): string {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  return decodeEntities(stripTags(cleaned)).slice(0, cap);
}

/**
 * Discover candidate package/tour detail links from a listing/index page.
 * Heuristic + same-registrable-site only. Returns absolute HTTPS URLs.
 */
export function discoverPackageLinks(html: string, baseUrl: string, limit = 80): string[] {
  let base: URL;
  try { base = new URL(baseUrl); } catch { return []; }
  const KEYWORDS = /(package|holiday|tour|itinerary|trip|nights?-?\d|\d-?nights?|\d-?days?)/i;
  const out = new Set<string>();
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>/gi)) {
    let href = m[1].trim();
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) continue;
    let abs: URL;
    try { abs = new URL(href, base); } catch { continue; }
    if (abs.protocol !== "https:") continue;
    // same site only (compare registrable-ish: hostname endsWith base host or vice-versa)
    if (abs.hostname !== base.hostname) continue;
    const path = abs.pathname.toLowerCase();
    if (!KEYWORDS.test(path)) continue;
    // skip obvious non-detail paths
    if (/\/(category|tag|blog|about|contact|privacy|terms|login|cart|wp-|feed)\b/.test(path)) continue;
    // skip flights & other non-holiday-package products (only packages/tours import)
    if (/(flights?|air-?fare|air-?ticket|airline|visa|forex|insurance|cabs?|taxi|bus|trains?|car-?rental|hotels?-only|homestays?-only)\b/.test(path)) continue;
    abs.hash = "";
    out.add(abs.toString());
    if (out.size >= limit) break;
  }
  return [...out];
}
