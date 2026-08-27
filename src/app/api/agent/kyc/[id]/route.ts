import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSessionCustomerId } from "@/lib/session";
import { getAdminSessionId } from "@/lib/admin-session";

export const runtime = "nodejs";

/** View a KYC document / logo. Access: the owning agent OR any signed-in admin. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await db.agencyDocument.findUnique({ where: { id }, select: { customerId: true, contentType: true, filename: true, data: true } });
  if (!doc) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const customerId = await getSessionCustomerId();
  const isOwner = customerId && customerId === doc.customerId;
  const isAdmin = !isOwner && Boolean(await getAdminSessionId());
  if (!isOwner && !isAdmin) return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });

  return new Response(new Uint8Array(doc.data), {
    headers: {
      "Content-Type": doc.contentType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(doc.filename)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

/** Delete a KYC document / logo. Owner only. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customerId = await getSessionCustomerId();
  if (!customerId) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });

  const doc = await db.agencyDocument.findUnique({ where: { id }, select: { customerId: true, kind: true, applicationId: true } });
  if (!doc) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  if (doc.customerId !== customerId) return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });

  await db.agencyDocument.delete({ where: { id } });
  if (doc.kind === "LOGO" && doc.applicationId) {
    await db.agencyApplication.update({ where: { id: doc.applicationId }, data: { agencyLogoUrl: null } }).catch(() => {});
  }
  revalidatePath("/dashboard/kyc");
  revalidatePath("/dashboard");
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
