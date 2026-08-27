import { NextResponse } from "next/server";
import { authorizeAgent } from "@/lib/agent-auth";
import { initiateTopup } from "@/lib/services/agent-payment-service";
import { publicKeyId } from "@/lib/services/razorpay-service";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/** Create a Razorpay order for an agent wallet top-up (server-side). */
export async function POST(req: Request) {
  const agent = await authorizeAgent();
  if (!agent) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const ip = await clientIp();
  if (!rateLimit(`topup:${agent.id}:${ip}`, 15, 300).ok) {
    return NextResponse.json({ error: "Too many attempts. Please wait a moment." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const amount = Math.round(Number(body?.amount));
  try {
    const { paymentId, order } = await initiateTopup(agent.id, amount);
    return NextResponse.json({
      ok: true,
      paymentId,
      order,
      keyId: publicKeyId(),
      agentName: agent.fullName,
      agentEmail: agent.email,
      agentMobile: agent.mobile,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
