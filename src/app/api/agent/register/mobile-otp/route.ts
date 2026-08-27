import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAgentSessionId } from "@/lib/agent-session";
import { sendMobileOtp, checkMobileOtp, isTwilioConfigured } from "@/lib/services/twilio-verify";
import { rateLimit } from "@/lib/rate-limit";

/** Send / resend a mobile OTP (Twilio Verify) to the signed-in draft agent. */
export async function POST() {
  const id = await getAgentSessionId();
  if (!id) return NextResponse.json({ error: "Session expired." }, { status: 401 });
  if (!isTwilioConfigured()) return NextResponse.json({ error: "Mobile verification is not enabled." }, { status: 400 });

  const agent = await db.agent.findUnique({ where: { id } });
  if (!agent) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  // Cooldown (per agent) on top of Twilio's own limits.
  const rl = rateLimit(`mobileotp:send:${agent.id}`, 5, 300);
  if (!rl.ok) return NextResponse.json({ error: "Please wait before requesting another code.", retryInSeconds: rl.retryAfter }, { status: 429 });

  const res = await sendMobileOtp(agent.mobile);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}

/** Verify a mobile OTP; marks the agent's mobile verified on success. */
export async function PUT(req: Request) {
  const id = await getAgentSessionId();
  if (!id) return NextResponse.json({ error: "Session expired." }, { status: 401 });
  const agent = await db.agent.findUnique({ where: { id } });
  if (!agent) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const rl = rateLimit(`mobileotp:check:${agent.id}`, 10, 300);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts. Please request a new code." }, { status: 429 });

  const body = await req.json().catch(() => null);
  const code = String(body?.code ?? "").trim();
  const res = await checkMobileOtp(agent.mobile, code);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });

  await db.agent.update({ where: { id: agent.id }, data: { isMobileVerified: true } });
  return NextResponse.json({ ok: true });
}
