import { NextResponse } from "next/server";
import { z } from "zod";
import { registerAgent } from "@/lib/agent-auth";
import { setAgentCookie } from "@/lib/agent-session";
import { requestOtp } from "@/lib/services/otp-service";

export const runtime = "nodejs";

const schema = z.object({
  agencyName: z.string().min(2).max(160),
  ownerName: z.string().min(2).max(120),
  email: z.string().email(),
  mobile: z.string().min(8).max(20),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Please check the form and try again." }, { status: 422 });

  const result = await registerAgent(parsed.data);
  if (!result.ok) return NextResponse.json(result, { status: 409 });

  await setAgentCookie(result.agentId);
  // Fire the first mobile OTP (Twilio in prod, console in dev). Non-fatal on failure.
  const otp = await requestOtp(parsed.data.mobile, "REGISTER").catch(() => ({ ok: false as const, error: "otp send failed" }));

  return NextResponse.json({ ok: true, agentId: result.agentId, otp }, { headers: { "Cache-Control": "no-store" } });
}
