"use server";

import { revalidatePath } from "next/cache";
import { authorize } from "@/lib/admin-auth";
import { db } from "@/lib/db";

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "QUOTE_SENT", "FOLLOW_UP", "NEGOTIATION", "WON", "LOST"];

export async function updateEnquiryStatus(formData: FormData) {
  const admin = await authorize("customer.view");
  if (!admin) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const status = String(formData.get("status") ?? "");
  const assignedToId = String(formData.get("assignedToId") ?? "");
  const followUp = String(formData.get("followUpAt") ?? "");

  const data: { status?: string; assignedToId?: string | null; followUpAt?: Date | null; firstRespondedAt?: Date } = {
    assignedToId: assignedToId || null,
    followUpAt: followUp ? new Date(`${followUp}T00:00:00`) : null,
  };
  if (STATUSES.includes(status)) data.status = status;

  // Record first response time the first time a lead leaves NEW.
  if (STATUSES.includes(status) && status !== "NEW") {
    const current = await db.enquiry.findUnique({ where: { id }, select: { firstRespondedAt: true } });
    if (current && !current.firstRespondedAt) data.firstRespondedAt = new Date();
  }

  await db.enquiry.update({ where: { id }, data });
  revalidatePath("/admin/enquiries");
}
