"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { authorize } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/services/audit-service";
import { slugify } from "@/lib/utils";
import { safeFetchHtml, extractFacts, extractMainText, discoverPackageLinks, type ExtractedFacts } from "@/lib/services/importer";
import { aiComplete, isAiConfigured } from "@/lib/services/ai-service";

type R<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string };

// AI-extracted structured package (facts + original rewritten copy).
export type AiPackage = {
  name: string | null;
  destinationName: string | null;
  country: string | null;
  durationNights: number | null;
  durationDays: number | null;
  category: string | null;
  bestFor: string | null;
  startingPrice: number | null;
  travelWindow: string | null;
  flightSector: string | null;
  roomCategory: string | null;
  mealPlan: string | null;
  baggage: string | null;
  summary: string | null;
  overview: string | null;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  itinerary: { day: number; title: string; description: string; items: AiDayItem[] }[];
  cityBreakdown: { city: string; nights: number }[];
  cancellationPolicy: string | null;
  importantTerms: string | null;
};

function normCityBreakdown(v: unknown): { city: string; nights: number }[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((it: Record<string, unknown>) => ({ city: (str(it.city) ?? "").slice(0, 60), nights: Math.max(0, Math.min(60, num(it.nights) ?? 0)) }))
    .filter((c) => c.city)
    .slice(0, 12);
}

// A single time-slotted itinerary item (powers the rich day-by-day layout).
type Timeslot = "MORNING" | "AFTERNOON" | "EVENING";
type ItemKind = "FLIGHT" | "TRANSFER" | "HOTEL" | "ACTIVITY" | "MEAL" | "FREE_TIME" | "NOTE";
export type AiDayItem = { timeslot: Timeslot; kind: ItemKind; title: string; description: string };

const TIMESLOTS = new Set<Timeslot>(["MORNING", "AFTERNOON", "EVENING"]);
const ITEM_KINDS = new Set<ItemKind>(["FLIGHT", "TRANSFER", "HOTEL", "ACTIVITY", "MEAL", "FREE_TIME", "NOTE"]);

function normItems(v: unknown): AiDayItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((it: Record<string, unknown>) => {
      const timeslot = String(it.timeslot ?? "").toUpperCase() as Timeslot;
      const kind = String(it.kind ?? "").toUpperCase() as ItemKind;
      return {
        timeslot: TIMESLOTS.has(timeslot) ? timeslot : "MORNING",
        kind: ITEM_KINDS.has(kind) ? kind : "ACTIVITY",
        title: (str(it.title) ?? "").slice(0, 160),
        description: (str(it.description) ?? "").slice(0, 600),
      } as AiDayItem;
    })
    .filter((it) => it.title)
    .slice(0, 8);
}

const EXTRACT_SYSTEM =
  "You are a data-extraction and copywriting assistant for ExpertzTrip, a premium Indian holiday brand. " +
  "You convert a scraped travel-package web page into STRUCTURED FACTS plus ORIGINAL ExpertzTrip copy. " +
  "Absolute rules: (1) NEVER invent facts — prices, hotels, inclusions, durations, reviews. Use null when the page doesn't state it. " +
  "(2) Do NOT copy the supplier's marketing sentences verbatim — REWRITE summary and overview into fresh, concise, original copy while keeping every fact accurate. " +
  "(3) Keep inclusions/exclusions/itinerary factual and faithful to the page. " +
  "(4) This is a HOLIDAY/TOUR PACKAGE importer only. If the page is a flight-only, hotel-only, visa, insurance, cab/bus/train or other non-package page, return {\"name\":null} and nothing else. " +
  "(5) Prices are Indian Rupees; return startingPrice as an integer number of rupees (no symbols/commas) or null.";

// Verbatim mode — reproduce the page's OWN words exactly (no rewriting).
const VERBATIM_SYSTEM =
  "You are a data-extraction assistant for ExpertzTrip. You convert a scraped travel-PACKAGE web page into STRUCTURED FACTS, copying the page's OWN wording EXACTLY. " +
  "Absolute rules: (1) NEVER invent facts — use null when the page doesn't state it. " +
  "(2) COPY VERBATIM — reproduce summary, overview and every itinerary day description using the EXACT words and sentences from the page. Do NOT paraphrase, summarise or rewrite. " +
  "(3) This is a HOLIDAY/TOUR PACKAGE importer only. If the page is a flight-only, hotel-only, visa, insurance, cab/bus/train or other non-package page, return {\"name\":null} and nothing else. " +
  "(4) Prices are Indian Rupees; return startingPrice as an integer number of rupees (no symbols/commas) or null.";

async function aiExtractPackage(text: string, verbatim = false): Promise<AiPackage | null> {
  if (!isAiConfigured()) return null;
  const copyRule = verbatim
    ? "Copy the page's EXACT wording: summary and overview must reproduce the page's own sentences verbatim, and each itinerary description must be the page's exact text. Do NOT paraphrase or rewrite anything."
    : "summary <= 280 chars; overview 2-3 short original paragraphs. Rewrite descriptions in original words.";
  const prompt = `Extract this travel package page into STRICT JSON with exactly these keys:
{"name":string|null,"destinationName":string|null,"country":string|null,"durationNights":number|null,"durationDays":number|null,"category":string|null,"bestFor":string|null,"startingPrice":number|null,"travelWindow":string|null,"flightSector":string|null,"roomCategory":string|null,"mealPlan":string|null,"baggage":string|null,"summary":string|null,"overview":string|null,"highlights":string[],"inclusions":string[],"exclusions":string[],"cityBreakdown":[{"city":string,"nights":number}],"itinerary":[{"day":number,"title":string,"description":string,"items":[{"timeslot":"MORNING"|"AFTERNOON"|"EVENING","kind":"FLIGHT"|"TRANSFER"|"HOTEL"|"ACTIVITY"|"MEAL"|"FREE_TIME"|"NOTE","title":string,"description":string}]}],"cancellationPolicy":string|null,"importantTerms":string|null}
category must be one of FIRST_ESCAPE, SIGNATURE, HONEYMOON, FAMILY, LUXURY, PREMIUM or null.
In cityBreakdown, list each city/place stayed with its number of nights, in travel order (e.g. [{"city":"Tromsø","nights":2},{"city":"Bergen","nights":2}]).
For EACH itinerary day, break the day into 2-4 time-slotted items (morning/afternoon/evening) with the right kind — this powers the day-by-day view. Only use activities actually mentioned on the page; if a slot is genuinely free, use kind FREE_TIME.
For any FLIGHT item, include the route and any flight times stated on the page in its description (e.g. "Delhi → Oslo, dep 02:15 arr 07:40"). Put the overall flight route in flightSector.
${copyRule}
If this is not a holiday/tour package (e.g. a flight, hotel-only, visa or insurance page), return {"name":null}.
Return ONLY the JSON object, no prose.

PAGE CONTENT:
${text}`;
  const out = await aiComplete(prompt, { system: verbatim ? VERBATIM_SYSTEM : EXTRACT_SYSTEM, maxTokens: 2200, temperature: verbatim ? 0 : 0.25, timeoutMs: 22_000 });
  return parseAiPackage(out);
}

/** Parse a model's JSON reply into a normalized AiPackage (null on any failure). */
function parseAiPackage(out: string | null): AiPackage | null {
  if (!out) return null;
  try {
    const json = out.match(/\{[\s\S]*\}/);
    if (!json) return null;
    const p = JSON.parse(json[0]);
    return {
      name: str(p.name), destinationName: str(p.destinationName), country: str(p.country),
      durationNights: num(p.durationNights), durationDays: num(p.durationDays),
      category: str(p.category), bestFor: str(p.bestFor), startingPrice: num(p.startingPrice),
      travelWindow: str(p.travelWindow), flightSector: str(p.flightSector),
      roomCategory: str(p.roomCategory), mealPlan: str(p.mealPlan), baggage: str(p.baggage),
      summary: str(p.summary), overview: str(p.overview),
      highlights: arr(p.highlights), inclusions: arr(p.inclusions), exclusions: arr(p.exclusions),
      itinerary: Array.isArray(p.itinerary)
        ? p.itinerary.slice(0, 30).map((d: Record<string, unknown>, i: number) => ({
            day: num(d.day) ?? i + 1, title: (str(d.title) ?? `Day ${i + 1}`).slice(0, 120), description: (str(d.description) ?? "").slice(0, 1000),
            items: normItems(d.items),
          }))
        : [],
      cityBreakdown: normCityBreakdown(p.cityBreakdown),
      cancellationPolicy: str(p.cancellationPolicy), importantTerms: str(p.importantTerms),
    };
  } catch {
    return null;
  }
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => (typeof v === "number" && isFinite(v) ? Math.round(v) : (typeof v === "string" && v.replace(/[^\d]/g, "") ? Number(v.replace(/[^\d]/g, "")) : null));
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()).map((x: string) => x.trim().slice(0, 200)).slice(0, 40) : []);

// ── Scan a single supplier / public package URL (admin only) ───────
export async function scanSource(rawUrl: string, verbatim = false): Promise<R<{ facts: ExtractedFacts; ai: AiPackage | null; aiConfigured: boolean; host: string; sourceUrl: string; imageUrls: string[] }>> {
  const admin = await authorize("package.create");
  if (!admin) return { ok: false, error: "You don't have permission to import packages." };

  const parsed = z.string().url().max(2048).safeParse((rawUrl ?? "").trim());
  if (!parsed.success) return { ok: false, error: "Enter a valid https:// package URL." };

  const fetched = await safeFetchHtml(parsed.data);
  if (!fetched.ok) return { ok: false, error: fetched.error };

  const facts = extractFacts(fetched.html);
  const ai = await aiExtractPackage(extractMainText(fetched.html), verbatim);

  await writeAudit({
    adminUserId: admin.id,
    action: "package.import.scan",
    resource: `Import:${fetched.host}`,
    after: { sourceUrl: fetched.finalUrl, ai: Boolean(ai), name: ai?.name ?? facts.name },
  });

  return { ok: true, facts, ai, aiConfigured: isAiConfigured(), host: fetched.host, sourceUrl: fetched.finalUrl, imageUrls: facts.imageUrls };
}

// ── Discover package links on a listing page (admin only) ──────────
export async function scanListing(rawUrl: string): Promise<R<{ links: string[]; host: string }>> {
  const admin = await authorize("package.create");
  if (!admin) return { ok: false, error: "You don't have permission." };
  const parsed = z.string().url().max(2048).safeParse((rawUrl ?? "").trim());
  if (!parsed.success) return { ok: false, error: "Enter a valid https:// URL." };

  const fetched = await safeFetchHtml(parsed.data);
  if (!fetched.ok) return { ok: false, error: fetched.error };
  const links = discoverPackageLinks(fetched.html, fetched.finalUrl);
  await writeAudit({ adminUserId: admin.id, action: "package.import.listing", resource: `Import:${fetched.host}`, after: { found: links.length } });
  if (!links.length) return { ok: false, error: "No package links found on that page. Try a category/listing URL, or import packages one by one." };
  return { ok: true, links, host: fetched.host };
}

// ── Create a DRAFT package from reviewed import data (admin only) ───
const dayItemSchema = z.object({
  timeslot: z.enum(["MORNING", "AFTERNOON", "EVENING"]).catch("MORNING"),
  kind: z.enum(["FLIGHT", "TRANSFER", "HOTEL", "ACTIVITY", "MEAL", "FREE_TIME", "NOTE"]).catch("ACTIVITY"),
  title: z.string().max(200),
  description: z.string().max(1000).optional().default(""),
});
const daySchema = z.object({
  day: z.coerce.number().int().min(1).max(60),
  title: z.string().max(160),
  description: z.string().max(2000).optional().default(""),
  items: z.array(dayItemSchema).max(8).optional().default([]),
});
const draftSchema = z.object({
  name: z.string().min(3, "Package name is required.").max(120),
  // Optional — if blank we auto-detect/create the destination from the scanned page.
  destinationId: z.string().optional().default(""),
  destinationName: z.string().max(120).optional().nullable(),
  country: z.string().max(80).optional().nullable(),
  nights: z.coerce.number().int().min(1).max(30),
  basePrice: z.coerce.number().int().min(0).max(5_000_000),
  category: z.string().max(40).optional().nullable(),
  bestFor: z.string().max(160).optional().nullable(),
  summary: z.string().max(400).optional().nullable(),
  overview: z.string().max(4000).optional().nullable(),
  roomCategory: z.string().max(120).optional().nullable(),
  mealPlan: z.string().max(120).optional().nullable(),
  flightSector: z.string().max(120).optional().nullable(),
  baggage: z.string().max(120).optional().nullable(),
  travelWindows: z.string().max(160).optional().nullable(),
  cancellationPolicy: z.string().max(2000).optional().nullable(),
  importantInfo: z.string().max(2000).optional().nullable(),
  highlights: z.array(z.string().max(200)).max(30).default([]),
  inclusions: z.array(z.string().max(200)).max(40).default([]),
  exclusions: z.array(z.string().max(200)).max(40).default([]),
  itinerary: z.array(daySchema).max(30).default([]),
  cityBreakdown: z.array(z.object({ city: z.string().max(60), nights: z.coerce.number().int().min(0).max(60) })).max(12).optional().default([]),
  imageUrls: z.array(z.string().url().max(1024)).max(12).default([]),
  sourceUrl: z.string().url().max(2048).optional().nullable(),
  sourceName: z.string().max(120).optional().nullable(),
});

/**
 * Find a destination by slug/name, or create it (published) so imported packages
 * always get a real destination without the admin picking from a limited list.
 */
async function resolveDestinationId(name?: string | null, country?: string | null): Promise<string | null> {
  const n = (name ?? "").trim();
  if (!n) return null;
  const slug = slugify(n);
  const existing = await db.destination.findFirst({
    where: { OR: [{ slug }, { name: { equals: n, mode: "insensitive" } }] },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await db.destination.create({
    data: { slug, name: n, country: (country ?? "").trim() || "—", isPublished: true },
    select: { id: true },
  });
  return created.id;
}

async function createDraft(admin: { id: string }, d: z.infer<typeof draftSchema> & { destinationId: string }): Promise<{ packageId: string; slug: string }> {
  let slug = slugify(d.name);
  if (await db.package.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const pkg = await db.package.create({
    data: {
      slug, name: d.name, theme: "GROUP", destinationId: d.destinationId,
      status: "DRAFT",
      sourceUrl: d.sourceUrl ?? null, sourceName: d.sourceName ?? null,
      importedById: admin.id, scannedAt: new Date(),
      versions: {
        create: {
          versionNumber: 1, isPublished: false, name: d.name,
          durationNights: d.nights, durationDays: d.nights + 1,
          currency: "INR", basePrice: d.basePrice, perPersonPricing: true,
          category: d.category ?? null, bestFor: d.bestFor ?? null,
          summary: d.summary ?? null, overview: d.overview ?? null,
          roomCategory: d.roomCategory ?? null, mealPlan: d.mealPlan ?? null,
          flightSector: d.flightSector ?? null, baggage: d.baggage ?? null,
          travelWindows: d.travelWindows ?? null,
          cancellationPolicy: d.cancellationPolicy ?? null, importantInfo: d.importantInfo ?? null,
          pricingStatus: d.basePrice > 0 ? "PRICED" : "PRICE_REVIEW_REQUIRED",
          availabilityStatus: "AVAILABLE",
          highlights: d.highlights, inclusions: d.inclusions, exclusions: d.exclusions,
          departureCities: ["Delhi", "Mumbai", "Bengaluru"],
          cityBreakdown: d.cityBreakdown?.length ? d.cityBreakdown : undefined,
          images: d.imageUrls.length
            ? { create: d.imageUrls.map((url, i) => ({ url, alt: d.name, isCover: i === 0, sortOrder: i })) }
            : undefined,
          days: d.itinerary.length
            ? {
                create: d.itinerary.map((day) => ({
                  dayNumber: day.day,
                  title: day.title || `Day ${day.day}`,
                  summary: day.description || null,
                  items: day.items?.length
                    ? { create: day.items.map((it, i) => ({ timeslot: it.timeslot, kind: it.kind, title: it.title, description: it.description || null, sortOrder: i })) }
                    : undefined,
                })),
              }
            : undefined,
        },
      },
    },
    include: { versions: true },
  });
  await db.package.update({ where: { id: pkg.id }, data: { currentVersionId: pkg.versions[0].id } });
  await writeAudit({ adminUserId: admin.id, action: "package.import.draft", resource: `Package:${pkg.id}`, after: { name: d.name, sourceUrl: d.sourceUrl, basePrice: d.basePrice, images: d.imageUrls.length, days: d.itinerary.length } });
  return { packageId: pkg.id, slug };
}

export async function createDraftFromImport(input: unknown): Promise<R<{ packageId: string; slug: string }>> {
  const admin = await authorize("package.create");
  if (!admin) return { ok: false, error: "You don't have permission to import packages." };
  const p = draftSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Please review the fields." };

  // Use the chosen destination, else auto-detect/create it from the scanned page.
  const destinationId = p.data.destinationId || (await resolveDestinationId(p.data.destinationName, p.data.country));
  if (!destinationId) return { ok: false, error: "Couldn't determine a destination — pick one, or add a destination name." };

  return { ok: true, ...(await createDraft(admin, { ...p.data, destinationId })) };
}

// ── Batch import: scan + AI-extract + create DRAFT for several URLs ──
export async function batchImport(urls: string[], destinationId = "", verbatim = false): Promise<R<{ created: { url: string; name: string; slug: string }[]; failed: { url: string; error: string }[] }>> {
  const admin = await authorize("package.create");
  if (!admin) return { ok: false, error: "You don't have permission to import packages." };
  if (!isAiConfigured()) return { ok: false, error: "Batch import needs AI extraction — configure AI_API_KEY first." };

  // Small per-request cap so a single serverless call never times out — the
  // client drives the whole listing in sequential chunks.
  const list = (urls ?? []).slice(0, 6);
  const created: { url: string; name: string; slug: string }[] = [];
  const failed: { url: string; error: string }[] = [];

  for (const url of list) {
    try {
      const parsed = z.string().url().safeParse(url);
      if (!parsed.success) { failed.push({ url, error: "invalid url" }); continue; }
      const fetched = await safeFetchHtml(parsed.data);
      if (!fetched.ok) { failed.push({ url, error: fetched.error }); continue; }
      const ai = await aiExtractPackage(extractMainText(fetched.html), verbatim);
      const facts = extractFacts(fetched.html);
      const name = ai?.name ?? facts.name;
      const nights = ai?.durationNights ?? facts.durationNights;
      // Only holiday/tour PACKAGES: a real package has a name AND a night count
      // (an itinerary). Flight-only / hotel-only / visa pages lack these — skip.
      if (!name || !nights) { failed.push({ url, error: "not a holiday package (no itinerary) — skipped" }); continue; }
      if (/\b(flight|flights|air\s?fare|air\s?ticket|one[-\s]?way|round[-\s]?trip)\b/i.test(name) && !(ai?.itinerary?.length)) {
        failed.push({ url, error: "looks like a flight, not a package — skipped" }); continue;
      }
      // Auto-detect the destination from the page; fall back to the chosen one.
      const destId = (await resolveDestinationId(ai?.destinationName, ai?.country)) ?? destinationId;
      if (!destId) { failed.push({ url, error: "couldn't detect a destination — pick one for the batch" }); continue; }
      const res = await createDraft(admin, {
        name, destinationId: destId, nights, basePrice: ai?.startingPrice ?? facts.priceCandidates[0] ?? 0,
        category: ai?.category ?? null, bestFor: ai?.bestFor ?? null,
        summary: ai?.summary ?? facts.summary ?? null, overview: ai?.overview ?? null,
        roomCategory: ai?.roomCategory ?? null, mealPlan: ai?.mealPlan ?? null,
        flightSector: ai?.flightSector ?? null, baggage: ai?.baggage ?? null,
        travelWindows: ai?.travelWindow ?? null,
        cancellationPolicy: ai?.cancellationPolicy ?? null, importantInfo: ai?.importantTerms ?? null,
        highlights: ai?.highlights ?? [], inclusions: ai?.inclusions ?? [], exclusions: ai?.exclusions ?? [],
        itinerary: ai?.itinerary ?? [], cityBreakdown: ai?.cityBreakdown ?? [], imageUrls: facts.imageUrls.slice(0, 6),
        sourceUrl: fetched.finalUrl, sourceName: fetched.host,
      });
      created.push({ url, name, slug: res.slug });
    } catch {
      failed.push({ url, error: "unexpected error" });
    }
  }
  await writeAudit({ adminUserId: admin.id, action: "package.import.batch", resource: "Import:batch", after: { created: created.length, failed: failed.length } });
  return { ok: true, created, failed };
}

// ── AI Package Builder: generate a full DRAFT from a brief (no source URL) ──
const BUILDER_SYSTEM =
  "You are a senior holiday product designer for ExpertzTrip, a premium Indian holiday brand. " +
  "You design complete, realistic and appealing DRAFT holiday packages that a human editor reviews before publishing. " +
  "Rules: (1) Write original, premium, concise copy in Indian English. " +
  "(2) Build a realistic day-by-day itinerary — every day split into 2-4 morning/afternoon/evening items, each with the correct kind (FLIGHT/TRANSFER/HOTEL/ACTIVITY/MEAL/FREE_TIME/NOTE). " +
  "(3) NEVER invent a specific price — startingPrice MUST be null; the team confirms pricing separately. " +
  "(4) Keep hotels generic (e.g. '4-star beachfront resort') instead of naming a specific property you can't verify. " +
  "(5) Stay faithful to the requested destination, duration and theme; keep inclusions/exclusions realistic for that trip.";

const buildSchema = z.object({
  destinationId: z.string().min(1, "Choose a destination."),
  destinationName: z.string().max(120).optional().default(""),
  country: z.string().max(80).optional().default(""),
  nights: z.coerce.number().int().min(1).max(30),
  category: z.string().max(40).optional().nullable(),
  departureCity: z.string().max(80).optional().default(""),
  style: z.string().max(1200).optional().default(""),
  basePrice: z.coerce.number().int().min(0).max(5_000_000).optional().default(0),
});

export async function buildPackage(input: unknown): Promise<R<{ packageId: string; slug: string; name: string }>> {
  const admin = await authorize("package.create");
  if (!admin) return { ok: false, error: "You don't have permission to build packages." };
  if (!isAiConfigured()) return { ok: false, error: "The AI package builder needs AI — configure AI_API_KEY first." };

  const parsed = buildSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please complete the form." };
  const b = parsed.data;
  const days = b.nights + 1;

  const prompt = `Design a ${b.nights}-night (${days}-day) holiday package for ${b.destinationName || "the chosen destination"}${b.country ? `, ${b.country}` : ""}.
${b.category ? `Theme / category: ${b.category}.` : ""}${b.departureCity ? ` Departing from: ${b.departureCity}.` : ""}${b.style ? ` Traveller style / must-haves: ${b.style}.` : ""}
Return STRICT JSON with exactly these keys:
{"name":string,"destinationName":string|null,"country":string|null,"durationNights":${b.nights},"durationDays":${days},"category":string|null,"bestFor":string|null,"startingPrice":null,"travelWindow":string|null,"flightSector":string|null,"roomCategory":string|null,"mealPlan":string|null,"baggage":string|null,"summary":string,"overview":string,"highlights":string[],"inclusions":string[],"exclusions":string[],"cityBreakdown":[{"city":string,"nights":number}],"itinerary":[{"day":number,"title":string,"description":string,"items":[{"timeslot":"MORNING"|"AFTERNOON"|"EVENING","kind":"FLIGHT"|"TRANSFER"|"HOTEL"|"ACTIVITY"|"MEAL"|"FREE_TIME"|"NOTE","title":string,"description":string}]}],"cancellationPolicy":string|null,"importantTerms":string|null}
category must be one of FIRST_ESCAPE, SIGNATURE, HONEYMOON, FAMILY, LUXURY, PREMIUM or null.
cityBreakdown lists each city stayed with its nights, in order (summing to ${b.nights}).
The itinerary MUST have exactly ${days} days, each with 2-4 time-slotted items. startingPrice MUST be null.
Return ONLY the JSON object, no prose.`;

  const ai = parseAiPackage(await aiComplete(prompt, { system: BUILDER_SYSTEM, maxTokens: 4000, temperature: 0.5 }));
  if (!ai || !ai.name) return { ok: false, error: "The AI builder couldn't generate a package. Try again with a clearer brief." };

  const res = await createDraft(admin, {
    name: ai.name, destinationId: b.destinationId, nights: b.nights, basePrice: b.basePrice ?? 0,
    category: ai.category ?? b.category ?? null, bestFor: ai.bestFor ?? null,
    summary: ai.summary ?? null, overview: ai.overview ?? null,
    roomCategory: ai.roomCategory ?? null, mealPlan: ai.mealPlan ?? null,
    flightSector: ai.flightSector ?? null, baggage: ai.baggage ?? null, travelWindows: ai.travelWindow ?? null,
    cancellationPolicy: ai.cancellationPolicy ?? null, importantInfo: ai.importantTerms ?? null,
    highlights: ai.highlights, inclusions: ai.inclusions, exclusions: ai.exclusions,
    itinerary: ai.itinerary, cityBreakdown: ai.cityBreakdown ?? [], imageUrls: [],
    sourceUrl: null, sourceName: "AI Builder",
  });
  await writeAudit({ adminUserId: admin.id, action: "package.build.ai", resource: `Package:${res.packageId}`, after: { name: ai.name, nights: b.nights, days: ai.itinerary.length } });
  return { ok: true, ...res, name: ai.name };
}
