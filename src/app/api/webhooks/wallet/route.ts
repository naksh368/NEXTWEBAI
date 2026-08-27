import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/services/razorpay-service";
import { creditTopup } from "@/lib/wallet";

export const runtime = "nodejs";

/**
 * Razorpay wallet webhook — the AUTHORITATIVE source of truth for top-ups.
 * The signature is verified over the RAW body before anything is trusted, and
 * the wallet credit is idempotent (keyed on the gateway payment id), so a
 * duplicate delivery never credits the wallet twice.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string; error_description?: string } } };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const entity = event?.payload?.payment?.entity;
  const orderId = entity?.order_id;
  const paymentId = entity?.id;
  if (!orderId) return NextResponse.json({ ok: true, ignored: true });

  const payment = await db.walletPayment.findUnique({ where: { orderId } });
  if (!payment) return NextResponse.json({ ok: true, ignored: true });

  if ((event.event === "payment.captured" || event.event === "order.paid") && paymentId) {
    if (payment.status !== "PAID") {
      await db.walletPayment.update({ where: { id: payment.id }, data: { status: "PAID", paymentId, processedAt: new Date() } });
    }
    // Idempotent: keyed on the payment id, safe to call on every delivery.
    await creditTopup(payment.agentId, payment.amountPaise, paymentId, "Wallet top-up");
  } else if (event.event === "payment.failed") {
    if (payment.status === "CREATED") {
      await db.walletPayment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    }
  }

  return NextResponse.json({ ok: true });
}
