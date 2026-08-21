import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionCustomerId } from "@/lib/session";
import { getAdminSessionId } from "@/lib/admin-session";
import { readDocument, contentTypeForKey } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * GET /api/documents/[id] — access-controlled document download (Phase 30).
 * Only an admin, or the customer who owns the booking, may fetch a document.
 * Files are never exposed via a public URL.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await db.document.findUnique({
    where: { id },
    include: { booking: { select: { customerId: true } } },
  });
  if (!doc) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const [adminId, customerId] = await Promise.all([getAdminSessionId(), getSessionCustomerId()]);
  const allowed = Boolean(adminId) || (customerId && customerId === doc.booking.customerId);
  if (!allowed) return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });

  let bytes: Buffer;
  let contentType: string;
  if (doc.data) {
    // Stored in the DB (serverless-safe).
    bytes = Buffer.from(doc.data);
    contentType = doc.contentType ?? "application/octet-stream";
  } else if (doc.storageKey) {
    // Legacy on-disk file (dev).
    try {
      bytes = await readDocument(doc.storageKey);
      contentType = contentTypeForKey(doc.storageKey);
    } catch {
      return NextResponse.json({ ok: false, error: "File unavailable." }, { status: 410 });
    }
  } else {
    return NextResponse.json({ ok: false, error: "File unavailable." }, { status: 410 });
  }

  const filename = `${doc.title}`.replace(/[^\w.\- ]/g, "_");
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
