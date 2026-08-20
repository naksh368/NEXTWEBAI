"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { authorize } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/services/audit-service";
import { slugify } from "@/lib/utils";
import { safeFetchHtml, extractFacts, type ExtractedFacts } from "@/lib/services/importer";

type R<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string };

// ── Scan a supplier / public package URL (admin only) ──────────────
export async function scanSource(rawUrl: string): Promise<R<{ facts: ExtractedFacts; host: string; sourceUrl: string }>> {
  const admin = await authorize("package.create");
  if (!admin) return { ok: false, error: "You don't have permission to import packages." };

  const parsed = z.string().url().max(2048).safeParse((rawUrl ?? "").trim());
  if (!parsed.success) return { ok: false, error: "Enter a valid https:// package URL." };

  const fetched = await safeFetchHtml(parsed.data);
  if (!fetched.ok) return { ok: false, error: fetched.error };

  const facts = extractFacts(fetched.html);
  await writeAudit({
    adminUserId: admin.id,
    action: "package.import.scan",
    resource: `Import:${fetched.host}`,
    after: { sourceUrl: fetched.finalUrl, extracted: { name: facts.name, prices: facts.priceCandidates, nights: facts.durationNights } },
  });

  return { ok: true, facts, host: fetched.host, sourceUrl: fetched.finalUrl };
}

// ── Create a DRAFT package from reviewed import data (admin only) ───
const draftSchema = z.object({
  name: z.string().min(3, "Package name is required.").max(120),
  destinationId: z.string().min(1, "Choose a destination."),
  nights: z.coerce.number().int().min(1).max(30),
  basePrice: z.coerce.number().int().min(0).max(5_000_000),
  category: z.string().max(40).optional().nullable(),
  bestFor: z.string().max(160).optional().nullable(),
  summary: z.string().max(400).optional().nullable(),
  overview: z.string().max(4000).optional().nullable(),
  highlights: z.array(z.string().max(200)).max(30).default([]),
  inclusions: z.array(z.string().max(200)).max(40).default([]),
  exclusions: z.array(z.string().max(200)).max(40).default([]),
  sourceUrl: z.string().url().max(2048).optional().nullable(),
  sourceName: z.string().max(120).optional().nullable(),
});

// ── Optional AI rewrite into original ExpertzTrip copy ─────────────
// Honest gating: only works when ANTHROPIC_API_KEY is configured. Never
// invents facts — it only rephrases the supplied factual notes.
export async function rewriteForExpertzTrip(input: { name: string; facts: string }): Promise<R<{ summary: string; overview: string }>> {
  const admin = await authorize("package.create");
  if (!admin) return { ok: false, error: "Not authorized." };

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return { ok: false, error: "AI rewrite is not configured. Add ANTHROPIC_API_KEY to enable it — you can still write copy manually." };
  }

  const prompt = `You are a travel copywriter for ExpertzTrip, a premium Indian holiday brand.
Rewrite the following FACTUAL package notes into ORIGINAL, concise, premium copy.
Rules: do NOT copy supplier wording; do NOT invent inclusions, prices, hotels or reviews;
keep every fact accurate; warm but not cheesy.
Return STRICT JSON: {"summary": "<=280 chars", "overview": "2-3 short paragraphs"}.

Package name: ${input.name}
Factual notes:
${input.facts.slice(0, 4000)}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 900,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return { ok: false, error: `AI service returned an error (HTTP ${res.status}).` };
    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { ok: false, error: "AI response could not be parsed." };
    const out = JSON.parse(jsonMatch[0]);
    return { ok: true, summary: String(out.summary ?? "").slice(0, 400), overview: String(out.overview ?? "").slice(0, 4000) };
  } catch {
    return { ok: false, error: "Could not reach the AI service. Please write copy manually." };
  }
}

export async function createDraftFromImport(input: unknown): Promise<R<{ packageId: string; slug: string }>> {
  const admin = await authorize("package.create");
  if (!admin) return { ok: false, error: "You don't have permission to import packages." };

  const p = draftSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Please review the fields." };
  const d = p.data;

  let slug = slugify(d.name);
  if (await db.package.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const pkg = await db.package.create({
    data: {
      slug, name: d.name, theme: "GROUP", destinationId: d.destinationId,
      status: "DRAFT", // never auto-published
      sourceUrl: d.sourceUrl ?? null,
      sourceName: d.sourceName ?? null,
      importedById: admin.id,
      scannedAt: new Date(),
      versions: {
        create: {
          versionNumber: 1, isPublished: false, name: d.name,
          durationNights: d.nights, durationDays: d.nights + 1,
          currency: "INR", basePrice: d.basePrice, perPersonPricing: true,
          category: d.category ?? null, bestFor: d.bestFor ?? null,
          summary: d.summary ?? null, overview: d.overview ?? null,
          pricingStatus: d.basePrice > 0 ? "PRICED" : "PRICE_REVIEW_REQUIRED",
          availabilityStatus: "AVAILABLE",
          highlights: d.highlights, inclusions: d.inclusions, exclusions: d.exclusions,
          departureCities: ["Delhi", "Mumbai", "Bengaluru"],
        },
      },
    },
    include: { versions: true },
  });
  await db.package.update({ where: { id: pkg.id }, data: { currentVersionId: pkg.versions[0].id } });

  await writeAudit({
    adminUserId: admin.id,
    action: "package.import.draft",
    resource: `Package:${pkg.id}`,
    after: { name: d.name, sourceUrl: d.sourceUrl, basePrice: d.basePrice },
  });

  return { ok: true, packageId: pkg.id, slug };
}
