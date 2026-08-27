import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAgentSessionId } from "@/lib/agent-session";
import { verifyEmailOtpCode, requestEmailOtp } from "@/lib/services/otp-service";

/** Step 2 — verify the emailed OTP for the signed-in draft agent. */
export async function POST(req: Request) {
  const id = await getAgentSessionId();
  if (!id) return NextResponse.json({ error: "Session expired. Please start again." }, { status: 401 });
  const agent = await db.agent.findUnique({ where: { id } });
  if (!agent) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const code = String(body?.code ?? "").trim();
  const res = await verifyEmailOtpCode(agent.email, code);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });

  await db.agent.update({ where: { id: agent.id }, data: { isEmailVerified: true } });
  return NextResponse.json({ ok: true });
}

/** Resend the OTP (subject to the OTP service's own cooldown + rate limits). */
export async function PUT() {
  const id = await getAgentSessionId();
  if (!id) return NextResponse.json({ error: "Session expired." }, { status: 401 });
  const agent = await db.agent.findUnique({ where: { id } });
  if (!agent) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  const otp = await requestEmailOtp(agent.email, "REGISTER");
  if (!otp.ok) return NextResponse.json({ error: otp.error, retryInSeconds: otp.retryInSeconds }, { status: 429 });
  return NextResponse.json({ ok: true, resendInSeconds: otp.resendInSeconds });
}
