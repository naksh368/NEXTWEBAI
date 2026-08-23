"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { authorize } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/services/audit-service";
import { aiComplete, isAiConfigured } from "@/lib/services/ai-service";
import { slugify } from "@/lib/utils";
import { PACKAGE_STATUS, DAY_ITEM_KIND } from "@/lib/constants";

type R<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string };

function revalidateAll(packageId: string, slug?: string) {
  revalidatePath("/admin/packages");
  revalidatePath(`/admin/packages/${packageId}/edit`);
  revalidatePath("/packages");
  if (slug) { revalidatePath(`/packages/${slug}`); revalidatePath(`/packages/${slug}/itinerary`); }
}

// ── Create ──────────────────────────────────────────────
const createSchema = z.object({
  name: z.string().min(3).max(120),
  code: z.string().max(30).optional(),
  destinationId: z.string().min(1),
  category: z.string().min(1),
  bestFor: z.string().max(120).optional(),
  nights: z.number().int().min(1).max(30),
  basePrice: z.number().int().min(0).max(100000000),
});

export async function createPackageAction(input: unknown): Promise<R<{ packageId: string }>> {
  const admin = await authorize("package.create");
  if (!admin) return { ok: false, error: "You don't have permission to create packages." };
  const p = createSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Invalid data." };
  const d = p.data;

  let slug = slugify(d.name);
  if (await db.package.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const pkg = await db.package.create({
    data: {
      slug, code: d.code || null, name: d.name, theme: "GROUP", destinationId: d.destinationId, status: "DRAFT",
      versions: {
        create: {
          versionNumber: 1, isPublished: false, name: d.name, durationNights: d.nights, durationDays: d.nights + 1,
          currency: "INR", basePrice: d.basePrice, perPersonPricing: true, category: d.category, bestFor: d.bestFor,
          pricingStatus: d.basePrice > 0 ? "PRICED" : "PRICE_REVIEW_REQUIRED", availabilityStatus: "AVAILABLE",
          highlights: [], inclusions: [], exclusions: [], departureCities: ["Delhi", "Mumbai", "Bengaluru"],
        },
      },
    },
    include: { versions: true },
  });
  await db.package.update({ where: { id: pkg.id }, data: { currentVersionId: pkg.versions[0].id } });
  await writeAudit({ adminUserId: admin.id, action: "package.create", resource: `Package:${pkg.id}`, after: { name: d.name } });
  revalidateAll(pkg.id, slug);
  return { ok: true, packageId: pkg.id };
}

// ── Duplicate ───────────────────────────────────────────
/**
 * Clone a package (and its current version's content — images, itinerary days,
 * options) into a new DRAFT, so a similar holiday can be built fast. Bookings,
 * reviews and publish state are never copied.
 */
export async function duplicatePackageAction(packageId: string): Promise<R<{ packageId: string }>> {
  const admin = await authorize("package.create");
  if (!admin) return { ok: false, error: "You don't have permission to create packages." };
  const src = await db.package.findUnique({
    where: { id: packageId },
    include: { currentVersion: { include: { images: true, options: true, days: { include: { items: true }, orderBy: { dayNumber: "asc" } } } } },
  });
  if (!src) return { ok: false, error: "Package not found." };
  const v = src.currentVersion;
  if (!v) return { ok: false, error: "This package has no content to duplicate yet." };

  const baseName = `${src.name} (copy)`;
  let slug = slugify(baseName);
  if (await db.package.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  const j = (x: unknown) => (x == null ? undefined : (x as Prisma.InputJsonValue));

  const pkg = await db.package.create({
    data: {
      slug, code: null, name: baseName, theme: src.theme, destinationId: src.destinationId, status: "DRAFT",
      versions: {
        create: {
          versionNumber: 1, isPublished: false,
          name: v.name, summary: v.summary, overview: v.overview,
          durationDays: v.durationDays, durationNights: v.durationNights,
          currency: v.currency, basePrice: v.basePrice, childPrice: v.childPrice, perPersonPricing: v.perPersonPricing,
          highlights: j(v.highlights), inclusions: j(v.inclusions), exclusions: j(v.exclusions),
          cancellationPolicy: v.cancellationPolicy, importantInfo: v.importantInfo,
          category: v.category, bestFor: v.bestFor, departureCities: j(v.departureCities), cityBreakdown: j(v.cityBreakdown),
          travelWindows: v.travelWindows, roomCategory: v.roomCategory, mealPlan: v.mealPlan, flightSector: v.flightSector,
          baggage: v.baggage, visaInfo: v.visaInfo, insuranceInfo: v.insuranceInfo, seoTitle: v.seoTitle, seoDescription: v.seoDescription,
          availabilityStatus: v.availabilityStatus, pricingStatus: v.pricingStatus, benchmark: j(v.benchmark), targetPrice: v.targetPrice,
          allowHotelChange: v.allowHotelChange, allowFlightChange: v.allowFlightChange, allowTransferChange: v.allowTransferChange,
          allowActivityChange: v.allowActivityChange, allowMealChange: v.allowMealChange, allowAddons: v.allowAddons, allowDateChange: v.allowDateChange,
          minTravellers: v.minTravellers, maxTravellers: v.maxTravellers,
          images: { create: v.images.map((im) => ({ url: im.url, alt: im.alt, isCover: im.isCover, sortOrder: im.sortOrder })) },
          options: { create: v.options.map((o) => ({ category: o.category, groupKey: o.groupKey, label: o.label, description: o.description, meta: j(o.meta), priceDelta: o.priceDelta, perPerson: o.perPerson, isDefault: o.isDefault, isEnabled: o.isEnabled, sortOrder: o.sortOrder })) },
          days: { create: v.days.map((d) => ({ dayNumber: d.dayNumber, title: d.title, summary: d.summary, items: { create: d.items.map((it) => ({ timeslot: it.timeslot, kind: it.kind, title: it.title, description: it.description, sortOrder: it.sortOrder })) } })) },
        },
      },
    },
    include: { versions: true },
  });
  await db.package.update({ where: { id: pkg.id }, data: { currentVersionId: pkg.versions[0].id } });
  await writeAudit({ adminUserId: admin.id, action: "package.duplicate", resource: `Package:${pkg.id}`, after: { from: packageId, name: baseName } });
  revalidatePath("/admin/packages");
  return { ok: true, packageId: pkg.id };
}

// ── Delete (hard) ───────────────────────────────────────
/**
 * Permanently delete a package and all its versions/content. Refused when the
 * package has bookings (those must stay for financial/audit records) — archive
 * it instead. Reviews and FAQs are detached (SetNull), versions cascade.
 */
export async function deletePackageAction(packageId: string): Promise<R> {
  const admin = await authorize("package.archive");
  if (!admin) return { ok: false, error: "You don't have permission to delete packages." };
  const pkg = await db.package.findUnique({ where: { id: packageId }, select: { name: true, slug: true, _count: { select: { bookings: true } } } });
  if (!pkg) return { ok: false, error: "Package not found." };
  if (pkg._count.bookings > 0) {
    return { ok: false, error: `This package has ${pkg._count.bookings} booking${pkg._count.bookings === 1 ? "" : "s"} and can't be deleted. Archive it to hide it from the site while keeping records.` };
  }
  // Detach the current-version pointer first so the cascade can remove versions.
  await db.package.update({ where: { id: packageId }, data: { currentVersionId: null } });
  await db.package.delete({ where: { id: packageId } });
  await writeAudit({ adminUserId: admin.id, action: "package.delete", resource: `Package:${packageId}`, before: { name: pkg.name } });
  revalidatePath("/admin/packages");
  revalidatePath("/packages");
  revalidatePath("/");
  revalidatePath(`/packages/${pkg.slug}`);
  return { ok: true };
}

// ── Bulk actions ────────────────────────────────────────
type BulkOp = "publish" | "draft" | "feature" | "unfeature" | "check" | "uncheck" | "archive" | "delete" | "enquiry" | "bookable";

/** Apply one operation to many packages at once. */
export async function bulkPackageAction(rawIds: string[], op: BulkOp): Promise<R<{ affected: number; skipped: number }>> {
  const ids = [...new Set((rawIds ?? []).filter(Boolean))].slice(0, 200);
  if (!ids.length) return { ok: false, error: "Select at least one package." };

  const perm = op === "publish" ? "package.publish" : op === "archive" || op === "delete" ? "package.archive" : "package.edit";
  const admin = await authorize(perm);
  if (!admin) return { ok: false, error: "You don't have permission for that action." };

  let affected = 0;
  let skipped = 0;

  if (op === "delete") {
    const rows = await db.package.findMany({ where: { id: { in: ids } }, select: { id: true, currentVersionId: true, _count: { select: { bookings: true } } } });
    const deletable = rows.filter((r) => r._count.bookings === 0).map((r) => r.id);
    skipped = rows.length - deletable.length;
    if (deletable.length) {
      await db.package.updateMany({ where: { id: { in: deletable } }, data: { currentVersionId: null } });
      const res = await db.package.deleteMany({ where: { id: { in: deletable } } });
      affected = res.count;
    }
  } else if (op === "publish" || op === "draft") {
    const status = op === "publish" ? "PUBLISHED" : "DRAFT";
    const pkgs = await db.package.findMany({ where: { id: { in: ids } }, select: { currentVersionId: true } });
    const versionIds = pkgs.map((p) => p.currentVersionId).filter((v): v is string => Boolean(v));
    const [res] = await db.$transaction([
      db.package.updateMany({ where: { id: { in: ids } }, data: { status, publishAt: null } }),
      db.packageVersion.updateMany({ where: { id: { in: versionIds } }, data: { isPublished: op === "publish" } }),
    ]);
    affected = res.count;
  } else {
    const data =
      op === "feature" ? { isFeatured: true } :
      op === "unfeature" ? { isFeatured: false } :
      op === "check" ? { isChecked: true } :
      op === "uncheck" ? { isChecked: false } :
      op === "enquiry" ? { enquiryOnly: true } :
      op === "bookable" ? { enquiryOnly: false } :
      { status: "ARCHIVED" };
    const res = await db.package.updateMany({ where: { id: { in: ids } }, data });
    affected = res.count;
  }

  await writeAudit({ adminUserId: admin.id, action: `package.bulk.${op}`, resource: "Package", after: { ids: ids.length, affected, skipped } });
  revalidatePath("/admin/packages");
  revalidatePath("/packages");
  revalidatePath("/");
  return { ok: true, affected, skipped };
}

// ── Package meta ────────────────────────────────────────
const metaSchema = z.object({
  name: z.string().min(3).max(120),
  code: z.string().max(30).nullable().optional(),
  destinationId: z.string().min(1),
  theme: z.string().max(40).nullable().optional(),
  isFeatured: z.boolean(),
  enquiryOnly: z.boolean().optional(),
  status: z.enum(PACKAGE_STATUS),
});

export async function updatePackageMetaAction(packageId: string, input: unknown): Promise<R> {
  const admin = await authorize("package.edit");
  if (!admin) return { ok: false, error: "Not authorized." };
  const p = metaSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Invalid data." };
  const before = await db.package.findUnique({ where: { id: packageId }, select: { status: true, slug: true, currentVersionId: true } });
  if (!before) return { ok: false, error: "Package not found." };
  if (p.data.status === "PUBLISHED" && !(await authorize("package.publish"))) {
    return { ok: false, error: "You don't have permission to publish." };
  }
  await db.package.update({ where: { id: packageId }, data: { name: p.data.name, code: p.data.code || null, destinationId: p.data.destinationId, theme: p.data.theme || null, isFeatured: p.data.isFeatured, ...(p.data.enquiryOnly !== undefined ? { enquiryOnly: p.data.enquiryOnly } : {}), status: p.data.status } });
  // Keep the current version's publish flag in sync so pricing/booking treat it
  // as sellable (published) or not, consistently with the package status.
  if (before.currentVersionId) {
    await db.packageVersion.update({ where: { id: before.currentVersionId }, data: { isPublished: p.data.status === "PUBLISHED" } });
  }
  await writeAudit({ adminUserId: admin.id, action: "package.meta.update", resource: `Package:${packageId}`, before, after: p.data });
  revalidateAll(packageId, before.slug);
  return { ok: true };
}

// ── AI autofill (expert draft) ──────────────────────────
const AI_CATEGORY = new Set(["FIRST_ESCAPE", "SIGNATURE", "HONEYMOON", "FAMILY", "LUXURY", "PREMIUM"]);
const aiStr = (v: unknown, max = 4000): string | null => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
const aiArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()).map((x: string) => x.trim().slice(0, 200)).slice(0, 30) : []);

/**
 * Let the AI "expert" draft the empty content fields of a package — summary,
 * overview, highlights, inclusions/exclusions, SEO, cancellation policy, etc.
 * mode="blanks" fills only empty fields (default, safe); mode="all" rewrites.
 * Never touches price or availability, and is instructed to invent no prices or
 * specific hotels. Output is a DRAFT to review before publishing.
 */
export async function autofillPackageAction(versionId: string, mode: "blanks" | "all" = "blanks"): Promise<R<{ filled: string[] }>> {
  const admin = await authorize("package.edit");
  if (!admin) return { ok: false, error: "Not authorized." };
  if (!isAiConfigured()) return { ok: false, error: "AI isn't configured yet — set AI_API_KEY to use AI autofill." };

  const ver = await db.packageVersion.findUnique({
    where: { id: versionId },
    include: { package: { select: { slug: true, name: true, destination: { select: { name: true, country: true } } } } },
  });
  if (!ver) return { ok: false, error: "Version not found." };
  const dest = ver.package.destination;

  const prompt = `Package: "${ver.package.name}"
Destination: ${dest?.name ?? "unknown"}${dest?.country ? `, ${dest.country}` : ""}
Duration: ${ver.durationNights} nights / ${ver.durationDays} days
Category hint: ${ver.category ?? "n/a"}

Write realistic, premium, ORIGINAL content for this India-outbound holiday as STRICT JSON with exactly these keys:
{"summary":string,"overview":string,"bestFor":string,"category":"FIRST_ESCAPE"|"SIGNATURE"|"HONEYMOON"|"FAMILY"|"LUXURY"|"PREMIUM","roomCategory":string,"mealPlan":string,"travelWindows":string,"highlights":string[],"inclusions":string[],"exclusions":string[],"cancellationPolicy":string,"importantInfo":string,"visaInfo":string,"seoTitle":string,"seoDescription":string}
Rules: summary <=280 chars; overview 2-3 short paragraphs; 5-8 highlights; realistic inclusions and exclusions; a fair, clearly tiered cancellation policy; seoTitle <=60 chars; seoDescription <=155 chars. Keep hotels generic (e.g. "4-star central hotel") — never name a specific property. NEVER mention or invent any price or amount. Indian English. Return ONLY the JSON object.`;

  const out = await aiComplete(prompt, {
    system: "You are a senior holiday product editor for ExpertzTrip, a premium Indian holiday brand. Write accurate, original, premium copy for Indian travellers. Never invent prices or specific hotel names; keep everything realistic and verifiable.",
    maxTokens: 2200, temperature: 0.5, timeoutMs: 26_000,
  });
  if (!out) return { ok: false, error: "The AI couldn't draft this one — please try again in a moment." };

  let p: Record<string, unknown>;
  try { const m = out.match(/\{[\s\S]*\}/); if (!m) throw new Error(); p = JSON.parse(m[0]); }
  catch { return { ok: false, error: "The AI reply couldn't be read — please try again." }; }

  const data: Record<string, unknown> = {};
  const filled: string[] = [];
  const blankStr = (cur: unknown) => !cur || !String(cur).trim();
  const blankArr = (cur: unknown) => !Array.isArray(cur) || cur.length === 0;
  const putStr = (key: string, cur: unknown, val: string | null, max = 4000) => {
    const v = aiStr(val, max);
    if (v && (mode === "all" || blankStr(cur))) { data[key] = v; filled.push(key); }
  };
  const putArr = (key: string, cur: unknown, val: unknown) => {
    const v = aiArr(val);
    if (v.length && (mode === "all" || blankArr(cur))) { data[key] = v; filled.push(key); }
  };

  putStr("summary", ver.summary, aiStr(p.summary, 400), 400);
  putStr("overview", ver.overview, aiStr(p.overview));
  putStr("bestFor", ver.bestFor, aiStr(p.bestFor, 160), 160);
  const cat = aiStr(p.category);
  if (cat && AI_CATEGORY.has(cat) && (mode === "all" || blankStr(ver.category))) { data.category = cat; filled.push("category"); }
  putStr("roomCategory", ver.roomCategory, aiStr(p.roomCategory, 80), 80);
  putStr("mealPlan", ver.mealPlan, aiStr(p.mealPlan, 80), 80);
  putStr("travelWindows", ver.travelWindows, aiStr(p.travelWindows, 120), 120);
  putArr("highlights", ver.highlights, p.highlights);
  putArr("inclusions", ver.inclusions, p.inclusions);
  putArr("exclusions", ver.exclusions, p.exclusions);
  putStr("cancellationPolicy", ver.cancellationPolicy, aiStr(p.cancellationPolicy, 2000), 2000);
  putStr("importantInfo", ver.importantInfo, aiStr(p.importantInfo, 2000), 2000);
  putStr("visaInfo", ver.visaInfo, aiStr(p.visaInfo, 400), 400);
  putStr("seoTitle", ver.seoTitle, aiStr(p.seoTitle, 160), 160);
  putStr("seoDescription", ver.seoDescription, aiStr(p.seoDescription, 320), 320);

  if (!filled.length) return { ok: false, error: mode === "blanks" ? "Nothing to fill — all fields already have content. Use “Regenerate all” to rewrite." : "The AI returned no usable content." };

  await db.packageVersion.update({ where: { id: versionId }, data });
  await writeAudit({ adminUserId: admin.id, action: "package.ai.autofill", resource: `Package:${ver.packageId}`, after: { mode, filled } });
  revalidateAll(ver.packageId, ver.package.slug);
  return { ok: true, filled };
}

// ── Version content ─────────────────────────────────────
const strArr = z.array(z.string()).max(60);
const versionSchema = z.object({
  name: z.string().min(3).max(120),
  summary: z.string().max(400).nullable().optional(),
  overview: z.string().max(4000).nullable().optional(),
  durationNights: z.number().int().min(1).max(30),
  basePrice: z.number().int().min(0),
  pricingStatus: z.enum(["PRICED", "PRICE_REVIEW_REQUIRED"]),
  availabilityStatus: z.enum(["AVAILABLE", "LIMITED", "ON_REQUEST", "UNAVAILABLE"]),
  category: z.string().max(40).nullable().optional(),
  bestFor: z.string().max(160).nullable().optional(),
  travelWindows: z.string().max(120).nullable().optional(),
  roomCategory: z.string().max(80).nullable().optional(),
  mealPlan: z.string().max(80).nullable().optional(),
  flightSector: z.string().max(120).nullable().optional(),
  baggage: z.string().max(120).nullable().optional(),
  visaInfo: z.string().max(400).nullable().optional(),
  insuranceInfo: z.string().max(400).nullable().optional(),
  seoTitle: z.string().max(160).nullable().optional(),
  seoDescription: z.string().max(320).nullable().optional(),
  departureCities: strArr,
  highlights: strArr,
  inclusions: strArr,
  exclusions: strArr,
  cancellationPolicy: z.string().max(2000).nullable().optional(),
  importantInfo: z.string().max(2000).nullable().optional(),
  minTravellers: z.number().int().min(1).max(99),
  maxTravellers: z.number().int().min(1).max(99),
  allowHotelChange: z.boolean(), allowFlightChange: z.boolean(), allowTransferChange: z.boolean(),
  allowMealChange: z.boolean(), allowActivityChange: z.boolean(), allowAddons: z.boolean(), allowDateChange: z.boolean(),
});

export async function updateVersionAction(versionId: string, input: unknown): Promise<R> {
  const admin = await authorize("package.edit");
  if (!admin) return { ok: false, error: "Not authorized." };
  const p = versionSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Please check the form." };
  const d = p.data;
  const ver = await db.packageVersion.findUnique({ where: { id: versionId }, select: { packageId: true, package: { select: { slug: true } } } });
  if (!ver) return { ok: false, error: "Version not found." };

  await db.packageVersion.update({
    where: { id: versionId },
    data: {
      name: d.name, summary: d.summary || null, overview: d.overview || null,
      durationNights: d.durationNights, durationDays: d.durationNights + 1,
      basePrice: d.basePrice, pricingStatus: d.pricingStatus, availabilityStatus: d.availabilityStatus,
      category: d.category || null, bestFor: d.bestFor || null, travelWindows: d.travelWindows || null,
      roomCategory: d.roomCategory || null, mealPlan: d.mealPlan || null, flightSector: d.flightSector || null,
      baggage: d.baggage || null, visaInfo: d.visaInfo || null, insuranceInfo: d.insuranceInfo || null,
      seoTitle: d.seoTitle || null, seoDescription: d.seoDescription || null,
      departureCities: d.departureCities, highlights: d.highlights, inclusions: d.inclusions, exclusions: d.exclusions,
      cancellationPolicy: d.cancellationPolicy || null, importantInfo: d.importantInfo || null,
      minTravellers: d.minTravellers, maxTravellers: Math.max(d.minTravellers, d.maxTravellers),
      allowHotelChange: d.allowHotelChange, allowFlightChange: d.allowFlightChange, allowTransferChange: d.allowTransferChange,
      allowMealChange: d.allowMealChange, allowActivityChange: d.allowActivityChange, allowAddons: d.allowAddons, allowDateChange: d.allowDateChange,
    },
  });
  await writeAudit({ adminUserId: admin.id, action: "package.version.update", resource: `Package:${ver.packageId}`, after: { name: d.name, basePrice: d.basePrice } });
  revalidateAll(ver.packageId, ver.package.slug);
  return { ok: true };
}

// ── Images ──────────────────────────────────────────────
async function versionCtx(versionId: string) {
  return db.packageVersion.findUnique({ where: { id: versionId }, select: { packageId: true, package: { select: { slug: true } } } });
}

export async function addImageAction(versionId: string, url: string, alt?: string): Promise<R> {
  const admin = await authorize("package.edit");
  if (!admin) return { ok: false, error: "Not authorized." };
  if (!/^https?:\/\/.+/i.test(url)) return { ok: false, error: "Enter a valid image URL (https://…)." };
  const ctx = await versionCtx(versionId);
  if (!ctx) return { ok: false, error: "Version not found." };
  const count = await db.packageImage.count({ where: { versionId } });
  await db.packageImage.create({ data: { versionId, url, alt: alt || null, isCover: count === 0, sortOrder: count } });
  await writeAudit({ adminUserId: admin.id, action: "package.image.add", resource: `Package:${ctx.packageId}` });
  revalidateAll(ctx.packageId, ctx.package.slug);
  return { ok: true };
}

export async function removeImageAction(imageId: string): Promise<R> {
  const admin = await authorize("package.edit");
  if (!admin) return { ok: false, error: "Not authorized." };
  const im = await db.packageImage.findUnique({ where: { id: imageId }, include: { version: { select: { packageId: true, package: { select: { slug: true } } } } } });
  if (!im) return { ok: false, error: "Image not found." };
  await db.packageImage.delete({ where: { id: imageId } });
  // ensure a cover remains
  const remaining = await db.packageImage.findFirst({ where: { versionId: im.versionId }, orderBy: { sortOrder: "asc" } });
  if (remaining && im.isCover) await db.packageImage.update({ where: { id: remaining.id }, data: { isCover: true } });
  revalidateAll(im.version.packageId, im.version.package.slug);
  return { ok: true };
}

export async function setCoverImageAction(imageId: string): Promise<R> {
  const admin = await authorize("package.edit");
  if (!admin) return { ok: false, error: "Not authorized." };
  const im = await db.packageImage.findUnique({ where: { id: imageId }, include: { version: { select: { packageId: true, package: { select: { slug: true } } } } } });
  if (!im) return { ok: false, error: "Image not found." };
  await db.$transaction([
    db.packageImage.updateMany({ where: { versionId: im.versionId }, data: { isCover: false } }),
    db.packageImage.update({ where: { id: imageId }, data: { isCover: true } }),
  ]);
  revalidateAll(im.version.packageId, im.version.package.slug);
  return { ok: true };
}

// ── Itinerary days & items ──────────────────────────────
export async function addDayAction(versionId: string): Promise<R> {
  const admin = await authorize("package.edit");
  if (!admin) return { ok: false, error: "Not authorized." };
  const ctx = await versionCtx(versionId);
  if (!ctx) return { ok: false, error: "Version not found." };
  const max = await db.packageDay.aggregate({ where: { versionId }, _max: { dayNumber: true } });
  const n = (max._max.dayNumber ?? 0) + 1;
  await db.packageDay.create({ data: { versionId, dayNumber: n, title: `Day ${n}` } });
  revalidateAll(ctx.packageId, ctx.package.slug);
  return { ok: true };
}

export async function updateDayAction(dayId: string, title: string, summary?: string): Promise<R> {
  const admin = await authorize("package.edit");
  if (!admin) return { ok: false, error: "Not authorized." };
  const day = await db.packageDay.findUnique({ where: { id: dayId }, include: { version: { select: { packageId: true, package: { select: { slug: true } } } } } });
  if (!day) return { ok: false, error: "Day not found." };
  await db.packageDay.update({ where: { id: dayId }, data: { title: title.slice(0, 160) || `Day ${day.dayNumber}`, summary: summary?.slice(0, 500) || null } });
  revalidateAll(day.version.packageId, day.version.package.slug);
  return { ok: true };
}

export async function deleteDayAction(dayId: string): Promise<R> {
  const admin = await authorize("package.edit");
  if (!admin) return { ok: false, error: "Not authorized." };
  const day = await db.packageDay.findUnique({ where: { id: dayId }, include: { version: { select: { id: true, packageId: true, package: { select: { slug: true } } } } } });
  if (!day) return { ok: false, error: "Day not found." };
  await db.packageDay.delete({ where: { id: dayId } });
  // renumber remaining days
  const days = await db.packageDay.findMany({ where: { versionId: day.version.id }, orderBy: { dayNumber: "asc" } });
  await db.$transaction(days.map((dd, i) => db.packageDay.update({ where: { id: dd.id }, data: { dayNumber: i + 1 } })));
  revalidateAll(day.version.packageId, day.version.package.slug);
  return { ok: true };
}

export async function moveDayAction(dayId: string, dir: "up" | "down"): Promise<R> {
  const admin = await authorize("package.edit");
  if (!admin) return { ok: false, error: "Not authorized." };
  const day = await db.packageDay.findUnique({ where: { id: dayId }, include: { version: { select: { id: true, packageId: true, package: { select: { slug: true } } } } } });
  if (!day) return { ok: false, error: "Day not found." };
  const neighbor = await db.packageDay.findFirst({
    where: { versionId: day.version.id, dayNumber: dir === "up" ? { lt: day.dayNumber } : { gt: day.dayNumber } },
    orderBy: { dayNumber: dir === "up" ? "desc" : "asc" },
  });
  if (!neighbor) return { ok: true };
  await db.$transaction([
    db.packageDay.update({ where: { id: day.id }, data: { dayNumber: neighbor.dayNumber } }),
    db.packageDay.update({ where: { id: neighbor.id }, data: { dayNumber: day.dayNumber } }),
  ]);
  revalidateAll(day.version.packageId, day.version.package.slug);
  return { ok: true };
}

const itemSchema = z.object({
  timeslot: z.enum(["MORNING", "AFTERNOON", "EVENING"]),
  kind: z.enum(DAY_ITEM_KIND),
  title: z.string().min(1).max(200),
  description: z.string().max(500).nullable().optional(),
});

export async function addItemAction(dayId: string, input: unknown): Promise<R> {
  const admin = await authorize("package.edit");
  if (!admin) return { ok: false, error: "Not authorized." };
  const p = itemSchema.safeParse(input);
  if (!p.success) return { ok: false, error: "Enter a title and valid type." };
  const day = await db.packageDay.findUnique({ where: { id: dayId }, include: { version: { select: { packageId: true, package: { select: { slug: true } } } } } });
  if (!day) return { ok: false, error: "Day not found." };
  const max = await db.packageDayItem.aggregate({ where: { dayId }, _max: { sortOrder: true } });
  await db.packageDayItem.create({ data: { dayId, timeslot: p.data.timeslot, kind: p.data.kind, title: p.data.title, description: p.data.description || null, sortOrder: (max._max.sortOrder ?? -1) + 1 } });
  revalidateAll(day.version.packageId, day.version.package.slug);
  return { ok: true };
}

export async function deleteItemAction(itemId: string): Promise<R> {
  const admin = await authorize("package.edit");
  if (!admin) return { ok: false, error: "Not authorized." };
  const item = await db.packageDayItem.findUnique({ where: { id: itemId }, include: { day: { include: { version: { select: { packageId: true, package: { select: { slug: true } } } } } } } });
  if (!item) return { ok: false, error: "Item not found." };
  await db.packageDayItem.delete({ where: { id: itemId } });
  revalidateAll(item.day.version.packageId, item.day.version.package.slug);
  return { ok: true };
}

// ── Options ─────────────────────────────────────────────
const optionSchema = z.object({
  category: z.enum(["HOTEL", "FLIGHT", "TRANSFER", "MEAL", "ACTIVITY", "ADDON"]),
  label: z.string().min(1).max(120),
  description: z.string().max(300).nullable().optional(),
  priceDelta: z.number().int(),
  isDefault: z.boolean().optional(),
});

export async function addOptionAction(versionId: string, input: unknown): Promise<R> {
  const admin = await authorize("package.edit");
  if (!admin) return { ok: false, error: "Not authorized." };
  const p = optionSchema.safeParse(input);
  if (!p.success) return { ok: false, error: "Enter a label and price difference." };
  const ctx = await versionCtx(versionId);
  if (!ctx) return { ok: false, error: "Version not found." };
  const additive = p.data.category === "ACTIVITY" || p.data.category === "ADDON";
  const groupKey = additive ? `${p.data.category.toLowerCase()}-${Date.now().toString(36)}` : p.data.category.toLowerCase();
  const max = await db.packageOption.aggregate({ where: { versionId }, _max: { sortOrder: true } });
  await db.packageOption.create({ data: { versionId, category: p.data.category, groupKey, label: p.data.label, description: p.data.description || null, priceDelta: p.data.priceDelta, perPerson: true, isDefault: !!p.data.isDefault, sortOrder: (max._max.sortOrder ?? -1) + 1 } });
  revalidateAll(ctx.packageId, ctx.package.slug);
  return { ok: true };
}

export async function deleteOptionAction(optionId: string): Promise<R> {
  const admin = await authorize("package.edit");
  if (!admin) return { ok: false, error: "Not authorized." };
  const opt = await db.packageOption.findUnique({ where: { id: optionId }, include: { version: { select: { packageId: true, package: { select: { slug: true } } } } } });
  if (!opt) return { ok: false, error: "Option not found." };
  await db.packageOption.delete({ where: { id: optionId } });
  revalidateAll(opt.version.packageId, opt.version.package.slug);
  return { ok: true };
}
