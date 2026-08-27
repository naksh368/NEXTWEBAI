import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAgentSessionId } from "@/lib/agent-session";
import { getAdminSessionId } from "@/lib/admin-session";

/**
 * Access-controlled document delivery. Only the owning agent OR a signed-in
 * admin may fetch a KYC document/logo. Never a public URL (spec §35).
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const doc = await db.agencyDocument.findUnique({ where: { id } });
  if (!doc) return new NextResponse("Not found", { status: 404 });

  const agentId = await getAgentSessionId();
  const adminId = await getAdminSessionId();
  const isOwner = agentId && agentId === doc.agentId;
  const isAdmin = Boolean(adminId);
  if (!isOwner && !isAdmin) return new NextResponse("Forbidden", { status: 403 });

  return new NextResponse(new Uint8Array(doc.data), {
    headers: {
      "Content-Type": doc.contentType,
      "Content-Disposition": `inline; filename="${doc.filename.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

/** Owner may delete a not-yet-submitted document (e.g. re-upload during KYC). */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const agentId = await getAgentSessionId();
  if (!agentId) return NextResponse.json({ error: "Session expired." }, { status: 401 });
  const doc = await db.agencyDocument.findUnique({ where: { id } });
  if (!doc || doc.agentId !== agentId) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (doc.type === "LOGO") {
    await db.agencyProfile.updateMany({ where: { agentId, logoDocumentId: id }, data: { logoDocumentId: null } });
  }
  await db.agencyDocument.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
