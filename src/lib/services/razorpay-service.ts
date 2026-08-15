import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay integration (Phase 16). Fully implemented and gated on env keys —
 * with keys present it creates real orders and verifies signatures/webhooks;
 * without keys it reports "not configured" so nothing is ever faked.
 *
 * Money note: Razorpay works in the smallest currency unit (paise). Our app
 * stores whole rupees, so we multiply by 100 when creating an order.
 */

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

export function isRazorpayConfigured(): boolean {
  return Boolean(KEY_ID && KEY_SECRET);
}

export function publicKeyId(): string | null {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? KEY_ID ?? null;
}

export type RazorpayOrder = { id: string; amount: number; currency: string };

export async function createOrder(amountRupees: number, receipt: string, currency = "INR"): Promise<RazorpayOrder> {
  if (!isRazorpayConfigured()) throw new Error("Razorpay is not configured.");
  const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: Math.round(amountRupees * 100), // rupees → paise
      currency,
      receipt,
      payment_capture: 1,
    }),
  });
  if (!res.ok) {
    throw new Error(`Razorpay order failed (${res.status}).`);
  }
  const data = (await res.json()) as RazorpayOrder;
  return { id: data.id, amount: data.amount, currency: data.currency };
}

/** Verify the checkout callback signature: HMAC_SHA256(order_id|payment_id, secret). */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!KEY_SECRET) return false;
  const expected = createHmac("sha256", KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Verify a webhook payload against the webhook secret. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return false;
  const expected = createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    return ba.length === bb.length && timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}
