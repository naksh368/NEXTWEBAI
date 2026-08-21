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
  itinerary: { day: number; title: string; description: string }[];
  cancellationPolicy: string | null;
  importantTerms: string | null;
};

const EXTRACT_SYSTEM =
  "You are a data-extraction and copywriting assistant for ExpertzTrip, a premium Indian holiday brand. " +
  "You convert a scraped travel-package web page into STRUCTURED FACTS plus ORIGINAL ExpertzTrip copy. " +
  "Absolute rules: (1) NEVER invent facts — prices, hotels, inclusions, durations, reviews. Use null when the page doesn't state it. " +
  "(2) Do NOT copy the supplier's marketing sentences verbatim — REWRITE summary and overview into fresh, concise, original copy while keeping every fact accurate. " +
  "(3) Keep inclusions/exclusions/itinerary factual and faithful to the page. " +
  "(4) Prices are Indian Rupees; return startingPrice as an integer number of rupees (no symbols/commas) or null.";

async function aiExtractPackage(text: string): Promise<AiPackage | null> {
  if (!isAiConfigured()) return null;
  const prompt = `Extract this travel package page into STRICT JSON with exactly these keys:
{"name":string|null,"destinationName":string|null,"country":string|null,"durationNights":number|null,"durationDays":number|null,"category":string|null,"bestFor":string|null,"startingPrice":number|null,"travelWindow":string|null,"flightSector":string|null,"roomCategory":string|null,"mealPlan":string|null,"baggage":string|null,"summary":string|null,"overview":string|null,"highlights":string[],"inclusions":string[],"exclusions":string[],"itinerary":[{"day":number,"title":string,"description":string}],"cancellationPolicy":string|null,"importantTerms":string|null}
category must be one of FIRST_ESCAPE, SIGNATURE, HONEYMOON, FAMILY, LUXURY, PREMIUM or null.
summary <= 280 chars; overview 2-3 short original paragraphs. Rewrite descriptions in original words.
Return ONLY the JSON object, no prose.

PAGE CONTENT:
${text}`;
  const out = await aiComplete(prompt, { system: EXTRACT_SYSTEM, maxTokens: 2200, temperature: 0.2 });
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
          }))
        : [],
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
export async function scanSource(rawUrl: string): Promise<R<{ facts: ExtractedFacts; ai: AiPackage | null; aiConfigured: boolean; host: string; sourceUrl: string; imageUrls: string[] }>> {
  const admin = await authorize("package.create");
  if (!admin) return { ok: false, error: "You don't have permission to import packages." };

  const parsed = z.string().url().max(2048).safeParse((rawUrl ?? "").trim());
  if (!parsed.success) return { ok: false, error: "Enter a valid https:// package URL." };

  const fetched = await safeFetchHtml(parsed.data);
  if (!fetched.ok) return { ok: false, error: fetched.error };

  const facts = extractFacts(fetched.html);
  const ai = await aiExtractPackage(extractMainText(fetched.html));

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
const daySchema = z.object({ day: z.coerce.number().int().min(1).max(60), title: z.string().max(160), description: z.string().max(2000).optional().default("") });
const draftSchema = z.object({
  name: z.string().min(3, "Package name is required.").max(120),
  destinationId: z.string().min(1, "Choose a destination."),
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
  imageUrls: z.array(z.string().url().max(1024)).max(12).default([]),
  sourceUrl: z.string().url().max(2048).optional().nullable(),
  sourceName: z.string().max(120).optional().nullable(),
});

async function createDraft(admin: { id: string }, d: z.infer<typeof draftSchema>): Promise<{ packageId: string; slug: string }> {
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
          images: d.imageUrls.length
            ? { create: d.imageUrls.map((url, i) => ({ url, alt: d.name, isCover: i === 0, sortOrder: i })) }
            : undefined,
          days: d.itinerary.length
            ? { create: d.itinerary.map((day) => ({ dayNumber: day.day, title: day.title || `Day ${day.day}`, summary: day.description || null })) }
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
  return { ok: true, ...(await createDraft(admin, p.data)) };
}

// ── Batch import: scan + AI-extract + create DRAFT for several URLs ──
export async function batchImport(urls: string[], destinationId: string): Promise<R<{ created: { url: string; name: string; slug: string }[]; failed: { url: string; error: string }[] }>> {
  const admin = await authorize("package.create");
  if (!admin) return { ok: false, error: "You don't have permission to import packages." };
  if (!destinationId) return { ok: false, error: "Choose a destination for the imported drafts." };
  if (!isAiConfigured()) return { ok: false, error: "Batch import needs AI extraction — configure AI_API_KEY first." };

  const list = (urls ?? []).slice(0, 12); // cap per run
  const created: { url: string; name: string; slug: string }[] = [];
  const failed: { url: string; error: string }[] = [];

  for (const url of list) {
    try {
      const parsed = z.string().url().safeParse(url);
      if (!parsed.success) { failed.push({ url, error: "invalid url" }); continue; }
      const fetched = await safeFetchHtml(parsed.data);
      if (!fetched.ok) { failed.push({ url, error: fetched.error }); continue; }
      const ai = await aiExtractPackage(extractMainText(fetched.html));
      const facts = extractFacts(fetched.html);
      const name = ai?.name ?? facts.name;
      const nights = ai?.durationNights ?? facts.durationNights;
      if (!name || !nights) { failed.push({ url, error: "missing name or duration" }); continue; }
      const res = await createDraft(admin, {
        name, destinationId, nights, basePrice: ai?.startingPrice ?? facts.priceCandidates[0] ?? 0,
        category: ai?.category ?? null, bestFor: ai?.bestFor ?? null,
        summary: ai?.summary ?? facts.summary ?? null, overview: ai?.overview ?? null,
        roomCategory: ai?.roomCategory ?? null, mealPlan: ai?.mealPlan ?? null,
        flightSector: ai?.flightSector ?? null, baggage: ai?.baggage ?? null,
        travelWindows: ai?.travelWindow ?? null,
        cancellationPolicy: ai?.cancellationPolicy ?? null, importantInfo: ai?.importantTerms ?? null,
        highlights: ai?.highlights ?? [], inclusions: ai?.inclusions ?? [], exclusions: ai?.exclusions ?? [],
        itinerary: ai?.itinerary ?? [], imageUrls: facts.imageUrls.slice(0, 6),
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
