import { NextResponse } from "next/server";
import { clearAgentCookie } from "@/lib/agent-session";

export async function POST() {
  await clearAgentCookie();
  return NextResponse.json({ ok: true });
}
