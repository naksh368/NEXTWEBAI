import { NextResponse } from "next/server";
import { authorizeAgent } from "@/lib/agent-auth";
import { verifyAndCredit } from "@/lib/services/agent-payment-service";

/**
 * Verify a Razorpay checkout callback and credit the wallet (idempotent).
 * The wallet is credited server-side after signature verification — the browser
 * success screen never credits money on its own. The webhook is the backstop.
 */
export async function POST(req: Request) {
  const agent = await authorizeAgent();
  if (!agent) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const orderId = String(body?.razorpay_order_id ?? "");
  const paymentId = String(body?.razorpay_payment_id ?? "");
  const signature = String(body?.razorpay_signature ?? "");
  if (!orderId || !paymentId || !signature) return NextResponse.json({ error: "Missing payment fields." }, { status: 400 });

  const res = await verifyAndCredit({ agentId: agent.id, orderId, paymentId, signature });
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
  return NextResponse.json({ ok: true, balance: res.balance });
}
