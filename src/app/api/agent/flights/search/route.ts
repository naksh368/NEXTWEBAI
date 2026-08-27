import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionCustomerId } from "@/lib/session";
import { getSupplier } from "@/lib/services/flight-supplier";

export const runtime = "nodejs";

const schema = z.object({
  origin: z.string().trim().min(2).max(40),
  destination: z.string().trim().min(2).max(40),
  departDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a travel date."),
  pax: z.number().int().min(1).max(9).default(1),
  cabin: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]).default("ECONOMY"),
});

export async function POST(request: Request) {
  const customerId = await getSessionCustomerId();
  if (!customerId) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid search." }, { status: 422 });

  const { origin, destination, departDate, pax, cabin } = parsed.data;
  if (origin.trim().toUpperCase() === destination.trim().toUpperCase()) {
    return NextResponse.json({ ok: false, error: "Origin and destination must differ." }, { status: 422 });
  }

  const offers = await getSupplier().searchFlights({ origin, destination, departDate, pax, cabin });
  return NextResponse.json({ ok: true, pax, offers }, { headers: { "Cache-Control": "no-store" } });
}
