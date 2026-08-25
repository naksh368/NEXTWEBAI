import { NextResponse } from "next/server";
import { getPackagesBySlugs } from "@/lib/queries";

export const runtime = "nodejs";

/** GET /api/packages/cards?slugs=a,b,c → published card data for the wishlist/compare. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const slugs = (url.searchParams.get("slugs") ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 30);
  const items = await getPackagesBySlugs(slugs);
  return NextResponse.json({ ok: true, items }, { headers: { "Cache-Control": "no-store" } });
}
