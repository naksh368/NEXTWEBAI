"use server";

import { revalidatePath } from "next/cache";
import { authorize } from "@/lib/admin-auth";
import { db } from "@/lib/db";

const STATUSES = ["NEW", "CONTACTED", "QUOTED", "CONVERTED", "CLOSED"];

export async function updateEnquiryStatus(formData: FormData) {
  const admin = await authorize("customer.view");
  if (!admin) return;

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !STATUSES.includes(status)) return;

  await db.enquiry.update({ where: { id }, data: { status } });
  revalidatePath("/admin/enquiries");
}
