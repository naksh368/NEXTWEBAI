"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/auth";

type Result = { ok: true } | { ok: false; error: string };

/** Submit a review for a completed trip (goes to moderation, never auto-published). */
export async function submitReviewAction(bookingId: string, rating: number, title: string, body: string): Promise<Result> {
  const customer = await getCurrentCustomer();
  if (!customer) return { ok: false, error: "Please sign in." };

  const booking = await db.booking.findFirst({
    where: { id: bookingId, customerId: customer.id },
    select: { packageId: true, status: true },
  });
  if (!booking) return { ok: false, error: "Booking not found." };
  if (booking.status !== "COMPLETED") return { ok: false, error: "You can review a trip once it's completed." };

  const r = Math.round(rating);
  if (r < 1 || r > 5) return { ok: false, error: "Please choose a rating from 1 to 5." };

  const existing = await db.review.findFirst({ where: { customerId: customer.id, packageId: booking.packageId }, select: { id: true } });
  if (existing) return { ok: false, error: "You've already reviewed this holiday — thank you!" };

  await db.review.create({
    data: {
      customerId: customer.id,
      packageId: booking.packageId,
      rating: r,
      title: title.trim().slice(0, 120) || null,
      body: body.trim().slice(0, 2000) || null,
      status: "PENDING",
    },
  });

  revalidatePath(`/account/trips/${bookingId}`);
  return { ok: true };
}
