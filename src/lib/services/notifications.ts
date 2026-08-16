import { db } from "@/lib/db";
import { sendEmail, emailLayout } from "@/lib/services/email";
import { sendTransactionalSms } from "@/lib/services/sms";
import type { AppEvent } from "@/lib/constants";

/**
 * Central notification / event service (Phase 20, spec §18).
 *
 * `emitEvent` is the single entry point for customer communication. Every call
 * originates from a real database state change (registration, verified payment,
 * a published document, a confirmed booking …) and fans out to:
 *   • an in-app notification (the notification center),
 *   • a branded Resend email  (per policy),
 *   • an MSG91 transactional SMS (per policy).
 *
 * Guarantees:
 *   • Idempotent — one in-app record per `dedupeKey`; a duplicate emit is a
 *     no-op, so booking/payment retries never double-message a customer.
 *   • Honest — email/SMS outcomes are recorded in MessageLog with the real
 *     provider status (QUEUED/SENT/FAILED/SKIPPED). Nothing is faked.
 *   • Non-blocking — never throws; a channel failure never breaks the caller.
 */

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export type EmitInput = {
  event: AppEvent;
  customerId?: string;
  bookingId?: string;
  /** Stable key that makes this event unique, e.g. `BOOKING_CONFIRMED:<bookingId>`. */
  dedupeKey: string;
  /** Extra template variables (documentType, title, amount …). */
  data?: Record<string, string>;
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
        body: "Welcome! Your mobile number is verified and your account is set up.",
        href: "/account",
        email: {
          subject: "Welcome to ExpertzTrip",
          heading: `Welcome, ${ctx.firstName}!`,
          bodyHtml: `Your account has been created using your verified mobile number. You can now explore holiday packages, customize trips, manage bookings and access your documents in <b>My Trips</b>.`,
          cta: { label: "Explore packages", href: `${siteUrl()}/packages` },
        },
        sms: "ExpertzTrip: Welcome! Your mobile number has been verified and your account is now ready.",
      };

    case "PAYMENT_RECEIVED":
      return {
        title: `Payment received — ${ref}`,
        body: `We've received your payment for ${trip}. Your booking is now being processed.`,
        href: ctx.tripHref,
        email: {
          subject: `ExpertzTrip booking received — ${ref}`,
          heading: "Payment received",
          bodyHtml: `Hi ${ctx.firstName}, we've received your payment for <b>${ctx.packageName ?? trip}</b> (booking <b>${ref}</b>). Your holiday is now being processed — we'll notify you at each step and share your documents in My Trips. We don't mark a trip “confirmed” until the supplier confirms it.`,
          cta: viewTrip,
        },
        sms: `ExpertzTrip: Your booking ${ref} has been received and is being processed. We'll notify you when it's confirmed.`,
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
          heading: `Hi ${ctx.firstName}, a document is ready`,
          bodyHtml: `Your <b>${docType}</b>${data.title ? ` (“${data.title}”)` : ""} for booking <b>${ref}</b> is now available. It's private to your account — sign in to view or download it securely in My Trips.`,
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
      });
      await logMessage({
        customerId: ctx.customerId, bookingId: ctx.bookingId, channel: "EMAIL", event: input.event,
        toAddress: ctx.email, status: r.ok ? "SENT" : "FAILED", error: r.error, dedupeKey: input.dedupeKey,
      });
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
