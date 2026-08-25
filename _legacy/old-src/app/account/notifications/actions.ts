"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/auth";

/** Mark all of the signed-in customer's notifications as read. */
export async function markAllNotificationsRead() {
  const customer = await getCurrentCustomer();
  if (!customer) return;
  await db.notification.updateMany({ where: { customerId: customer.id, isRead: false }, data: { isRead: true } });
  revalidatePath("/account/notifications");
  revalidatePath("/account");
}
