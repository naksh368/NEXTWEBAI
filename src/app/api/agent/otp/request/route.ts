import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAgent } from "@/lib/agent-auth";
import { requestOtp } from "@/lib/services/otp-service";

export const runtime = "nodejs";

/** Resend a mobile OTP for the signed-in agent (throttled inside the service). */
export async function POST() {
  const agent = await getCurrentAgent();
  if (!agent) return NextResponse.json({ ok: false, error: "Please register or sign in first." }, { status: 401 });
  const full = await db.agent.findUnique({ where: { id: agent.id }, select: { mobile: true } });
  if (!full) return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 });

  const res = await requestOtp(full.mobile, "REGISTER");
  const status = res.ok ? 200 : 429;
  return NextResponse.json(res, { status, headers: { "Cache-Control": "no-store" } });
}
