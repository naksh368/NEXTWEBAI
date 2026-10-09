"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authorize } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/services/audit-service";
import { ENQUIRY_STATUS_ALL } from "@/lib/constants";

type Result = { ok: true; message?: string } | { ok: false; error: string };

const schema = z.object({
  id: z.string().min(1),
  status: z.string().refine((s) => !s || ENQUIRY_STATUS_ALL.includes(s), "Unknown status."),
  assignedToId: z.string(),
  followUpAt: z.string(),
  internalNotes: z.string().max(5000),
});

/**
 * Update a lead's status, owner, follow-up date and internal notes.
 *
 * Internal notes are staff-only: they are never rendered on a public page and
 * never included in any message sent to the customer.
 */
export async function updateEnquiryStatus(formData: FormData): Promise<Result> {
  const admin = await authorize("enquiry.manage");
  if (!admin) return { ok: false, error: "You do not have permission to manage enquiries." };

  const parsed = schema.safeParse({
    id: String(formData.get("id") ?? ""),
    status: String(formData.get("status") ?? ""),
    assignedToId: String(formData.get("assignedToId") ?? ""),
    followUpAt: String(formData.get("followUpAt") ?? ""),
    internalNotes: String(formData.get("internalNotes") ?? ""),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const { id, status, assignedToId, followUpAt, internalNotes } = parsed.data;
  const before = await db.enquiry.findUnique({
    where: { id },
    select: { status: true, assignedToId: true, followUpAt: true, firstRespondedAt: true },
  });
  if (!before) return { ok: false, error: "That enquiry no longer exists." };

  const data: {
    status?: string;
    assignedToId: string | null;
    followUpAt: Date | null;
    internalNotes: string | null;
    firstRespondedAt?: Date;
  } = {
    assignedToId: assignedToId || null,
    followUpAt: followUpAt ? new Date(`${followUpAt}T00:00:00`) : null,
    internalNotes: internalNotes.trim() || null,
  };
  if (status) data.status = status;

  // Record the first-response time the first time a lead leaves NEW.
  if (status && status !== "NEW" && !before.firstRespondedAt) {
    data.firstRespondedAt = new Date();
  }

  await db.enquiry.update({ where: { id }, data });
  await writeAudit({
    adminUserId: admin.id,
    action: "enquiry.update",
    resource: `Enquiry:${id}`,
    before,
    // The note body itself is not copied into the audit trail — only that it changed.
    after: { status: data.status, assignedToId: data.assignedToId, followUpAt: data.followUpAt, notesChanged: true },
  });

  revalidatePath("/admin/enquiries");
  revalidatePath("/admin");
  return { ok: true, message: "Enquiry updated." };
}
