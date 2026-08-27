import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionCustomerId } from "@/lib/session";
import { createOrder, isRazorpayConfigured, publicKeyId } from "@/lib/services/razorpay-service";
import { getOrCreateWallet, stageTopup, walletTxnReference } from "@/lib/services/wallet-service";

export const runtime = "nodejs";

const MIN = 100;
const MAX = 200_000;

const schema = z.object({ amount: z.number().int().min(MIN, `Minimum top-up is ₹${MIN}.`).max(MAX, `Maximum top-up is ₹${MAX.toLocaleString("en-IN")}.`) });

export async function POST(request: Request) {
  const customerId = await getSessionCustomerId();
  if (!customerId) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid amount." }, { status: 422 });

  await getOrCreateWallet(customerId);

  if (!isRazorpayConfigured()) {
    return NextResponse.json(
      { ok: false, configured: false, error: "Online top-up is not enabled in this environment." },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const receipt = `WAL-${walletTxnReference()}`.slice(0, 40);
    const order = await createOrder(parsed.data.amount, receipt, "INR");
    await stageTopup(customerId, order.id, parsed.data.amount);
    return NextResponse.json(
      { ok: true, configured: true, orderId: order.id, amount: order.amount, currency: order.currency, keyId: publicKeyId() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ ok: false, error: "Could not start the top-up. Please try again." }, { status: 502 });
  }
}
