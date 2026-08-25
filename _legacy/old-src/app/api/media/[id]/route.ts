import { db } from "@/lib/db";

export const runtime = "nodejs";

/**
 * GET /api/media/[id] — serve a self-hosted media asset (image bytes stored in
 * the DB). Public read (these are catalogue images meant to be shown on the
 * site), cached hard since bytes never change for an id.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asset = await db.mediaAsset.findUnique({ where: { id }, select: { data: true, contentType: true } });
  if (!asset) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(asset.data), {
    headers: {
      "Content-Type": asset.contentType || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
