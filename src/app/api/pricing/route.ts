import { NextResponse } from "next/server";
import { z } from "zod";
import { reprice } from "@/lib/services/pricing-service";

export const runtime = "nodejs";

const schema = z.object({
  versionId: z.string().min(1),
  travellerCount: z.number().int().min(1).max(99),
  selectedOptionIds: z.array(z.string()).default([]),
  departureId: z.string().nullable().optional(),
  couponCode: z.string().max(40).nullable().optional(),
});

/** POST /api/pricing — server-authoritative reprice (Phase 10). */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid pricing request." }, { status: 422 });
  }

  const result = await reprice(parsed.data);
  if (!result.ok) {
    return NextResponse.json(result, { status: 409 });
  }
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
