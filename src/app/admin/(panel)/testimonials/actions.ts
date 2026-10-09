"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { authorize } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/services/audit-service";

/**
 * Testimonial management.
 *
 * A testimonial is entered by staff from a message the agency actually
 * received, and stays invisible until it is explicitly PUBLISHED — the public
 * site never renders a PENDING or REJECTED row, and the section hides itself
 * entirely when nothing is published.
 */

type Result = { ok: true; message?: string } | { ok: false; error: string };

export const TESTIMONIAL_STATUSES = ["PENDING", "PUBLISHED", "REJECTED"] as const;

const schema = z.object({
  displayName: z.string().min(2, "Please enter the traveller's name as it should appear.").max(120),
  location: z.string().max(120).optional().transform((v) => v?.trim() || null),
  body: z.string().min(10, "The testimonial text is too short.").max(2000),
  rating: z
    .union([z.coerce.number().int().min(1).max(5), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : Number(v))),
  photoUrl: z.string().max(2000).optional().transform((v) => v?.trim() || null),
  packageName: z.string().max(200).optional().transform((v) => v?.trim() || null),
  reviewDate: z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return null;
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? null : d;
    }),
  status: z.enum(TESTIMONIAL_STATUSES),
  sortOrder: z.coerce.number().int().min(0).max(9999),
});

function readForm(formData: FormData) {
  return schema.safeParse({
    displayName: String(formData.get("displayName") ?? "").trim(),
    location: String(formData.get("location") ?? ""),
    body: String(formData.get("body") ?? "").trim(),
    rating: String(formData.get("rating") ?? ""),
    photoUrl: String(formData.get("photoUrl") ?? ""),
    packageName: String(formData.get("packageName") ?? ""),
    reviewDate: String(formData.get("reviewDate") ?? ""),
    status: String(formData.get("status") ?? "PENDING"),
    sortOrder: formData.get("sortOrder") ?? 0,
  });
}

function refresh() {
  revalidateTag("testimonials");
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
}

export async function createTestimonialAction(formData: FormData): Promise<Result> {
  const admin = await authorize("testimonial.manage");
  if (!admin) return { ok: false, error: "You do not have permission to manage testimonials." };

  const parsed = readForm(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const row = await db.testimonial.create({ data: { ...parsed.data, createdById: admin.id } });
  await writeAudit({ adminUserId: admin.id, action: "testimonial.create", resource: `Testimonial:${row.id}`, after: parsed.data });
  refresh();
  return { ok: true, message: parsed.data.status === "PUBLISHED" ? "Testimonial added and published." : "Testimonial saved as a draft." };
}

export async function updateTestimonialAction(id: string, formData: FormData): Promise<Result> {
  const admin = await authorize("testimonial.manage");
  if (!admin) return { ok: false, error: "You do not have permission to manage testimonials." };

  const before = await db.testimonial.findUnique({ where: { id } });
  if (!before) return { ok: false, error: "That testimonial no longer exists." };

  const parsed = readForm(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };

  await db.testimonial.update({ where: { id }, data: parsed.data });
  await writeAudit({ adminUserId: admin.id, action: "testimonial.update", resource: `Testimonial:${id}`, before, after: parsed.data });
  refresh();
  return { ok: true, message: "Testimonial updated." };
}

/** Move a testimonial between PENDING / PUBLISHED / REJECTED. */
export async function setTestimonialStatusAction(id: string, status: (typeof TESTIMONIAL_STATUSES)[number]): Promise<Result> {
  const admin = await authorize("testimonial.manage");
  if (!admin) return { ok: false, error: "You do not have permission to manage testimonials." };
  if (!TESTIMONIAL_STATUSES.includes(status)) return { ok: false, error: "Unknown status." };

  const before = await db.testimonial.findUnique({ where: { id }, select: { status: true } });
  if (!before) return { ok: false, error: "That testimonial no longer exists." };

  await db.testimonial.update({ where: { id }, data: { status } });
  await writeAudit({ adminUserId: admin.id, action: "testimonial.status", resource: `Testimonial:${id}`, before, after: { status } });
  refresh();
  return {
    ok: true,
    message:
      status === "PUBLISHED" ? "Published — it is live on the homepage."
      : status === "REJECTED" ? "Rejected — it will not appear publicly."
      : "Moved back to pending.",
  };
}

export async function deleteTestimonialAction(id: string): Promise<Result> {
  const admin = await authorize("testimonial.manage");
  if (!admin) return { ok: false, error: "You do not have permission to manage testimonials." };

  const before = await db.testimonial.findUnique({ where: { id } });
  if (!before) return { ok: false, error: "That testimonial no longer exists." };

  await db.testimonial.delete({ where: { id } });
  await writeAudit({ adminUserId: admin.id, action: "testimonial.delete", resource: `Testimonial:${id}`, before });
  refresh();
  return { ok: true, message: "Testimonial deleted." };
}
