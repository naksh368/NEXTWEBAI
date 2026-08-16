import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAdmin, hasPermission } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/services/audit-service";
import { saveDocument, ALLOWED_DOC_MIME, MAX_DOC_BYTES } from "@/lib/storage";
import { DOCUMENT_TYPES } from "@/lib/constants";

export const runtime = "nodejs";

/** POST /api/admin/bookings/[id]/documents — admin uploads a document (Phase 20). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin || !hasPermission(admin, "booking.update")) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
  }
  const { id: bookingId } = await params;
  const booking = await db.booking.findUnique({ where: { id: bookingId }, select: { id: true } });
  if (!booking) return NextResponse.json({ ok: false, error: "Booking not found." }, { status: 404 });

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: "Invalid upload." }, { status: 400 });

  const file = form.get("file");
  const type = String(form.get("type") ?? "OTHER");
  const title = String(form.get("title") ?? "").trim();

  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "No file provided." }, { status: 422 });
  if (!DOCUMENT_TYPES.includes(type as never)) return NextResponse.json({ ok: false, error: "Invalid document type." }, { status: 422 });
  const ext = ALLOWED_DOC_MIME[file.type];
  if (!ext) return NextResponse.json({ ok: false, error: "Only PDF, JPG, PNG or WEBP files are allowed." }, { status: 415 });
  if (file.size > MAX_DOC_BYTES) return NextResponse.json({ ok: false, error: "File is larger than 10 MB." }, { status: 413 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const storageKey = await saveDocument(bytes, ext);

  const doc = await db.document.create({
    data: { bookingId, type, title: title || file.name, storageKey },
    select: { id: true, type: true, title: true, createdAt: true },
  });
  await writeAudit({ adminUserId: admin.id, action: "document.upload", resource: `Booking:${bookingId}`, after: { type, title: doc.title } });

  return NextResponse.json({ ok: true, document: doc }, { headers: { "Cache-Control": "no-store" } });
}
