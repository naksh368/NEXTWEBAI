import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentAgent } from "@/lib/agent-auth";
import { verifyPaymentSignature } from "@/lib/services/razorpay-service";
import { creditTopup } from "@/lib/wallet";
import { paiseToRupees } from "@/lib/money";

export const runtime = "nodejs";

const schema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1),
});

/**
 * Browser callback after Razorpay checkout. This is a convenience fast-path —
 * the webhook is the authoritative source of truth. We verify the signature,
 * then credit the wallet idempotently (the same payment id can only credit once,
 * whether it arrives here or via the webhook).
 */
export async function POST(request: Request) {
  const agent = await getCurrentAgent();
  if (!agent) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 422 });
  const { orderId, paymentId, signature } = parsed.data;

  if (!verifyPaymentSignature(orderId, paymentId, signature)) {
    return NextResponse.json({ ok: false, error: "Payment could not be verified." }, { status: 400 });
  }

  const payment = await db.walletPayment.findFirst({ where: { orderId, agentId: agent.id } });
  if (!payment) return NextResponse.json({ ok: false, error: "Payment not found." }, { status: 404 });

  if (payment.status !== "PAID") {
    await db.walletPayment.update({ where: { id: payment.id }, data: { status: "PAID", paymentId, signature, processedAt: new Date() } });
  }
  const res = await creditTopup(agent.id, payment.amountPaise, paymentId, "Wallet top-up");

  return NextResponse.json({ ok: true, credited: res.applied, balance: paiseToRupees(res.balancePaise) }, { headers: { "Cache-Control": "no-store" } });
}
