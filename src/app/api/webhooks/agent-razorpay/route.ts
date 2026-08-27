import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/services/razorpay-service";
import { applyWebhook } from "@/lib/services/agent-payment-service";

export const runtime = "nodejs";

/**
 * Razorpay webhook for AGENT WALLET top-ups. The signature is verified over the
 * RAW body before anything is trusted. Wallet crediting is idempotent (guarded
 * by AgentPayment.walletTransactionId) so a replayed webhook never double-credits.
 * Orders not belonging to an agent top-up are ignored (they may be B2C bookings
 * handled by /api/webhooks/razorpay).
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  let event: { event?: string; payload?: { payment?: { entity?: Record<string, unknown> } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const entity = event?.payload?.payment?.entity as
    | { order_id?: string; id?: string; method?: string; error_description?: string }
    | undefined;
  if (!entity?.order_id || !event.event) return NextResponse.json({ ok: true, ignored: true });

  await applyWebhook(event.event, entity);
  return NextResponse.json({ ok: true });
}
