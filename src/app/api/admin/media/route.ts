import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSessionId } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 6 * 1024 * 1024; // 6 MB per image
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

/** GET /api/admin/media — list assets (admin only) for the media library. */
export async function GET() {
  const adminId = await getAdminSessionId();
  if (!adminId) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  const assets = await db.mediaAsset.findMany({
    orderBy: { createdAt: "desc" }, take: 200,
    select: { id: true, filename: true, contentType: true, size: true, alt: true, createdAt: true },
  });
  return NextResponse.json({ ok: true, assets }, { headers: { "Cache-Control": "no-store" } });
}

/** POST /api/admin/media — upload one image (multipart 'file'), stored in the DB. */
export async function POST(request: Request) {
  const adminId = await getAdminSessionId();
  if (!adminId) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  let form: FormData;
  try { form = await request.formData(); }
  catch { return NextResponse.json({ ok: false, error: "Send the image as multipart form data." }, { status: 400 }); }

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "No file provided." }, { status: 400 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ ok: false, error: "Only JPG, PNG, WebP, GIF or AVIF images are allowed." }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length === 0) return NextResponse.json({ ok: false, error: "That file is empty." }, { status: 400 });
  if (buf.length > MAX_BYTES) return NextResponse.json({ ok: false, error: "Image is too large (max 6 MB). Compress it and try again." }, { status: 400 });

  const alt = String(form.get("alt") ?? "").trim().slice(0, 200) || null;
  const asset = await db.mediaAsset.create({
    data: { filename: (file.name || "image").slice(0, 200), contentType: file.type, data: buf, size: buf.length, alt, createdById: adminId },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: asset.id, url: `/api/media/${asset.id}` }, { headers: { "Cache-Control": "no-store" } });
}
