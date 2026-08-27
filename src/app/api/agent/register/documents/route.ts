import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAgentSessionId } from "@/lib/agent-session";
import { validateUpload } from "@/lib/agent-schemas";
import { LOGO_DOC } from "@/lib/agent-constants";

/** List the signed-in agent's uploaded documents (metadata only). */
export async function GET() {
  const id = await getAgentSessionId();
  if (!id) return NextResponse.json({ error: "Session expired." }, { status: 401 });
  const docs = await db.agencyDocument.findMany({
    where: { agentId: id },
    select: { id: true, type: true, title: true, filename: true, contentType: true, size: true, status: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ documents: docs });
}

/** Upload one document/logo. Replaces any existing document of the same type. */
export async function POST(req: Request) {
  const id = await getAgentSessionId();
  if (!id) return NextResponse.json({ error: "Session expired. Please start again." }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const type = String(form?.get("type") ?? "").trim();
  const title = String(form?.get("title") ?? type);
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided." }, { status: 400 });
  if (!type) return NextResponse.json({ error: "Missing document type." }, { status: 400 });

  const kind = type === "LOGO" ? "LOGO" : "DOC";
  const check = validateUpload({ name: file.name, type: file.type, size: file.size }, kind);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());

  // Replace an existing doc of the same type (one current file per slot).
  const prior = await db.agencyDocument.findFirst({ where: { agentId: id, type } });
  const doc = prior
    ? await db.agencyDocument.update({
        where: { id: prior.id },
        data: { title, filename: file.name, contentType: file.type, size: bytes.length, data: bytes, status: "PENDING", reviewNote: null },
      })
    : await db.agencyDocument.create({
        data: { agentId: id, type, title: title || (type === "LOGO" ? LOGO_DOC.label : type), filename: file.name, contentType: file.type, size: bytes.length, data: bytes },
      });

  if (type === "LOGO") {
    await db.agencyProfile.updateMany({ where: { agentId: id }, data: { logoDocumentId: doc.id } });
  }

  return NextResponse.json({ ok: true, document: { id: doc.id, type: doc.type, title: doc.title, filename: doc.filename, contentType: doc.contentType, size: doc.size, status: doc.status } });
}
