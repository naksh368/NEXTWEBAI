import { db } from "@/lib/db";
import { TAX_RATE } from "@/lib/constants";
import type { Prisma } from "@prisma/client";

/**
 * Grounded package retrieval — the ONLY source the assistant may answer from.
 * Parses intent and returns REAL published packages. Never invents anything.
 * Used both by the keyword fallback and as the LLM's function-call tool.
 */

const DESTINATIONS: Record<string, string> = {
  dubai: "dubai", bali: "bali", maldives: "maldives", thailand: "thailand",
  phuket: "thailand", krabi: "thailand", bangkok: "thailand", pattaya: "thailand",
  singapore: "singapore", europe: "europe", paris: "europe", switzerland: "europe", rome: "europe",
};

export function parseIntent(query: string) {
  const q = query.toLowerCase();
  const destKey = Object.keys(DESTINATIONS).find((k) => q.includes(k));
  const destination = destKey ? DESTINATIONS[destKey] : undefined;

  let budget: number | null = null;
  const lakh = q.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l\b)/);
  const k = q.match(/(\d+(?:\.\d+)?)\s*k\b/);
  const rupees = q.match(/(?:₹|rs\.?|inr)?\s*([1-9]\d{4,7})/);
  if (lakh) budget = Math.round(parseFloat(lakh[1]) * 100000);
  else if (k) budget = Math.round(parseFloat(k[1]) * 1000);
  else if (rupees) budget = parseInt(rupees[1], 10);

  const paxM = q.match(/(\d+)\s*(?:people|persons?|pax|adults?|travellers?|guests?)/) || q.match(/for\s+(\d+)/);
  const pax = paxM ? Math.min(12, Math.max(1, parseInt(paxM[1], 10))) : 2;
  const daysM = q.match(/(\d+)[\s-]*(?:day|days|night|nights)/);
  const days = daysM ? parseInt(daysM[1], 10) : null;

  return { destination, budget, pax, days };
}

export type GroundedPackage = {
  id: string; slug: string; name: string; theme: string | null;
  destination: { name: string; slug: string }; cover: string | null;
  nights: number; days: number; basePrice: number; currency: string;
  summary: string | null; estTotal: number; featured: boolean;
};

/** Returns real published packages scored against the parsed intent. */
export async function searchPackages(query: string): Promise<{ parsed: ReturnType<typeof parseIntent>; packages: GroundedPackage[] }> {
  const parsed = parseIntent(query);
  const where: Prisma.PackageWhereInput = {
    status: "PUBLISHED",
    ...(parsed.destination ? { destination: { slug: parsed.destination } } : {}),
  };

  const rows = await db.package.findMany({
    where,
    include: {
      destination: { select: { name: true, slug: true } },
      currentVersion: { include: { images: { where: { isCover: true }, take: 1 } } },
    },
    take: 30,
  });

  const scored = rows
    .filter((r) => r.currentVersion)
    .map((r) => {
      const v = r.currentVersion!;
      const estTotal = Math.round(v.basePrice * parsed.pax * (1 + TAX_RATE));
      const withinBudget = parsed.budget ? estTotal <= parsed.budget : true;
      let score = 0;
      if (parsed.destination && r.destination.slug === parsed.destination) score += 5;
      if (withinBudget) score += 3;
      if (parsed.budget && estTotal <= parsed.budget * 0.85) score += 1;
      if (parsed.days) score += Math.max(0, 3 - Math.abs(v.durationDays - parsed.days));
      if (r.isFeatured) score += 1;
      return {
        score, withinBudget,
        pkg: {
          id: r.id, slug: r.slug, name: r.name, theme: r.theme,
          destination: { name: r.destination.name, slug: r.destination.slug },
          cover: v.images[0]?.url ?? null, nights: v.durationNights, days: v.durationDays,
          basePrice: v.basePrice, currency: v.currency, summary: v.summary, estTotal, featured: r.isFeatured,
        } as GroundedPackage,
      };
    })
    .filter((s) => (parsed.budget ? s.withinBudget : true))
    .sort((a, b) => b.score - a.score || a.pkg.basePrice - b.pkg.basePrice);

  return { parsed, packages: scored.map((s) => s.pkg) };
}

/** Labelled picks for the keyword-fallback UI. */
export async function groundedPicks(query: string) {
  const { parsed, packages } = await searchPackages(query);
  if (packages.length === 0) {
    return {
      message: parsed.budget
        ? "I couldn't find a real published package within that budget. Try increasing the budget or removing the destination — I only ever show genuine packages."
        : "I couldn't find a matching published package yet. Try a destination like Dubai, Bali or Thailand.",
      parsed, results: [] as { label: string; pkg: GroundedPackage }[],
    };
  }
  const byPrice = [...packages].sort((a, b) => a.basePrice - b.basePrice);
  const results = [
    { label: "Best match", pkg: packages[0] },
    { label: "Best value", pkg: byPrice[0] },
    { label: "Most popular", pkg: packages.find((p) => p.featured) ?? packages[0] },
    { label: "Premium", pkg: byPrice[byPrice.length - 1] },
  ].filter((r, i, arr) => arr.findIndex((x) => x.pkg.id === r.pkg.id) === i);

  const parts = [`Found ${packages.length} real published package${packages.length > 1 ? "s" : ""}`];
  if (parsed.destination) parts.push(`in ${packages[0].destination.name}`);
  if (parsed.budget) parts.push(`within ~₹${parsed.budget.toLocaleString("en-IN")} for ${parsed.pax}`);
  return { message: parts.join(" ") + ". Here are my top picks:", parsed, results };
}
