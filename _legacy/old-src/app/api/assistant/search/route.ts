import { NextResponse } from "next/server";
import { z } from "zod";
import { groundedPicks } from "@/lib/services/assistant-search";

export const runtime = "nodejs";

const schema = z.object({ query: z.string().min(1).max(300) });

/** Grounded package search (keyword). Real data only — never invents packages. */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Please describe your trip." }, { status: 422 });

  const { message, parsed: intent, results } = await groundedPicks(parsed.data.query);
  return NextResponse.json({ ok: true, message, parsed: intent, results }, { headers: { "Cache-Control": "no-store" } });
}
