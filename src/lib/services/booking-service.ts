import { db } from "@/lib/db";
import { reprice } from "@/lib/services/pricing-service";
import { canTransition } from "@/lib/booking-states";
import { isVersionSellable } from "@/lib/package-availability";
import type { AppEvent, BookingStatus } from "@/lib/constants";
import { emitEvent } from "@/lib/services/notifications";
import { makeReference } from "@/lib/utils";

// Which booking statuses notify the customer, and via which event.
const STATUS_EVENT: Partial<Record<BookingStatus, AppEvent>> = {
  PAYMENT_RECEIVED: "PAYMENT_RECEIVED",
  BOOKING_PROCESSING: "BOOKING_PROCESSING",
  CONFIRMED: "BOOKING_CONFIRMED",
  CANCELLED: "BOOKING_CANCELLED",
  REFUNDED: "REFUND_PROCESSED",
};

/**
 * Booking engine (Phases 15–19).
 *
 * createBooking is the ONLY way a booking is created. It reprices on the server
 * (authoritative), freezes an immutable snapshot of the package + itinerary +
 * selection + pricing (Phase 11), and records line items, travellers, the
 * required component statuses and an opening timeline event — all in one
 * transaction. transitionBooking is the ONLY way status changes, and it always
 * validates against the state machine (Phase 17) and appends a timeline event.
 */

export type CreateBookingInput = {
  customerId: string;
  versionId: string;
  travellerCount: number;
  selectedOptionIds: string[];
  departureId?: string | null;
  travelDate?: string | null; // free-calendar departure date (YYYY-MM-DD)
  couponCode?: string | null;
  travellers: {
    fullName: string; type?: string; dateOfBirth?: string | null; passportNo?: string | null;
    title?: string | null; givenName?: string | null; surname?: string | null;
    passportExpiry?: string | null; passportIssueDate?: string | null;
    passportIssueCity?: string | null; passportIssueCountry?: string | null;
    panNumber?: string | null; mealPreference?: string | null;
  }[];
};

const toDate = (s?: string | null) => (s ? new Date(`${s}T00:00:00`) : null);

export type CreateBookingResult =
  | { ok: true; bookingId: string; reference: string; amount: number }
  | { ok: false; error: string };

export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const version = await db.packageVersion.findUnique({
    where: { id: input.versionId },
    include: {
      package: { select: { id: true, slug: true, name: true, status: true, currentVersionId: true, destination: { select: { name: true, slug: true } } } },
      images: { where: { isCover: true }, take: 1 },
      days: { orderBy: { dayNumber: "asc" }, include: { items: { orderBy: { sortOrder: "asc" } } } },
      options: { where: { isEnabled: true } },
      departures: { where: { isEnabled: true } },
    },
  });
  if (!version || !isVersionSellable({
    isPublished: version.isPublished,
    packageStatus: version.package?.status,
    packageCurrentVersionId: version.package?.currentVersionId,
    versionId: version.id,
  })) return { ok: false, error: "This package is no longer available." };

  // Authoritative server-side reprice — never trust a client total.
  const priced = await reprice({
    versionId: input.versionId,
    travellerCount: input.travellerCount,
    selectedOptionIds: input.selectedOptionIds,
    departureId: input.departureId ?? null,
    couponCode: input.couponCode ?? null,
  });
  if (!priced.ok) return { ok: false, error: priced.error };
  const b = priced.breakdown;

  if (!input.travellers.length) return { ok: false, error: "At least one traveller is required." };

  const selectedOptions = version.options.filter((o) => priced.selectedOptionIds.includes(o.id));
  const departure = version.departures.find((d) => d.id === input.departureId);

  // Which components need real confirmation before CONFIRMED (Phase 18).
  const dayKinds = new Set(version.days.flatMap((d) => d.items.map((i) => i.kind)));
  const optCats = new Set(selectedOptions.map((o) => o.category));
  const components = (["FLIGHT", "HOTEL", "TRANSFER", "ACTIVITY"] as const).filter((c) =>
    c === "HOTEL" ? true : dayKinds.has(c) || optCats.has(c)
  );

  const amounts = {
    baseAmount: b.items.filter((i) => i.kind === "BASE").reduce((s, i) => s + i.amount, 0),
    addonsAmount: b.items.filter((i) => i.kind === "OPTION" || i.kind === "DEPARTURE").reduce((s, i) => s + i.amount, 0),
    discountAmount: b.discount,
    taxAmount: b.tax,
    totalAmount: b.total,
  };

  const snapshot = {
    packageData: {
      slug: version.package.slug, name: version.name, summary: version.summary, overview: version.overview,
      destination: version.package.destination, durationDays: version.durationDays, durationNights: version.durationNights,
      cover: version.images[0]?.url ?? null, basePrice: version.basePrice, currency: version.currency,
      highlights: version.highlights, inclusions: version.inclusions, exclusions: version.exclusions,
      cancellationPolicy: version.cancellationPolicy, importantInfo: version.importantInfo,
    },
    itinerary: version.days.map((d) => ({
      dayNumber: d.dayNumber, title: d.title, summary: d.summary,
      items: d.items.map((it) => ({ timeslot: it.timeslot, kind: it.kind, title: it.title, description: it.description })),
    })),
    selection: {
      travellerCount: b.travellerCount,
      options: selectedOptions.map((o) => ({ category: o.category, label: o.label, priceDelta: o.priceDelta, perPerson: o.perPerson })),
      departure: departure ? { date: departure.date.toISOString(), priceDelta: departure.priceDelta } : null,
      coupon: input.couponCode ?? null,
    },
    pricing: b,
  };

  try {
    const booking = await db.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          reference: makeReference(),
          customerId: input.customerId,
          packageId: version.package.id,
          packageVersionId: version.id,
          status: "PAYMENT_PENDING",
          travelDate: input.travelDate ? new Date(`${input.travelDate}T00:00:00`) : (departure?.date ?? null),
          travellerCount: b.travellerCount,
          currency: b.currency,
          couponCode: input.couponCode ?? null,
          ...amounts,
          items: {
            create: b.items.map((it, idx) => ({ kind: it.kind, label: it.label, amount: it.amount, sortOrder: idx })),
          },
          travellers: {
            create: input.travellers.map((t) => ({
              fullName: t.fullName, type: t.type ?? "ADULT",
              dateOfBirth: toDate(t.dateOfBirth), passportNo: t.passportNo ?? null,
              title: t.title ?? null, givenName: t.givenName ?? null, surname: t.surname ?? null,
              passportExpiry: toDate(t.passportExpiry), passportIssueDate: toDate(t.passportIssueDate),
              passportIssueCity: t.passportIssueCity ?? null, passportIssueCountry: t.passportIssueCountry ?? null,
              panNumber: t.panNumber ?? null, mealPreference: t.mealPreference ?? "VEG",
            })),
          },
          componentStatuses: { create: components.map((c) => ({ component: c, status: "PENDING" })) },
          snapshot: { create: snapshot },
          events: { create: { toStatus: "PAYMENT_PENDING", actor: "customer", message: "Booking created, awaiting payment." } },
        },
      });
      return created;
    });

    // "Booking received" email (idempotent, non-blocking).
    await emitEvent({ event: "BOOKING_CREATED", bookingId: booking.id, dedupeKey: `BOOKING_CREATED:${booking.id}` });

    return { ok: true, bookingId: booking.id, reference: booking.reference, amount: booking.totalAmount };
  } catch {
    return { ok: false, error: "We couldn't create your booking. Please try again." };
  }
}

export async function transitionBooking(
  bookingId: string,
  toStatus: BookingStatus,
  opts: { actor?: string; message?: string } = {}
): Promise<{ ok: true } | { ok: false; error: string }> {
  const booking = await db.booking.findUnique({ where: { id: bookingId }, select: { status: true } });
  if (!booking) return { ok: false, error: "Booking not found." };
  const from = booking.status as BookingStatus;
  if (from === toStatus) return { ok: true };
  if (!canTransition(from, toStatus)) {
    return { ok: false, error: `Illegal transition ${from} → ${toStatus}.` };
  }
  await db.$transaction([
    db.booking.update({ where: { id: bookingId }, data: { status: toStatus } }),
    db.bookingEvent.create({ data: { bookingId, fromStatus: from, toStatus, actor: opts.actor ?? "system", message: opts.message } }),
  ]);

  // Fan out a customer notification for meaningful transitions (idempotent).
  // A notification failure must NEVER halt the state machine — the status change
  // is already committed above; only the side-effect is best-effort.
  const event = STATUS_EVENT[toStatus];
  if (event) {
    try {
      await emitEvent({ event, bookingId, dedupeKey: `${event}:${bookingId}` });
    } catch (e) {
      console.error(`[booking] notification for ${toStatus} failed (non-blocking):`, e);
    }
  }

  return { ok: true };
}

/**
 * After a verified payment: walk the legal path PAYMENT_PENDING → PAYMENT_PROCESSING
 * → PAYMENT_RECEIVED → BOOKING_PROCESSING, adding a timeline event at each step.
 *
 * Idempotent: safe to call from BOTH the client callback and the Razorpay
 * webhook. If the booking is already at/after PAYMENT_RECEIVED it does nothing,
 * so duplicate/late webhook deliveries never double-process or duplicate events.
 */
const POST_PAYMENT_STATUSES = new Set<BookingStatus>([
  "PAYMENT_RECEIVED", "BOOKING_PROCESSING", "SUPPLIER_CONFIRMATION_PENDING", "CONFIRMED", "COMPLETED",
]);

export async function markPaymentReceivedAndProcess(bookingId: string, actor = "system") {
  const b = await db.booking.findUnique({ where: { id: bookingId }, select: { status: true } });
  if (!b) return;
  const status = b.status as BookingStatus;
  if (POST_PAYMENT_STATUSES.has(status)) return; // already processed — idempotent no-op

  // From PAYMENT_PENDING (or FAILED→PENDING retry) we must pass through PROCESSING.
  if (status === "PAYMENT_PENDING") {
    await transitionBooking(bookingId, "PAYMENT_PROCESSING", { actor, message: "Payment received — verifying." });
  }
  await transitionBooking(bookingId, "PAYMENT_RECEIVED", { actor, message: "Payment verified." });
  await transitionBooking(bookingId, "BOOKING_PROCESSING", { actor, message: "Securing your travel components." });
}
