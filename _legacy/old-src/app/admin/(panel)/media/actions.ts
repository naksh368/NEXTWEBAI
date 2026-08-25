"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { authorize } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/services/audit-service";

type R = { ok: true } | { ok: false; error: string };

/** Permanently delete a media asset. */
export async function deleteMediaAction(id: string): Promise<R> {
  const admin = await authorize("package.edit");
  if (!admin) return { ok: false, error: "Not authorized." };
  const asset = await db.mediaAsset.findUnique({ where: { id }, select: { filename: true } });
  if (!asset) return { ok: false, error: "Asset not found." };
  await db.mediaAsset.delete({ where: { id } });
  await writeAudit({ adminUserId: admin.id, action: "media.delete", resource: `MediaAsset:${id}`, before: { filename: asset.filename } });
  revalidatePath("/admin/media");
  return { ok: true };
}
