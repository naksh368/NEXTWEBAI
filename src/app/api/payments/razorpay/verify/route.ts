import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionCustomerId } from "@/lib/session";
import { verifyPaymentSignature } from "@/lib/services/razorpay-service";
import { markPaymentReceivedAndProcess } from "@/lib/services/booking-service";

export const runtime = "nodejs";

const schema = z.object({
  bookingId: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(request: Request) {
  const customerId = await getSessionCustomerId();
  if (!customerId) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 422 });
  const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const booking = await db.booking.findFirst({ where: { id: bookingId, customerId }, select: { id: true } });
  if (!booking) return NextResponse.json({ ok: false, error: "Booking not found." }, { status: 404 });

  // Never trust the client callback alone — verify the signature server-side.
  const valid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  if (!valid) {
    await db.payment.updateMany({
      where: { providerOrderId: razorpay_order_id, bookingId },
      data: { status: "FAILED", errorReason: "Signature verification failed" },
    });
    return NextResponse.json({ ok: false, error: "Payment verification failed." }, { status: 400 });
  }

  await db.payment.updateMany({
    where: { providerOrderId: razorpay_order_id, bookingId },
    data: { status: "PAID", providerPaymentId: razorpay_payment_id, signatureValid: true },
  });
  await markPaymentReceivedAndProcess(bookingId, "customer");

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
