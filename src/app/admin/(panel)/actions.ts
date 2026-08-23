"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { authorize } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/services/audit-service";
import { transitionBooking } from "@/lib/services/booking-service";
import { resendEventEmail } from "@/lib/services/notifications";
import type { AppEvent, BookingStatus } from "@/lib/constants";

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

/** Assign (or unassign) a travel specialist to a booking. */
export async function assignBookingAction(bookingId: string, adminUserId: string): Promise<ActionResult> {
  const admin = await authorize("booking.update");
  if (!admin) return { ok: false, error: "Not authorized." };

  const booking = await db.booking.findUnique({ where: { id: bookingId }, select: { assignedToId: true, status: true } });
  if (!booking) return { ok: false, error: "Booking not found." };

  let assignedToId: string | null = null;
  let assignedName = "Unassigned";
  if (adminUserId) {
    const staff = await db.adminUser.findUnique({ where: { id: adminUserId }, select: { id: true, fullName: true } });
    if (!staff) return { ok: false, error: "That staff member no longer exists." };
    assignedToId = staff.id;
    assignedName = staff.fullName;
  }

  await db.booking.update({ where: { id: bookingId }, data: { assignedToId } });
  await db.bookingEvent.create({ data: { bookingId, toStatus: booking.status, actor: admin.id, message: `Assigned to ${assignedName}.` } });
  await writeAudit({ adminUserId: admin.id, action: "booking.assign", resource: `Booking:${bookingId}`, before: { assignedToId: booking.assignedToId }, after: { assignedToId } });
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");
  return { ok: true };
}

/** Retry sending a booking email that previously failed. */
export async function resendBookingEmailAction(bookingId: string, event: string): Promise<ActionResult> {
  const admin = await authorize("booking.update");
  if (!admin) return { ok: false, error: "Not authorized." };
  const r = await resendEventEmail(event as AppEvent, bookingId);
  if (!r.ok) return { ok: false, error: r.error ?? "Could not resend the email." };
  await writeAudit({ adminUserId: admin.id, action: "booking.email.resend", resource: `Booking:${bookingId}`, after: { event } });
  revalidatePath(`/admin/bookings/${bookingId}`);
  return { ok: true };
}

/** Set the internal supplier cost on a booking (finance only). */
export async function setSupplierCostAction(bookingId: string, cost: number | null): Promise<ActionResult> {
  const admin = await authorize("payment.view");
  if (!admin) return { ok: false, error: "You don't have permission to edit financials." };

  const value = cost == null || Number.isNaN(cost) ? null : Math.max(0, Math.round(cost));
  await db.booking.update({ where: { id: bookingId }, data: { supplierCost: value } });
  await writeAudit({ adminUserId: admin.id, action: "booking.supplierCost.set", resource: `Booking:${bookingId}`, after: { supplierCost: value } });
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

/** Feature / unfeature a package on the homepage. */
export async function toggleFeaturedAction(packageId: string, isFeatured: boolean): Promise<ActionResult> {
  const admin = await authorize("package.edit");
  if (!admin) return { ok: false, error: "Not authorized." };
  await db.package.update({ where: { id: packageId }, data: { isFeatured } });
  await writeAudit({ adminUserId: admin.id, action: "package.feature", resource: `Package:${packageId}`, after: { isFeatured } });
  revalidatePath("/admin/packages");
  revalidatePath("/");
  return { ok: true };
}

/** Schedule a package to auto-publish at a future time (or clear the schedule). */
export async function schedulePublishAction(packageId: string, whenISO: string | null): Promise<ActionResult> {
  const admin = await authorize("package.publish");
  if (!admin) return { ok: false, error: "You don't have permission to publish packages." };

  const pkg = await db.package.findUnique({ where: { id: packageId }, select: { status: true } });
  if (!pkg) return { ok: false, error: "Package not found." };

  let publishAt: Date | null = null;
  if (whenISO) {
    const d = new Date(whenISO);
    if (Number.isNaN(d.getTime())) return { ok: false, error: "That date/time isn't valid." };
    if (d.getTime() <= Date.now()) return { ok: false, error: "Pick a time in the future." };
    if (pkg.status === "PUBLISHED") return { ok: false, error: "This package is already published — no need to schedule it." };
    publishAt = d;
  }

  await db.package.update({ where: { id: packageId }, data: { publishAt } });
  await writeAudit({ adminUserId: admin.id, action: "package.schedule", resource: `Package:${packageId}`, after: { publishAt: publishAt?.toISOString() ?? null } });
  revalidatePath("/admin/packages");
  return { ok: true };
}

/** Manually publish any packages whose scheduled time has passed. */
export async function runDuePublishAction(): Promise<ActionResult & { published?: number }> {
  const admin = await authorize("package.publish");
  if (!admin) return { ok: false, error: "You don't have permission to publish packages." };
  const { publishDuePackages } = await import("@/lib/services/scheduler");
  const published = await publishDuePackages();
  if (published > 0) await writeAudit({ adminUserId: admin.id, action: "package.schedule.run", resource: "Package", after: { published } });
  return { ok: true, published };
}

/** Mark / unmark a package as "ExpertzTrip Checked" (team-reviewed). */
export async function toggleCheckedAction(packageId: string, isChecked: boolean): Promise<ActionResult> {
  const admin = await authorize("package.edit");
  if (!admin) return { ok: false, error: "Not authorized." };
  await db.package.update({ where: { id: packageId }, data: { isChecked } });
  await writeAudit({ adminUserId: admin.id, action: "package.checked", resource: `Package:${packageId}`, after: { isChecked } });
  revalidatePath("/admin/packages");
  return { ok: true };
}

/** Mark / unmark a destination as popular (shown in the popular-destinations rail). */
export async function toggleDestinationPopularAction(destinationId: string, isPopular: boolean): Promise<ActionResult> {
  const admin = await authorize("destination.manage");
  if (!admin) return { ok: false, error: "Not authorized." };
  await db.destination.update({ where: { id: destinationId }, data: { isPopular } });
  await writeAudit({ adminUserId: admin.id, action: "destination.popular", resource: `Destination:${destinationId}`, after: { isPopular } });
  revalidatePath("/admin/destinations");
  revalidatePath("/");
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
