"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { authorize } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/services/audit-service";
import { GALLERY_CATEGORIES } from "@/lib/queries";

/**
 * Gallery management. Every action re-checks the caller's permission on the
 * SERVER — hiding a button in the UI is never the only defence.
 */

type Result = { ok: true; message?: string } | { ok: false; error: string };

const CATEGORY_KEYS = GALLERY_CATEGORIES.map((c) => c.key) as [string, ...string[]];

const itemSchema = z.object({
  url: z.string().min(1, "An image is required.").max(2000),
  alt: z.string().min(3, "Alt text describes the photo for screen readers — please add it.").max(300),
  caption: z.string().max(300).optional().transform((v) => v?.trim() || null),
  location: z.string().max(160).optional().transform((v) => v?.trim() || null),
  category: z.enum(CATEGORY_KEYS),
  isPublished: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
});

function readForm(formData: FormData) {
  return itemSchema.safeParse({
    url: String(formData.get("url") ?? "").trim(),
    alt: String(formData.get("alt") ?? "").trim(),
    caption: String(formData.get("caption") ?? ""),
    location: String(formData.get("location") ?? ""),
    category: String(formData.get("category") ?? "BEACHES"),
    isPublished: formData.get("isPublished") === "on" || formData.get("isPublished") === "true",
    sortOrder: formData.get("sortOrder") ?? 0,
  });
}

/** Refresh every surface that reads the gallery. */
function refresh() {
  revalidateTag("gallery");
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  revalidatePath("/");
}

export async function createGalleryItemAction(formData: FormData): Promise<Result> {
  const admin = await authorize("gallery.manage");
  if (!admin) return { ok: false, error: "You do not have permission to manage the gallery." };

  const parsed = readForm(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const item = await db.galleryItem.create({ data: { ...parsed.data, createdById: admin.id } });
  await writeAudit({ adminUserId: admin.id, action: "gallery.create", resource: `GalleryItem:${item.id}`, after: parsed.data });
  refresh();
  return { ok: true, message: "Photograph added." };
}

export async function updateGalleryItemAction(id: string, formData: FormData): Promise<Result> {
  const admin = await authorize("gallery.manage");
  if (!admin) return { ok: false, error: "You do not have permission to manage the gallery." };

  const before = await db.galleryItem.findUnique({ where: { id } });
  if (!before) return { ok: false, error: "That photograph no longer exists." };

  const parsed = readForm(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };

  await db.galleryItem.update({ where: { id }, data: parsed.data });
  await writeAudit({ adminUserId: admin.id, action: "gallery.update", resource: `GalleryItem:${id}`, before, after: parsed.data });
  refresh();
  return { ok: true, message: "Photograph updated." };
}

/** Show/hide without deleting — the fastest way to pull an image off the site. */
export async function toggleGalleryItemAction(id: string): Promise<Result> {
  const admin = await authorize("gallery.manage");
  if (!admin) return { ok: false, error: "You do not have permission to manage the gallery." };

  const item = await db.galleryItem.findUnique({ where: { id }, select: { isPublished: true } });
  if (!item) return { ok: false, error: "That photograph no longer exists." };

  await db.galleryItem.update({ where: { id }, data: { isPublished: !item.isPublished } });
  await writeAudit({
    adminUserId: admin.id,
    action: item.isPublished ? "gallery.unpublish" : "gallery.publish",
    resource: `GalleryItem:${id}`,
  });
  refresh();
  return { ok: true, message: item.isPublished ? "Photograph hidden." : "Photograph published." };
}

/** Move one position up or down within the published order. */
export async function reorderGalleryItemAction(id: string, direction: "up" | "down"): Promise<Result> {
  const admin = await authorize("gallery.manage");
  if (!admin) return { ok: false, error: "You do not have permission to manage the gallery." };

  const all = await db.galleryItem.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], select: { id: true } });
  const index = all.findIndex((i) => i.id === id);
  if (index < 0) return { ok: false, error: "That photograph no longer exists." };

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= all.length) return { ok: true }; // already at the end

  // Renumber the whole list so the order is always dense and unambiguous.
  const reordered = [...all];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  await db.$transaction(reordered.map((row, i) => db.galleryItem.update({ where: { id: row.id }, data: { sortOrder: i } })));

  await writeAudit({ adminUserId: admin.id, action: "gallery.reorder", resource: `GalleryItem:${id}`, after: { direction } });
  refresh();
  return { ok: true };
}

export async function deleteGalleryItemAction(id: string): Promise<Result> {
  const admin = await authorize("gallery.manage");
  if (!admin) return { ok: false, error: "You do not have permission to manage the gallery." };

  const before = await db.galleryItem.findUnique({ where: { id } });
  if (!before) return { ok: false, error: "That photograph no longer exists." };

  await db.galleryItem.delete({ where: { id } });
  await writeAudit({ adminUserId: admin.id, action: "gallery.delete", resource: `GalleryItem:${id}`, before });
  refresh();
  return { ok: true, message: "Photograph removed from the gallery." };
}
