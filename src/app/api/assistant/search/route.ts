import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { TAX_RATE } from "@/lib/constants";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

/**
 * Grounded assistant search (Phase 21). This intentionally does NOT call an LLM
 * to *generate* answers — it parses intent and retrieves REAL published packages
 * from the database. It can never invent packages, prices or availability. Wire
 * an LLM on top later strictly as a tool-caller against this same data.
 */
const schema = z.object({ query: z.string().min(1).max(300) });

const DESTINATIONS: Record<string, string> = {
  dubai: "dubai", bali: "bali", maldives: "maldives", thailand: "thailand",
  phuket: "thailand", krabi: "thailand", bangkok: "thailand", pattaya: "thailand",
  singapore: "singapore", europe: "europe", paris: "europe", switzerland: "europe", rome: "europe",
};

function parseBudget(q: string): number | null {
  // ₹1.5 lakh / 1.5l / 150000 / 150k
  const lakh = q.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l\b)/);
  if (lakh) return Math.round(parseFloat(lakh[1]) * 100000);
  const k = q.match(/(\d+(?:\.\d+)?)\s*k\b/);
  if (k) return Math.round(parseFloat(k[1]) * 1000);
  const rupees = q.match(/(?:₹|rs\.?|inr)?\s*([1-9]\d{4,7})/);
  if (rupees) return parseInt(rupees[1], 10);
  return null;
}

function parsePax(q: string): number {
  const m = q.match(/(\d+)\s*(?:people|persons?|pax|adults?|travellers?|guests?)/) || q.match(/for\s+(\d+)/);
  return m ? Math.min(12, Math.max(1, parseInt(m[1], 10))) : 2;
}

function parseDays(q: string): number | null {
  const m = q.match(/(\d+)[\s-]*(?:day|days|night|nights|n\/|d\b)/);
  return m ? parseInt(m[1], 10) : null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Please describe your trip." }, { status: 422 });

  const q = parsed.data.query.toLowerCase();
  const destSlug = Object.keys(DESTINATIONS).find((k) => q.includes(k));
  const destination = destSlug ? DESTINATIONS[destSlug] : undefined;
  const budget = parseBudget(q);
  const pax = parsePax(q);
  const days = parseDays(q);

  const where: Prisma.PackageWhereInput = {
    status: "PUBLISHED",
    ...(destination ? { destination: { slug: destination } } : {}),
  };

  const rows = await db.package.findMany({
    where,
    include: {
      destination: { select: { name: true, slug: true } },
      currentVersion: { include: { images: { where: { isCover: true }, take: 1 } } },
    },
    take: 30,
  });

  // Score real packages against the parsed intent — no fabrication.
  const scored = rows
    .filter((r) => r.currentVersion)
    .map((r) => {
      const v = r.currentVersion!;
      const estTotal = Math.round(v.basePrice * pax * (1 + TAX_RATE));
      const withinBudget = budget ? estTotal <= budget : true;
      let score = 0;
      if (destination && r.destination.slug === destination) score += 5;
      if (withinBudget) score += 3;
      if (budget && estTotal <= budget * 0.85) score += 1; // comfortably under
      if (days) score += Math.max(0, 3 - Math.abs(v.durationDays - days));
      if (r.isFeatured) score += 1;
      return {
        score, withinBudget, estTotal,
        pkg: {
          id: r.id, slug: r.slug, name: r.name, theme: r.theme,
          destination: { name: r.destination.name, slug: r.destination.slug },
          cover: v.images[0]?.url ?? null,
          nights: v.durationNights, days: v.durationDays,
          basePrice: v.basePrice, currency: v.currency, summary: v.summary,
          estTotal, featured: r.isFeatured,
        },
      };
    })
    .filter((s) => (budget ? s.withinBudget : true))
    .sort((a, b) => b.score - a.score || a.estTotal - b.estTotal);

  if (scored.length === 0) {
    return NextResponse.json({
      ok: true,
      message: budget
        ? "I couldn't find a real published package within that budget. Try increasing the budget or removing the destination filter — I only ever show genuine packages, never invented ones."
        : "I couldn't find a matching published package yet. Try a destination like Dubai, Bali or Thailand.",
      parsed: { destination, budget, pax, days },
      results: [],
    });
  }

  // Labelled picks from the real result set.
  const byPrice = [...scored].sort((a, b) => a.pkg.basePrice - b.pkg.basePrice);
  const results = [
    { label: "Best match", pkg: scored[0].pkg },
    { label: "Best value", pkg: byPrice[0].pkg },
    { label: "Most popular", pkg: (scored.find((s) => s.pkg.featured) ?? scored[0]).pkg },
    { label: "Premium", pkg: byPrice[byPrice.length - 1].pkg },
  ].filter((r, i, arr) => arr.findIndex((x) => x.pkg.id === r.pkg.id) === i); // dedupe

  const parts = [`Found ${scored.length} real published package${scored.length > 1 ? "s" : ""}`];
  if (destination) parts.push(`in ${scored[0].pkg.destination.name}`);
  if (budget) parts.push(`within ~₹${budget.toLocaleString("en-IN")} for ${pax}`);
  return NextResponse.json({
    ok: true,
    message: parts.join(" ") + ". Here are my top picks:",
    parsed: { destination, budget, pax, days },
    results,
  });
}
