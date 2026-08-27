import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionCustomerId } from "@/lib/session";
import { verifyPaymentSignature } from "@/lib/services/razorpay-service";
import { creditTopupByOrder, getWalletSummary } from "@/lib/services/wallet-service";

export const runtime = "nodejs";

const schema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(request: Request) {
  const customerId = await getSessionCustomerId();
  if (!customerId) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 422 });
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  // Ownership: the staged top-up must belong to this agent's wallet.
  const staged = await db.walletTransaction.findUnique({
    where: { providerOrderId: razorpay_order_id },
    select: { id: true, wallet: { select: { customerId: true } } },
  });
  if (!staged || staged.wallet.customerId !== customerId) {
    return NextResponse.json({ ok: false, error: "Top-up not found." }, { status: 404 });
  }

  // Never trust the browser callback alone — verify the signature server-side.
  if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    await db.walletTransaction.updateMany({ where: { providerOrderId: razorpay_order_id, status: "PENDING" }, data: { status: "FAILED", description: "Signature verification failed" } });
    return NextResponse.json({ ok: false, error: "Payment verification failed." }, { status: 400 });
  }

  // Idempotent credit — the webhook may also (or already) have credited this.
  const result = await creditTopupByOrder(razorpay_order_id, razorpay_payment_id);
  if (!result.ok) return NextResponse.json({ ok: false, error: "Could not credit the wallet. Support has been notified." }, { status: 500 });

  const summary = await getWalletSummary(customerId);
  revalidatePath("/dashboard/wallet");
  revalidatePath("/dashboard");
  return NextResponse.json({ ok: true, alreadyCredited: !!result.already, wallet: summary }, { headers: { "Cache-Control": "no-store" } });
}
