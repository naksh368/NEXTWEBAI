import { db } from "@/lib/db";
import { sendEmail, emailLayout, businessNotifyEmail, type EmailAttachment } from "@/lib/services/email";
import { sendTransactionalSms } from "@/lib/services/sms";
import type { AppEvent } from "@/lib/constants";
import { getSiteUrl, formatINR, formatDate } from "@/lib/utils";

// Events that also alert the company's business inbox (separate from the customer).
const ADMIN_ALERT_EVENTS = new Set<AppEvent>(["BOOKING_CREATED", "PAYMENT_RECEIVED"]);

/**
 * Central notification / event service (Phase 20, spec §18).
 *
 * `emitEvent` is the single entry point for customer communication. Every call
 * originates from a real database state change (registration, verified payment,
 * a published document, a confirmed booking …) and fans out to:
 *   • an in-app notification (the notification center),
 *   • a transactional email (per policy),
 *   • an MSG91 transactional SMS (per policy).
 *
 * Guarantees:
 *   • Idempotent — one in-app record per `dedupeKey`; a duplicate emit is a
 *     no-op, so booking/payment retries never double-message a customer.
 *   • Honest — email/SMS outcomes are recorded in MessageLog with the real
 *     provider status (QUEUED/SENT/FAILED/SKIPPED). Nothing is faked.
 *   • Non-blocking — never throws; a channel failure never breaks the caller.
 */

const siteUrl = () => getSiteUrl();

export type EmitInput = {
  event: AppEvent;
  customerId?: string;
  bookingId?: string;
  /** Stable key that makes this event unique, e.g. `BOOKING_CONFIRMED:<bookingId>`. */
  dedupeKey: string;
  /** Extra template variables (documentType, title, amount …). */
  data?: Record<string, string>;
  /** Optional file attachments (e.g. the uploaded ticket PDF). */
  attachments?: EmailAttachment[];
};

type Ctx = {
  customerId: string | null;
  email: string | null;
  mobile: string | null;
  firstName: string;
  bookingId: string | null;
  reference: string | null;
  packageName: string | null;
  destination: string | null;
  tripHref: string;
};

type Content = {
  title: string;
  body: string;
  href: string;
  email?: { subject: string; heading: string; bodyHtml: string; cta?: { label: string; href: string } };
  sms?: string;
};

function firstNameOf(name?: string | null): string {
  return (name || "traveller").split(" ")[0];
}

async function resolveContext(input: EmitInput): Promise<Ctx | null> {
  if (input.bookingId) {
    const b = await db.booking.findUnique({
      where: { id: input.bookingId },
      select: {
        id: true, reference: true,
        customer: { select: { id: true, email: true, mobile: true, fullName: true } },
        package: { select: { name: true, destination: { select: { name: true } } } },
      },
    });
    if (!b) return null;
    return {
      customerId: b.customer.id,
      email: b.customer.email,
      mobile: b.customer.mobile,
      firstName: firstNameOf(b.customer.fullName),
      bookingId: b.id,
      reference: b.reference,
      packageName: b.package.name,
      destination: b.package.destination.name,
      tripHref: `/account/trips/${b.id}`,
    };
  }
  if (input.customerId) {
    const c = await db.customer.findUnique({
      where: { id: input.customerId },
      select: { id: true, email: true, mobile: true, fullName: true },
    });
    if (!c) return null;
    return {
      customerId: c.id, email: c.email, mobile: c.mobile, firstName: firstNameOf(c.fullName),
      bookingId: null, reference: null, packageName: null, destination: null, tripHref: "/account",
    };
  }
  return null;
}

/** Per-event content + channel policy. Email/SMS are sent only when present here. */
function buildContent(event: AppEvent, ctx: Ctx, data: Record<string, string>): Content {
  const trip = ctx.destination ?? ctx.packageName ?? "your holiday";
  const ref = ctx.reference ?? "";
  const viewTrip = { label: "View my trip", href: `${siteUrl()}${ctx.tripHref}` };

  switch (event) {
    case "USER_REGISTERED":
      return {
        title: "Your ExpertzTrip account is ready",
        body: "Welcome! Your email is verified and your account is set up.",
        href: "/account",
        email: {
          subject: "Welcome to ExpertzTrip ✈️",
          heading: `Welcome, ${ctx.firstName}!`,
          bodyHtml: `We're here to make planning and booking your next holiday simple. You can explore our holiday packages, customize your trip and manage your bookings online — all from <b>My Trips</b>.`,
          cta: { label: "Explore Holidays", href: `${siteUrl()}/packages` },
        },
        sms: "ExpertzTrip: Welcome! Your account is ready. Explore holidays at expertztrip.com",
      };

    case "BOOKING_CREATED":
      return {
        title: `Booking received — ${ref}`,
        body: `We've received your booking request for ${trip}. It's now being processed.`,
        href: ctx.tripHref,
        email: {
          subject: `We've received your ExpertzTrip booking — ${ref}`,
          heading: "Booking received",
          bodyHtml: `Hi ${ctx.firstName}, we've received your booking request for <b>${ctx.packageName ?? trip}</b>.<br><br>Booking ID: <b>${ref}</b><br>Status: <b>Booking received</b><br><br>Your booking is now being processed. You can follow its status any time in My Trips.`,
          cta: viewTrip,
        },
      };

    case "PAYMENT_RECEIVED":
      return {
        title: `Payment received — ${ref}`,
        body: `We've received your payment for ${trip}. Your booking is now being processed.`,
        href: ctx.tripHref,
        email: {
          subject: `Payment received — ExpertzTrip ${ref}`,
          heading: "Payment received",
          bodyHtml: `Hi ${ctx.firstName}, we've successfully received your payment for <b>${ctx.packageName ?? trip}</b> (booking <b>${ref}</b>).<br><br>Payment status: <b>PAID</b><br><br>Your holiday is now being processed. Please note: payment received does not automatically mean every travel component is confirmed — our team now confirms the required components and we'll share your documents in My Trips.`,
          cta: viewTrip,
        },
        sms: `ExpertzTrip: Payment received for booking ${ref}. Your holiday is now being processed.`,
      };

    case "BOOKING_PROCESSING":
      // In-app only — PAYMENT_RECEIVED already messaged the customer; avoid spam.
      return {
        title: "Booking in progress",
        body: `We're securing the travel components for ${trip}.`,
        href: ctx.tripHref,
      };

    case "BOOKING_CONFIRMED":
      return {
        title: `Your holiday is confirmed ✓ — ${ref}`,
        body: `Great news! ${trip} (booking ${ref}) is confirmed. Check My Trips for your itinerary and documents.`,
        href: ctx.tripHref,
        email: {
          subject: "Your ExpertzTrip holiday is confirmed ✓",
          heading: "Your holiday is confirmed",
          bodyHtml: `Hi ${ctx.firstName}, your booking <b>${ref}</b> for <b>${ctx.packageName ?? trip}</b> is now confirmed. Your itinerary and travel documents are available in My Trips. We'll keep you posted on any updates before you travel.`,
          cta: viewTrip,
        },
        sms: `ExpertzTrip: Your holiday booking ${ref} is confirmed. Check My Trips for your itinerary and travel documents.`,
      };

    case "DOCUMENT_PUBLISHED": {
      const docType = data.documentType || "travel document";
      return {
        title: `Your ${docType} is ready`,
        body: `Your ${docType} for booking ${ref} is now available in My Trips.`,
        href: ctx.tripHref,
        email: {
          subject: `Your ExpertzTrip ${docType} is ready`,
          heading: `Hi ${ctx.firstName}, your ${docType} is ready`,
          bodyHtml: `Your <b>${docType}</b>${data.title ? ` (“${data.title}”)` : ""} for booking <b>${ref}</b> is attached to this email.<br><br>You can also view or download it any time — signed in and secure — in <b>My Trips</b>.`,
          cta: viewTrip,
        },
        sms: `ExpertzTrip: Your ${docType} for booking ${ref} is now available in My Trips.`,
      };
    }

    case "ITINERARY_READY":
      return {
        title: "Your itinerary is ready",
        body: `Your complete itinerary for ${trip} is ready to view.`,
        href: ctx.tripHref,
        email: {
          subject: "Your ExpertzTrip itinerary is ready",
          heading: `Hi ${ctx.firstName}, your itinerary is ready`,
          bodyHtml: `Your complete holiday itinerary for <b>${trip}</b> is now ready — flights, hotel, transfers, activities and your day-by-day schedule. View it securely in My Trips.`,
          cta: viewTrip,
        },
        sms: `ExpertzTrip: Your complete itinerary for ${trip} is ready. View it securely in My Trips.`,
      };

    case "BOOKING_CANCELLED":
      return {
        title: `Booking cancelled — ${ref}`,
        body: `Your booking ${ref} has been cancelled.`,
        href: ctx.tripHref,
        email: {
          subject: `Your ExpertzTrip booking ${ref} has been cancelled`,
          heading: "Booking cancelled",
          bodyHtml: `Hi ${ctx.firstName}, your booking <b>${ref}</b> for ${ctx.packageName ?? trip} has been cancelled. If a refund applies, we'll process it and keep you updated.`,
          cta: viewTrip,
        },
      };

    case "REVIEW_REQUESTED":
      return {
        title: "How was your holiday?",
        body: `We'd love your review of ${trip}.`,
        href: ctx.tripHref,
        email: {
          subject: "How was your ExpertzTrip holiday? ✨",
          heading: `Welcome back, ${ctx.firstName}!`,
          bodyHtml: `We hope you had a wonderful time on <b>${ctx.packageName ?? trip}</b>. Your feedback helps other travellers and helps us do better — it only takes a minute. And when you're ready for your next holiday, we're here.`,
          cta: { label: "Leave a review", href: `${siteUrl()}${ctx.tripHref}` },
        },
        sms: `ExpertzTrip: We hope you enjoyed ${trip}! We'd love a quick review — see My Trips.`,
      };

    case "REFUND_PROCESSED":
      return {
        title: `Refund processed — ${ref}`,
        body: `Your refund for booking ${ref} has been processed.`,
        href: ctx.tripHref,
        email: {
          subject: `Your ExpertzTrip refund — ${ref}`,
          heading: "Refund processed",
          bodyHtml: `Hi ${ctx.firstName}, the refund for booking <b>${ref}</b>${data.amount ? ` of <b>${data.amount}</b>` : ""} has been processed. It may take a few business days to reflect in your account.`,
          cta: viewTrip,
        },
        sms: `ExpertzTrip: Your refund for booking ${ref} has been processed.`,
      };
  }
}

async function logMessage(entry: {
  customerId: string | null; bookingId: string | null; channel: "EMAIL" | "SMS";
  event: string; toAddress: string; status: string; providerId?: string; error?: string; dedupeKey: string;
}) {
  try {
    await db.messageLog.create({ data: { ...entry } });
  } catch (e) {
    console.error("MessageLog write failed:", (e as Error).message);
  }
}

/**
 * Emit a customer-facing event. Idempotent, non-blocking, never throws.
 * Returns whether a new event was dispatched (false = duplicate / no recipient).
 */
export async function emitEvent(input: EmitInput): Promise<boolean> {
  try {
    // Fast idempotency check.
    const existing = await db.notification.findUnique({ where: { dedupeKey: input.dedupeKey }, select: { id: true } });
    if (existing) return false;

    const ctx = await resolveContext(input);
    if (!ctx || !ctx.customerId) return false;

    const content = buildContent(input.event, ctx, input.data ?? {});

    // 1) In-app notification — also the idempotency guard (unique dedupeKey).
    try {
      await db.notification.create({
        data: {
          customerId: ctx.customerId, channel: "IN_APP", type: input.event, event: input.event,
          title: content.title, body: content.body, href: content.href,
          bookingId: ctx.bookingId, dedupeKey: input.dedupeKey,
        },
      });
    } catch (e) {
      // Unique violation → another concurrent emit won the race. Treat as done.
      if ((e as { code?: string }).code === "P2002") return false;
      throw e;
    }

    // 2) Email (Resend) — per policy.
    if (content.email && ctx.email) {
      const r = await sendEmail({
        to: ctx.email,
        subject: content.email.subject,
        html: emailLayout(content.email.heading, content.email.bodyHtml, content.email.cta),
        attachments: input.attachments,
      });
      await logMessage({
        customerId: ctx.customerId, bookingId: ctx.bookingId, channel: "EMAIL", event: input.event,
        toAddress: ctx.email, status: r.ok ? "SENT" : "FAILED", error: r.error, dedupeKey: input.dedupeKey,
      });
    }

    // 2b) Business alert — the company inbox is notified of new bookings and
    // verified payments, with the customer's address as Reply-To. Sent to the
    // official business mailbox only; never to an unrelated recipient.
    if (ADMIN_ALERT_EVENTS.has(input.event) && ctx.bookingId) {
      try {
        const b = await db.booking.findUnique({
          where: { id: ctx.bookingId },
          select: {
            totalAmount: true, travellerCount: true, travelDate: true, departureCity: true,
            customer: { select: { fullName: true, email: true, mobile: true } },
          },
        });
        if (b) {
          const paid = input.event === "PAYMENT_RECEIVED";
          await sendEmail({
            to: businessNotifyEmail(),
            replyTo: b.customer.email || undefined,
            subject: `${paid ? "💳 Payment received" : "🔔 New booking"} — ${ctx.reference} — ${ctx.packageName ?? "ExpertzTrip"}`,
            html: emailLayout(
              paid ? "Payment received" : "New booking received",
              `Booking ID: <b>${ctx.reference}</b><br>
               Customer: <b>${b.customer.fullName ?? "—"}</b><br>
               Email: <b>${b.customer.email ?? "—"}</b><br>
               Phone: <b>${b.customer.mobile ?? "—"}</b><br>
               Package: <b>${ctx.packageName ?? "—"}</b><br>
               ${b.departureCity ? `From: <b>${b.departureCity}</b><br>` : ""}
               ${b.travelDate ? `Travel date: <b>${formatDate(b.travelDate)}</b><br>` : ""}
               Travellers: <b>${b.travellerCount}</b><br>
               Amount: <b>${formatINR(b.totalAmount)}</b><br>
               Payment: <b>${paid ? "SUCCESSFUL" : "Pending"}</b>`,
              { label: "Open booking", href: `${siteUrl()}/admin/bookings/${ctx.bookingId}` },
            ),
          });
        }
      } catch (e) {
        console.error("business alert failed (non-blocking):", (e as Error).message);
      }
    }

    // 3) SMS (MSG91) — per policy.
    if (content.sms && ctx.mobile) {
      const r = await sendTransactionalSms(ctx.mobile, content.sms);
      await logMessage({
        customerId: ctx.customerId, bookingId: ctx.bookingId, channel: "SMS", event: input.event,
        toAddress: ctx.mobile, status: r.status, providerId: r.providerId, error: r.error, dedupeKey: input.dedupeKey,
      });
    }

    return true;
  } catch (e) {
    console.error(`emitEvent(${input.event}) failed:`, (e as Error).message);
    return false;
  }
}
