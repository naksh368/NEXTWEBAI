import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentAgent, markVerified } from "@/lib/agent-auth";
import { verifyOtpCode } from "@/lib/services/otp-service";

export const runtime = "nodejs";

const schema = z.object({ code: z.string().regex(/^\d{6}$/) });

/** Verify the mobile OTP for the signed-in agent, then mark the mobile verified. */
export async function POST(request: Request) {
  const agent = await getCurrentAgent();
  if (!agent) return NextResponse.json({ ok: false, error: "Please register or sign in first." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Enter the 6-digit code." }, { status: 422 });

  const full = await db.agent.findUnique({ where: { id: agent.id }, select: { mobile: true } });
  if (!full) return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 });

  const res = await verifyOtpCode(full.mobile, parsed.data.code);
  if (!res.ok) return NextResponse.json(res, { status: 400 });

  await markVerified(agent.id, "mobile");
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
