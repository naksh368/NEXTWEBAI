import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSessionCustomerId } from "@/lib/session";
import { KYC_DOC_KINDS } from "@/lib/agency";
import { ALLOWED_UPLOAD_MIME, LOGO_MIME, MAX_UPLOAD_BYTES } from "@/lib/services/kyc-service";

export const runtime = "nodejs";

const SINGLE_INSTANCE = new Set<string>([...KYC_DOC_KINDS.filter((k) => k !== "OTHER"), "LOGO"]);

export async function POST(request: Request) {
  const customerId = await getSessionCustomerId();
  if (!customerId) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid upload." }, { status: 400 });
  }

  const kind = String(form.get("kind") ?? "");
  const isLogo = kind === "LOGO";
  if (!isLogo && !(KYC_DOC_KINDS as readonly string[]).includes(kind)) {
    return NextResponse.json({ ok: false, error: "Unknown document type." }, { status: 422 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "Choose a file to upload." }, { status: 422 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ ok: false, error: `File is too large (max ${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)} MB).` }, { status: 413 });
  }
  const contentType = file.type || "application/octet-stream";
  const allowed = isLogo ? LOGO_MIME.has(contentType) : Boolean(ALLOWED_UPLOAD_MIME[contentType]);
  if (!allowed) {
    return NextResponse.json({ ok: false, error: isLogo ? "Logo must be a PNG, JPG or WEBP image." : "Upload a PDF, JPG, PNG or WEBP file." }, { status: 415 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const application = await db.agencyApplication.findFirst({ where: { customerId }, orderBy: { createdAt: "desc" }, select: { id: true } });

  // Replace the previous file for single-instance kinds (and the logo).
  if (SINGLE_INSTANCE.has(kind)) {
    await db.agencyDocument.deleteMany({ where: { customerId, kind } });
  }

  const doc = await db.agencyDocument.create({
    data: {
      customerId,
      applicationId: application?.id ?? null,
      kind,
      filename: file.name.slice(0, 200) || `${kind.toLowerCase()}`,
      contentType,
      size: bytes.length,
      data: bytes,
    },
    select: { id: true },
  });

  // The logo is referenced from the application so the portal can show it.
  if (isLogo && application) {
    await db.agencyApplication.update({ where: { id: application.id }, data: { agencyLogoUrl: `/api/agent/kyc/${doc.id}` } }).catch(() => {});
  }

  revalidatePath("/dashboard/kyc");
  revalidatePath("/dashboard");
  return NextResponse.json({ ok: true, id: doc.id }, { headers: { "Cache-Control": "no-store" } });
}
