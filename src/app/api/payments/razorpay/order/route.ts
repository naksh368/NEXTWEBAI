import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionCustomerId } from "@/lib/session";
import { createOrder, isRazorpayConfigured, publicKeyId } from "@/lib/services/razorpay-service";

export const runtime = "nodejs";

const schema = z.object({ bookingId: z.string().min(1) });

export async function POST(request: Request) {
  const customerId = await getSessionCustomerId();
  if (!customerId) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 422 });

  // Ownership check — a customer can only pay for their own booking.
  const booking = await db.booking.findFirst({
    where: { id: parsed.data.bookingId, customerId },
    select: { id: true, reference: true, totalAmount: true, currency: true, status: true },
  });
  if (!booking) return NextResponse.json({ ok: false, error: "Booking not found." }, { status: 404 });

  if (!isRazorpayConfigured()) {
    return NextResponse.json(
      { ok: false, configured: false, error: "Online payment is not enabled in this environment." },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const order = await createOrder(booking.totalAmount, booking.reference, booking.currency);
    // Record a pending payment tied to the order.
    await db.payment.upsert({
      where: { providerOrderId: order.id },
      update: {},
      create: {
        bookingId: booking.id, provider: "razorpay", providerOrderId: order.id,
        amount: booking.totalAmount, currency: booking.currency, status: "PENDING",
      },
    });
    return NextResponse.json(
      { ok: true, configured: true, orderId: order.id, amount: order.amount, currency: order.currency, keyId: publicKeyId() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ ok: false, error: "Could not start payment. Please try again." }, { status: 502 });
  }
}
