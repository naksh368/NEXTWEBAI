import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAgentSessionId } from "@/lib/agent-session";
import { hashPassword, verifyPassword } from "@/lib/password";
import { PASSWORD_POLICY } from "@/lib/agent-constants";

export async function POST(req: Request) {
  const id = await getAgentSessionId();
  if (!id) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const agent = await db.agent.findUnique({ where: { id } });
  if (!agent) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const current = String(body?.currentPassword ?? "");
  const next = String(body?.newPassword ?? "");
  if (!verifyPassword(current, agent.passwordHash)) {
    return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400 });
  }
  if (!PASSWORD_POLICY.regex.test(next)) return NextResponse.json({ error: PASSWORD_POLICY.hint }, { status: 400 });
  await db.agent.update({ where: { id }, data: { passwordHash: hashPassword(next) } });
  return NextResponse.json({ ok: true });
}
