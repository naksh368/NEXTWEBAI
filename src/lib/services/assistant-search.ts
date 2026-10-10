import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/**
 * Grounded package retrieval — the ONLY inventory the trip planner may answer
 * from. It reads published packages straight from the database on every call,
 * so a package an administrator publishes (or a price they change) is visible
 * to the planner immediately, with no redeploy and no cache to clear.
 *
 * Used both as the LLM's `search_packages` tool and as the keyword fallback
 * when no AI key is configured. It never invents anything.
 */

/** Hotel-tier words a traveller might use, mapped to the package theme. */
const TIER_WORDS: [RegExp, string][] = [
  [/\b(4|four)[\s-]*star\b|\bluxury\b|\bpremium\b|\bresort\b/, "FOUR_STAR"],
  [/\b(3|three)[\s-]*star\b/, "THREE_STAR"],
  [/\b(2|two)[\s-]*star\b/, "TWO_STAR"],
  [/\bstandard\b/, "STANDARD"],
  [/\bbudget\b|\bcheap(est)?\b|\blow[\s-]*cost\b|\baffordable\b/, "BUDGET"],
];

export type ParsedIntent = {
  tier?: string;
  budget: number | null;
  /** Explicit group size, or null when the traveller did not say. */
  pax: number | null;
  days: number | null;
};

export function parseIntent(query: string): ParsedIntent {
  const q = query.toLowerCase();

  const tier = TIER_WORDS.find(([re]) => re.test(q))?.[1];

  // Budget: "1 lakh", "1.5L", "80k", "₹60,000". Commas are stripped first so
  // "60,000" reads as one number. Four-digit numbers are ignored so a year
  // ("in 2026") is never mistaken for a budget.
  const plain = q.replace(/(\d),(\d)/g, "$1$2");
  let budget: number | null = null;
  const lakh = plain.match(/(\d+(?:\.\d+)?)\s*(?:lakhs?|l)\b/);
  const thousand = plain.match(/(\d+(?:\.\d+)?)\s*k\b/);
  const rupees = plain.match(/(?:₹|rs\.?|inr)\s*(\d{4,8})|\b(\d{5,8})\b/);
  if (lakh) budget = Math.round(parseFloat(lakh[1]) * 100_000);
  else if (thousand) budget = Math.round(parseFloat(thousand[1]) * 1_000);
  else if (rupees) budget = parseInt(rupees[1] ?? rupees[2], 10);

  const paxM =
    q.match(/(\d+)\s*(?:people|persons?|pax|adults?|travell?ers?|guests?|of us|members?)/) ||
    q.match(/\bfor\s+(\d+)\b(?!\s*(?:days?|nights?|k\b|lakh))/) ||
    (/\b(couple|honeymoon|two of us)\b/.test(q) ? ["", "2"] : null) ||
    (/\bfamily of (\d+)/.exec(q) as RegExpExecArray | null);
  const pax = paxM ? Math.min(50, Math.max(1, parseInt(paxM[1], 10))) : null;

  const daysM = q.match(/(\d+)\s*[-\s]?(?:days?|d\b)/);
  const nightsM = q.match(/(\d+)\s*[-\s]?(?:nights?|n\b)/);
  const days = daysM ? parseInt(daysM[1], 10) : nightsM ? parseInt(nightsM[1], 10) + 1 : null;

  return { tier, budget, pax, days };
}

export type GroundedPackage = {
  id: string;
  slug: string;
  name: string;
  theme: string | null;
  destination: { name: string; slug: string };
  cover: string | null;
  nights: number;
  days: number;
  basePrice: number;
  currency: string;
  summary: string | null;
  hotelCategory: string | null;
  minTravellers: number;
  perPerson: boolean;
  inclusions: string[];
  route: string[];
  /** Starting price × group size, BEFORE taxes. Never presented as final. */
  estTotal: number;
  /** True when the requested group is smaller than the package minimum. */
  belowMinimum: boolean;
  featured: boolean;
};

function strings(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

/** Real published packages, scored against the parsed intent. */
export async function searchPackages(
  query: string
): Promise<{ parsed: ParsedIntent; packages: GroundedPackage[] }> {
  const parsed = parseIntent(query);
  const where: Prisma.PackageWhereInput = { status: "PUBLISHED" };

  const rows = await db.package.findMany({
    where,
    include: {
      destination: { select: { name: true, slug: true } },
      currentVersion: { include: { images: { where: { isCover: true }, take: 1 } } },
    },
    take: 50,
  });

  const scored = rows
    .filter((r) => r.currentVersion && r.currentVersion.pricingStatus !== "PRICE_REVIEW_REQUIRED")
    .map((r) => {
      const v = r.currentVersion!;
      // Price the group at its real size, but never below the package minimum —
      // that is the smallest party the advertised rate applies to.
      const group = parsed.pax ?? v.minTravellers;
      const pricedGroup = Math.max(group, v.minTravellers);
      const estTotal = v.perPersonPricing ? v.basePrice * pricedGroup : v.basePrice;
      const withinBudget = parsed.budget ? estTotal <= parsed.budget : true;

      let score = 0;
      if (parsed.tier && r.theme === parsed.tier) score += 6;
      if (withinBudget) score += 3;
      if (parsed.budget && estTotal <= parsed.budget * 0.85) score += 1;
      if (parsed.days) score += Math.max(0, 3 - Math.abs(v.durationDays - parsed.days));
      if (r.isFeatured) score += 1;

      const route = Array.isArray(v.cityBreakdown)
        ? (v.cityBreakdown as { city?: unknown }[])
            .map((c) => c?.city)
            .filter((c): c is string => typeof c === "string")
        : [];

      return {
        score,
        withinBudget,
        pkg: {
          id: r.id,
          slug: r.slug,
          name: r.name,
          theme: r.theme,
          destination: { name: r.destination.name, slug: r.destination.slug },
          cover: v.images[0]?.url ?? null,
          nights: v.durationNights,
          days: v.durationDays,
          basePrice: v.basePrice,
          currency: v.currency,
          summary: v.summary,
          hotelCategory: v.roomCategory,
          minTravellers: v.minTravellers,
          perPerson: v.perPersonPricing,
          inclusions: strings(v.inclusions).slice(0, 8),
          route,
          estTotal,
          belowMinimum: parsed.pax !== null && parsed.pax < v.minTravellers,
          featured: r.isFeatured,
        } satisfies GroundedPackage,
      };
    })
    .filter((s) => (parsed.budget ? s.withinBudget : true))
    .sort((a, b) => b.score - a.score || a.pkg.basePrice - b.pkg.basePrice);

  return { parsed, packages: scored.map((s) => s.pkg) };
}

/** Published destinations — read live so newly added places reach the planner. */
export async function listDestinations(): Promise<{ name: string; slug: string; summary: string | null }[]> {
  try {
    return await db.destination.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
      select: { name: true, slug: true, shortSummary: true },
    }).then((rows) => rows.map((d) => ({ name: d.name, slug: d.slug, summary: d.shortSummary })));
  } catch {
    return [];
  }
}

function inr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

/** Labelled picks for the keyword fallback (used when AI is off or busy). */
export async function groundedPicks(query: string) {
  const { parsed, packages } = await searchPackages(query);

  if (packages.length === 0) {
    return {
      message: parsed.budget
        ? `None of our current packages fits within ${inr(parsed.budget)} for your group. Our packages start at a minimum group size, so a larger group or a slightly higher budget usually opens up options — or send us an enquiry and we will suggest something that fits.`
        : "I could not find a published package that matches that yet. Tell me your dates, group size and budget, or send us an enquiry and our team will put a plan together.",
      parsed,
      results: [] as { label: string; pkg: GroundedPackage }[],
    };
  }

  const byPrice = [...packages].sort((a, b) => a.basePrice - b.basePrice);
  const results = [
    { label: "Best match", pkg: packages[0] },
    { label: "Best value", pkg: byPrice[0] },
    { label: "Most popular", pkg: packages.find((p) => p.featured) ?? packages[0] },
    { label: "Most comfortable", pkg: byPrice[byPrice.length - 1] },
  ].filter((r, i, arr) => arr.findIndex((x) => x.pkg.id === r.pkg.id) === i);

  const parts = [
    `I found ${packages.length} Andaman package${packages.length > 1 ? "s" : ""}`,
  ];
  if (parsed.budget) parts.push(`within about ${inr(parsed.budget)}`);
  if (parsed.pax) parts.push(`for ${parsed.pax} ${parsed.pax === 1 ? "traveller" : "travellers"}`);

  const minPax = Math.min(...packages.map((p) => p.minTravellers));
  const note =
    parsed.pax !== null && parsed.pax < minPax
      ? ` These rates apply to groups of ${minPax} or more, so for ${parsed.pax} the per-person price will be a little higher — our team will quote it exactly.`
      : "";

  return {
    message: `${parts.join(" ")}. Prices are starting rates per person before GST, confirmed in writing by our team.${note}`,
    parsed,
    results,
  };
}
