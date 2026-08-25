import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/services/razorpay-service";
import { markPaymentReceivedAndProcess } from "@/lib/services/booking-service";

export const runtime = "nodejs";

/**
 * Razorpay webhook (Phase 16/30). The webhook is the source of truth for payment
 * state — the browser callback can be lost or spoofed. We verify the signature
 * over the RAW body before trusting anything, and handle events idempotently.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const entity = event?.payload?.payment?.entity;
  const orderId: string | undefined = entity?.order_id;
  const paymentId: string | undefined = entity?.id;
  if (!orderId) return NextResponse.json({ ok: true, ignored: true });

  const payment = await db.payment.findUnique({ where: { providerOrderId: orderId }, select: { id: true, bookingId: true, status: true } });
  if (!payment) return NextResponse.json({ ok: true, ignored: true });

  if (event.event === "payment.captured" || event.event === "order.paid") {
    if (payment.status !== "PAID") {
      await db.payment.update({ where: { id: payment.id }, data: { status: "PAID", providerPaymentId: paymentId ?? undefined, signatureValid: true } });
      await markPaymentReceivedAndProcess(payment.bookingId, "webhook");
    }
  } else if (event.event === "payment.failed") {
    // Payment failure marks the PAYMENT record failed but leaves the booking at
    // PAYMENT_PENDING so the customer can retry. Booking-level FAILED is reserved
    // for component/supplier failure after a successful payment.
    if (payment.status !== "PAID") {
      await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED", errorReason: entity?.error_description ?? "Payment failed" } });
    }
  }

  return NextResponse.json({ ok: true });
}
