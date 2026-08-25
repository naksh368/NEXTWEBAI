import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/**
 * POST /api/packages/[slug]/view — increment a published package's view counter.
 * Called client-side (once per session per package), so non-JS bots don't inflate it.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    await db.package.updateMany({ where: { slug, status: "PUBLISHED" }, data: { views: { increment: 1 } } });
  } catch { /* never fail a view ping */ }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
