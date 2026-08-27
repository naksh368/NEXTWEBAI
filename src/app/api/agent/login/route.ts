import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateAgent } from "@/lib/agent-auth";
import { setAgentCookie } from "@/lib/agent-session";

export const runtime = "nodejs";

const schema = z.object({ identifier: z.string().min(3).max(160), password: z.string().min(1).max(128) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Enter your email/agent ID and password." }, { status: 422 });

  const res = await authenticateAgent(parsed.data.identifier, parsed.data.password);
  if (!res.ok) return NextResponse.json(res, { status: 401 });

  await setAgentCookie(res.agentId);
  return NextResponse.json({ ok: true, status: res.status }, { headers: { "Cache-Control": "no-store" } });
}
