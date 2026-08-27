import { db } from "@/lib/db";
import { REQUIRED_KYC_KINDS } from "@/lib/agency";

/** Allowed upload types (spec §19 logo + §18 documents). */
export const ALLOWED_UPLOAD_MIME: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
export const LOGO_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB

export type KycDoc = { id: string; kind: string; filename: string; contentType: string; status: string; createdAt: Date };

export type KycState = {
  docs: KycDoc[];
  logoId: string | null;
  requiredTotal: number;
  requiredDone: number;
  complete: boolean;
};

/** Everything the dashboard/admin needs to render KYC progress for one agent. */
export async function getKycState(customerId: string): Promise<KycState> {
  const rows = await db.agencyDocument.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    select: { id: true, kind: true, filename: true, contentType: true, status: true, createdAt: true },
  });
  const logo = rows.find((r) => r.kind === "LOGO") ?? null;
  const docs = rows.filter((r) => r.kind !== "LOGO");
  const presentKinds = new Set(docs.map((d) => d.kind));
  const requiredDone = REQUIRED_KYC_KINDS.filter((k) => presentKinds.has(k)).length;
  return {
    docs,
    logoId: logo?.id ?? null,
    requiredTotal: REQUIRED_KYC_KINDS.length,
    requiredDone,
    complete: requiredDone === REQUIRED_KYC_KINDS.length,
  };
}
