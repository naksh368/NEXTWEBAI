"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { authorize } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/services/audit-service";
import { transitionBooking } from "@/lib/services/booking-service";
import type { BookingStatus } from "@/lib/constants";

type ActionResult = { ok: true } | { ok: false; error: string };

/** Update a booking's status (state-machine validated) + audit (Phase 24/31). */
export async function updateBookingStatusAction(bookingId: string, toStatus: string, note?: string): Promise<ActionResult> {
  const admin = await authorize("booking.update");
  if (!admin) return { ok: false, error: "You don't have permission to update bookings." };

  const before = await db.booking.findUnique({ where: { id: bookingId }, select: { status: true } });
  if (!before) return { ok: false, error: "Booking not found." };

  const result = await transitionBooking(bookingId, toStatus as BookingStatus, { actor: admin.id, message: note });
  if (!result.ok) return result;

  await writeAudit({ adminUserId: admin.id, action: "booking.status.update", resource: `Booking:${bookingId}`, before, after: { status: toStatus } });
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");
  return { ok: true };
}

/** Set a component (flight/hotel/…) status (Phase 18). */
export async function updateComponentStatusAction(bookingId: string, component: string, status: string): Promise<ActionResult> {
  const admin = await authorize("booking.update");
  if (!admin) return { ok: false, error: "Not authorized." };

  const existing = await db.bookingComponentStatus.findFirst({ where: { bookingId, component } });
  if (!existing) return { ok: false, error: "Component not found." };

  await db.bookingComponentStatus.update({ where: { id: existing.id }, data: { status } });
  await writeAudit({ adminUserId: admin.id, action: "booking.component.update", resource: `Booking:${bookingId}`, before: { component, status: existing.status }, after: { component, status } });
  revalidatePath(`/admin/bookings/${bookingId}`);
  return { ok: true };
}

/** Add an internal timeline note to a booking. */
export async function addBookingNoteAction(bookingId: string, note: string): Promise<ActionResult> {
  const admin = await authorize("booking.update");
  if (!admin) return { ok: false, error: "Not authorized." };
  if (!note.trim()) return { ok: false, error: "Note cannot be empty." };

  const booking = await db.booking.findUnique({ where: { id: bookingId }, select: { status: true } });
  if (!booking) return { ok: false, error: "Booking not found." };

  await db.bookingEvent.create({ data: { bookingId, toStatus: booking.status, actor: admin.id, message: note.trim() } });
  await writeAudit({ adminUserId: admin.id, action: "booking.note.add", resource: `Booking:${bookingId}`, after: { note: note.trim() } });
  revalidatePath(`/admin/bookings/${bookingId}`);
  return { ok: true };
}

/** Change a package's publish status (Phase 7). Publishing needs package.publish. */
export async function setPackageStatusAction(packageId: string, status: string): Promise<ActionResult> {
  const perm = status === "PUBLISHED" ? "package.publish" : "package.edit";
  const admin = await authorize(perm);
  if (!admin) return { ok: false, error: "You don't have permission for this action." };

  const before = await db.package.findUnique({ where: { id: packageId }, select: { status: true } });
  if (!before) return { ok: false, error: "Package not found." };

  await db.package.update({ where: { id: packageId }, data: { status } });
  await writeAudit({ adminUserId: admin.id, action: "package.status.update", resource: `Package:${packageId}`, before, after: { status } });
  revalidatePath("/admin/packages");
  return { ok: true };
}

/** Moderate a customer review (Phase 28). */
export async function moderateReviewAction(reviewId: string, status: "PUBLISHED" | "REJECTED"): Promise<ActionResult> {
  const admin = await authorize("review.moderate");
  if (!admin) return { ok: false, error: "Not authorized." };

  const before = await db.review.findUnique({ where: { id: reviewId }, select: { status: true } });
  if (!before) return { ok: false, error: "Review not found." };

  await db.review.update({ where: { id: reviewId }, data: { status } });
  await writeAudit({ adminUserId: admin.id, action: "review.moderate", resource: `Review:${reviewId}`, before, after: { status } });
  revalidatePath("/admin/reviews");
  return { ok: true };
}

export async function toggleCouponAction(couponId: string, isActive: boolean): Promise<ActionResult> {
  const admin = await authorize("coupon.manage");
  if (!admin) return { ok: false, error: "Not authorized." };
  await db.coupon.update({ where: { id: couponId }, data: { isActive } });
  await writeAudit({ adminUserId: admin.id, action: "coupon.toggle", resource: `Coupon:${couponId}`, after: { isActive } });
  revalidatePath("/admin/coupons");
  return { ok: true };
}

export async function deleteBookingDocumentAction(documentId: string): Promise<ActionResult> {
  const admin = await authorize("booking.update");
  if (!admin) return { ok: false, error: "Not authorized." };
  const doc = await db.document.findUnique({ where: { id: documentId }, select: { id: true, bookingId: true, type: true, title: true, storageKey: true } });
  if (!doc) return { ok: false, error: "Document not found." };
  // Only legacy on-disk documents have a storageKey; DB-stored ones are removed
  // with the row itself.
  if (doc.storageKey) {
    const { deleteDocumentFile } = await import("@/lib/storage");
    await deleteDocumentFile(doc.storageKey).catch(() => {});
  }
  await db.document.delete({ where: { id: documentId } });
  await writeAudit({ adminUserId: admin.id, action: "document.delete", resource: `Booking:${doc.bookingId}`, before: { type: doc.type, title: doc.title } });
  revalidatePath(`/admin/bookings/${doc.bookingId}`);
  return { ok: true };
}

export async function toggleOfferAction(offerId: string, isActive: boolean): Promise<ActionResult> {
  const admin = await authorize("offer.manage");
  if (!admin) return { ok: false, error: "Not authorized." };
  await db.offer.update({ where: { id: offerId }, data: { isActive } });
  await writeAudit({ adminUserId: admin.id, action: "offer.toggle", resource: `Offer:${offerId}`, after: { isActive } });
  revalidatePath("/admin/offers");
  return { ok: true };
}
