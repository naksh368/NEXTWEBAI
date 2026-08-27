import { db } from "@/lib/db";
import { createOrder, verifyPaymentSignature, isRazorpayConfigured } from "./razorpay-service";
import { creditTopup } from "./wallet-service";
import { sendPaymentReceiptEmail } from "./agent-notify";

/**
 * Agent wallet top-up via Razorpay. Reuses the existing, proven razorpay-service
 * (order creation, signature verification, webhook verification). The wallet is
 * credited server-side ONLY after a trusted signal (checkout signature OR
 * webhook) and always through the idempotent creditTopup ledger path — the
 * browser "success" screen never credits money on its own.
 */

export const TOPUP_PRESETS = [1000, 2500, 5000, 10000];
export const MIN_TOPUP = 100;
export const MAX_TOPUP = 500000;

export async function initiateTopup(agentId: string, amount: number) {
  if (!Number.isInteger(amount) || amount < MIN_TOPUP || amount > MAX_TOPUP) {
    throw new Error(`Enter an amount between ₹${MIN_TOPUP} and ₹${MAX_TOPUP.toLocaleString("en-IN")}.`);
  }
  if (!isRazorpayConfigured()) throw new Error("Payments are not configured yet. Please contact support.");

  const payment = await db.agentPayment.create({
    data: { agentId, amount, status: "INITIATED" },
  });
  const order = await createOrder(amount, `wallet_${payment.id}`);
  await db.agentPayment.update({
    where: { id: payment.id },
    data: { providerOrderId: order.id, status: "PROCESSING" },
  });
  return { paymentId: payment.id, order };
}

/**
 * Verify a checkout callback and credit the wallet (idempotent). Called from the
 * agent's browser after Razorpay checkout; the webhook is the trusted backstop.
 */
export async function verifyAndCredit(input: {
  agentId: string;
  orderId: string;
  paymentId: string; // razorpay payment id
  signature: string;
}): Promise<{ ok: boolean; balance?: number; error?: string }> {
  const payment = await db.agentPayment.findUnique({ where: { providerOrderId: input.orderId } });
  if (!payment || payment.agentId !== input.agentId) return { ok: false, error: "Payment not found." };

  const valid = verifyPaymentSignature(input.orderId, input.paymentId, input.signature);
  if (!valid) {
    await db.agentPayment.update({ where: { id: payment.id }, data: { status: "FAILED", errorReason: "Signature mismatch" } });
    return { ok: false, error: "Payment could not be verified." };
  }
  await db.agentPayment.update({
    where: { id: payment.id },
    data: { providerPaymentId: input.paymentId, signatureValid: true },
  });
  const { credited, balance } = await creditTopup(payment.id);
  if (credited) await afterCredit(payment.agentId, payment.amount, balance, payment.providerPaymentId ?? input.paymentId);
  return { ok: true, balance };
}

/**
 * Apply a verified webhook event. Trusted (signature already verified by the
 * route). Marks captured/failed and credits idempotently.
 */
export async function applyWebhook(event: string, entity: { order_id?: string; id?: string; method?: string; error_description?: string }) {
  const orderId = entity.order_id;
  if (!orderId) return;
  const payment = await db.agentPayment.findUnique({ where: { providerOrderId: orderId } });
  if (!payment) return;

  if (event === "payment.captured" || event === "order.paid") {
    await db.agentPayment.update({
      where: { id: payment.id },
      data: { providerPaymentId: entity.id ?? payment.providerPaymentId, signatureValid: true, method: entity.method },
    });
    const { credited, balance } = await creditTopup(payment.id);
    if (credited) await afterCredit(payment.agentId, payment.amount, balance, entity.id ?? payment.id);
  } else if (event === "payment.failed") {
    if (payment.status !== "SUCCESS") {
      await db.agentPayment.update({
        where: { id: payment.id },
        data: { status: "FAILED", errorReason: entity.error_description ?? "Payment failed" },
      });
    }
  }
}

async function afterCredit(agentId: string, amount: number, balance: number, ref: string) {
  const agent = await db.agent.findUnique({ where: { id: agentId }, select: { id: true, fullName: true, email: true } });
  if (agent) await sendPaymentReceiptEmail(agent, amount, balance, ref).catch(() => {});
}
