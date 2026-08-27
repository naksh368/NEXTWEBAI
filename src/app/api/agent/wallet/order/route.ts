import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentAgent } from "@/lib/agent-auth";
import { createOrder, isRazorpayConfigured, publicKeyId } from "@/lib/services/razorpay-service";
import { rupeesToPaise } from "@/lib/money";

export const runtime = "nodejs";

const MIN_RUPEES = 100;
const MAX_RUPEES = 200_000;
const schema = z.object({ amountRupees: z.number().int().min(MIN_RUPEES).max(MAX_RUPEES) });

/** Create a server-side wallet top-up order. Only APPROVED agents can add money. */
export async function POST(request: Request) {
  const agent = await getCurrentAgent();
  if (!agent) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });
  if (agent.status !== "APPROVED") {
    return NextResponse.json({ ok: false, error: "Your agency must be approved before adding funds." }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: `Enter an amount between ₹${MIN_RUPEES} and ₹${MAX_RUPEES.toLocaleString("en-IN")}.` }, { status: 422 });

  if (!isRazorpayConfigured()) {
    return NextResponse.json({ ok: false, configured: false, error: "Online payment is not enabled in this environment." }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }

  const amountRupees = parsed.data.amountRupees;
  const receipt = `wallet_${agent.id.slice(0, 8)}_${Date.now()}`;
  try {
    const order = await createOrder(amountRupees, receipt);
    await db.walletPayment.create({
      data: { agentId: agent.id, provider: "razorpay", orderId: order.id, amountPaise: rupeesToPaise(amountRupees), currency: order.currency, status: "CREATED", receipt },
    });
    return NextResponse.json({
      ok: true, configured: true, orderId: order.id, amount: order.amount, currency: order.currency,
      keyId: publicKeyId(), prefill: { name: agent.agencyName, email: agent.email, contact: agent.mobile },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not start payment. Please try again." }, { status: 502 });
  }
}
