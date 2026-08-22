import { NextResponse } from "next/server";
import { searchCities } from "@/lib/data/indian-cities";

export const runtime = "nodejs";

/** Debounced departure-city search. GET /api/cities?q=del&limit=12 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").slice(0, 60);
  const limit = Math.min(20, Math.max(1, Number(url.searchParams.get("limit") ?? 12) || 12));
  const cities = searchCities(q, limit).map((c) => ({
    city: c.city,
    state: c.state,
    label: c.airport ? `${c.city} (${c.airport.code})` : c.city,
    airportCode: c.airport?.code ?? null,
  }));
  return NextResponse.json({ ok: true, cities }, { headers: { "Cache-Control": "public, max-age=600" } });
}
