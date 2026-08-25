import { NextResponse } from "next/server";
import { getSessionCustomerId } from "@/lib/session";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Canonical booking/payment status, read fresh from the DB (ownership-enforced).
 * The booking page polls this while a payment is in-flight so the customer sees
 * the correct state even if the webhook is delayed or arrives out of order.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const customerId = await getSessionCustomerId();
  if (!customerId) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await params;
  const booking = await db.booking.findFirst({
    where: { id, customerId },
    select: {
      status: true, updatedAt: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } },
    },
  });
  if (!booking) return NextResponse.json({ ok: false }, { status: 404 });

  return NextResponse.json(
    { ok: true, bookingStatus: booking.status, paymentStatus: booking.payments[0]?.status ?? null, updatedAt: booking.updatedAt.toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
