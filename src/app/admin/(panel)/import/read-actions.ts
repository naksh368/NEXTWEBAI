"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { authorize } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/services/audit-service";
import { aiComplete, isAiConfigured } from "@/lib/services/ai-service";
import { getSiteSettings } from "@/lib/site-settings";
import { autoName, deducePackage, isAutoName, tierOf, TIERS, type DeducedPackage, type Tier } from "@/lib/package-deduce";
import { slugify } from "@/lib/utils";

type R<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string };

const TIER_IDS = TIERS.map((t) => t.theme) as [Tier, ...Tier[]];

const READ_SYSTEM =
  "You read holiday package details for JST Andaman Travels, which sells Andaman Islands holidays only. " +
  "You turn a supplier's message, a WhatsApp forward or a typed itinerary into structured facts. " +
  "Rules: (1) NEVER invent a price, a hotel name, a duration or an inclusion. Use null or an empty list when the text does not say. " +
  `(2) Choose the hotel tier from exactly: ${TIERS.map((t) => `${t.theme} (${t.hotelCategory})`).join(", ")}. ` +
  "A 5-star or luxury stay maps to FOUR_STAR, our top tier. Explain each decision in one short line in `reasons`. " +
  "(3) Use these place names: Port Blair, Havelock Island, Neil Island, Baratang, Rangat, Mayabunder, Diglipur, Long Island, Little Andaman. " +
  "(4) Keep itinerary wording faithful to the text, tidied into clear sentences. " +
  "(5) Return ONLY a JSON object.";

const aiSchema = z.object({
  tier: z.enum(TIER_IDS).nullable().catch(null),
  nights: z.number().int().min(1).max(20).nullable().catch(null),
  pricePerPerson: z.number().int().min(1000).max(1_000_000).nullable().catch(null),
  minTravellers: z.number().int().min(1).max(50).nullable().catch(null),
  route: z.array(z.object({ city: z.string().max(60), nights: z.number().int().min(0).max(20) })).max(10).catch([]),
  mealPlan: z.string().max(80).nullable().catch(null),
  summary: z.string().max(400).nullable().catch(null),
  inclusions: z.array(z.string().max(200)).max(30).catch([]),
  exclusions: z.array(z.string().max(200)).max(30).catch([]),
  itinerary: z.array(z.object({ day: z.number().int().min(1).max(30), title: z.string().max(120), description: z.string().max(1000) })).max(20).catch([]),
  reasons: z.array(z.string().max(240)).max(12).catch([]),
});

/** Numbers only, with thousands separators removed, so "22,600" in the text matches 22600. */
const digits = (s: string) => s.replace(/(\d)[,.](?=\d{3}\b)/g, "$1").replace(/[^\d]/g, " ");

export type ReadResult = { pkg: DeducedPackage & { summary: string | null }; aiUsed: boolean };

/**
 * Work out a package from pasted details. The rule-based reader runs first;
 * the AI then fills gaps and tidies the itinerary. Anything literal that the
 * rules found (price, nights, group size) wins over the model, and the
 * model's price is only accepted when that exact number appears in the text.
 */
export async function readPackageDetails(text: string): Promise<R<ReadResult>> {
  const admin = await authorize("package.create");
  if (!admin) return { ok: false, error: "You don't have permission to create packages." };
  const body = (text ?? "").trim();
  if (body.length < 20) return { ok: false, error: "Paste the package details first — a few lines at least." };
  if (body.length > 20_000) return { ok: false, error: "That is too long. Paste one package at a time." };

  const base = deducePackage(body);
  const pkg: ReadResult["pkg"] = { ...base, summary: null };
  if (!isAiConfigured()) return { ok: true, pkg, aiUsed: false };

  const prompt = `Read these package details and return JSON with exactly these keys:
{"tier":string|null,"nights":number|null,"pricePerPerson":number|null,"minTravellers":number|null,"route":[{"city":string,"nights":number}],"mealPlan":string|null,"summary":string|null,"inclusions":string[],"exclusions":string[],"itinerary":[{"day":number,"title":string,"description":string}],"reasons":string[]}
summary: one or two plain sentences for customers, under 280 characters, facts only.

DETAILS:
${body.slice(0, 9000)}`;

  const raw = await aiComplete(prompt, { system: READ_SYSTEM, maxTokens: 3000, temperature: 0.1, timeoutMs: 40_000 }).catch(() => null);
  const json = raw?.match(/\{[\s\S]*\}/)?.[0];
  let parsed: z.infer<typeof aiSchema> | null = null;
  try {
    const p = aiSchema.safeParse(json ? JSON.parse(json) : null);
    parsed = p.success ? p.data : null;
  } catch {
    parsed = null;
  }
  if (!parsed) {
    pkg.notes.push("The AI could not read these details, so only the built-in reader was used.");
    return { ok: true, pkg, aiUsed: false };
  }

  const tierFromHotelWords = /the details mention/.test(base.notes.find((n) => n.startsWith("Hotel tier")) ?? "");
  if (parsed.tier && !tierFromHotelWords && parsed.tier !== pkg.theme) {
    pkg.theme = parsed.tier;
  }
  if (pkg.basePrice === null && parsed.pricePerPerson && digits(body).split(/\s+/).includes(String(parsed.pricePerPerson))) {
    pkg.basePrice = parsed.pricePerPerson;
    pkg.warnings = pkg.warnings.filter((w) => !/No price/.test(w));
  }
  if (pkg.warnings.some((w) => /No duration/.test(w)) && parsed.nights) {
    pkg.nights = parsed.nights;
    pkg.days = parsed.nights + 1;
    pkg.warnings = pkg.warnings.filter((w) => !/No duration/.test(w));
  }
  if (isAutoName(pkg.name)) pkg.name = autoName(pkg.theme, pkg.nights);
  pkg.minTravellers ??= parsed.minTravellers;
  if (!pkg.route.length && parsed.route.length) pkg.route = parsed.route.filter((r) => r.city.trim());
  pkg.mealPlan ??= parsed.mealPlan;
  if (!pkg.inclusions.length) pkg.inclusions = parsed.inclusions;
  if (!pkg.exclusions.length) pkg.exclusions = parsed.exclusions;
  // The model's itinerary reads better; take it when it covers at least as many days.
  if (parsed.itinerary.length >= pkg.itinerary.length) pkg.itinerary = parsed.itinerary;
  pkg.summary = parsed.summary;
  pkg.notes.push(...parsed.reasons.map((r) => `AI: ${r}`));

  await writeAudit({ adminUserId: admin.id, action: "package.read.ai", resource: "Import:read", after: { theme: pkg.theme, nights: pkg.nights } });
  return { ok: true, pkg, aiUsed: true };
}

const saveSchema = z.object({
  name: z.string().trim().min(3, "Give the package a name.").max(120),
  theme: z.enum(TIER_IDS),
  nights: z.coerce.number().int().min(1, "Nights must be at least 1.").max(20),
  basePrice: z.coerce.number().int().min(0).max(1_000_000),
  minTravellers: z.coerce.number().int().min(1).max(50),
  summary: z.string().max(400).optional().nullable(),
  mealPlan: z.string().max(80).optional().nullable(),
  route: z.array(z.object({ city: z.string().trim().min(1).max(60), nights: z.coerce.number().int().min(0).max(20) })).max(10).default([]),
  inclusions: z.array(z.string().trim().min(1).max(200)).max(30).default([]),
  exclusions: z.array(z.string().trim().min(1).max(200)).max(30).default([]),
  itinerary: z.array(z.object({ day: z.coerce.number().int().min(1).max(30), title: z.string().trim().min(1).max(120), description: z.string().max(1000) })).max(20).default([]),
});

/** Save the reviewed details as a DRAFT Andaman package. Never publishes. */
export async function saveReadPackage(input: unknown): Promise<R<{ packageId: string; slug: string }>> {
  const admin = await authorize("package.create");
  if (!admin) return { ok: false, error: "You don't have permission to create packages." };
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the fields." };
  const d = parsed.data;
  const tier = tierOf(d.theme)!;

  const hub = await db.destination.findFirst({ where: { slug: "port-blair" }, select: { id: true } })
    ?? await db.destination.findFirst({ orderBy: { sortOrder: "asc" }, select: { id: true } });
  if (!hub) return { ok: false, error: "Add the Port Blair destination before creating packages." };

  // Borrow photos and standing policies from our existing package of the same tier.
  const sibling = await db.packageVersion.findFirst({
    where: { currentOf: { theme: d.theme } },
    select: { cancellationPolicy: true, importantInfo: true, highlights: true, images: { orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } } },
  });
  const settings = await getSiteSettings();

  let slug = slugify(d.name);
  if (await db.package.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  const route = d.route.length ? d.route : null;
  const routeText = route ? route.map((r) => r.city.replace(" Island", "")).join(", ") : "the Andaman Islands";

  const pkg = await db.package.create({
    data: {
      slug, name: d.name, theme: d.theme, destinationId: hub.id, status: "DRAFT", enquiryOnly: true,
      sourceName: "Read from pasted details", importedById: admin.id, scannedAt: new Date(),
      versions: {
        create: {
          versionNumber: 1, isPublished: false, name: d.name,
          durationNights: d.nights, durationDays: d.nights + 1, currency: "INR",
          basePrice: d.basePrice, perPersonPricing: true,
          minTravellers: d.minTravellers, maxTravellers: 30,
          pricingStatus: d.basePrice > 0 ? "INDICATIVE" : "PRICE_REVIEW_REQUIRED",
          availabilityStatus: "ON_REQUEST",
          category: d.theme, bestFor: `Groups of ${d.minTravellers} or more`,
          summary: d.summary || `${d.nights}N / ${d.nights + 1}D across ${routeText} — ${tier.hotelCategory.toLowerCase()}, sightseeing and transfers.`,
          roomCategory: tier.hotelCategory, mealPlan: d.mealPlan || null,
          cityBreakdown: route ?? undefined,
          departureCities: ["Chennai", "Kolkata", "Delhi", "Bengaluru", "Hyderabad", "Visakhapatnam"],
          travelWindows: `Rates valid ${settings.promoValidFrom} to ${settings.promoValidTo}`,
          highlights: sibling?.highlights ?? [],
          inclusions: d.inclusions, exclusions: d.exclusions,
          cancellationPolicy: sibling?.cancellationPolicy ?? null, importantInfo: sibling?.importantInfo ?? null,
          allowHotelChange: true, allowFlightChange: false, allowTransferChange: true,
          allowActivityChange: true, allowMealChange: false, allowAddons: true, allowDateChange: true,
          images: sibling?.images.length
            ? { create: sibling.images.map((img, i) => ({ url: img.url, alt: img.alt, isCover: i === 0, sortOrder: i })) }
            : undefined,
          days: d.itinerary.length
            ? { create: d.itinerary.map((day) => ({ dayNumber: day.day, title: day.title, summary: day.description || null })) }
            : undefined,
        },
      },
    },
    include: { versions: { select: { id: true } } },
  });
  await db.package.update({ where: { id: pkg.id }, data: { currentVersionId: pkg.versions[0].id } });
  await writeAudit({ adminUserId: admin.id, action: "package.read.draft", resource: `Package:${pkg.id}`, after: { name: d.name, theme: d.theme, nights: d.nights, basePrice: d.basePrice } });
  return { ok: true, packageId: pkg.id, slug };
}
