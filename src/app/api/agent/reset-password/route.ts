import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { PASSWORD_POLICY } from "@/lib/agent-constants";

/** Consume a reset token (single-use) and set a new password. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const token = String(body?.token ?? "");
  const password = String(body?.password ?? "");
  if (!token) return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
  if (!PASSWORD_POLICY.regex.test(password)) return NextResponse.json({ error: PASSWORD_POLICY.hint }, { status: 400 });

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const reset = await db.agentPasswordReset.findUnique({ where: { tokenHash } });
  if (!reset || reset.consumedAt || reset.expiresAt < new Date()) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  await db.$transaction([
    db.agent.update({ where: { id: reset.agentId }, data: { passwordHash: hashPassword(password) } }),
    db.agentPasswordReset.update({ where: { id: reset.id }, data: { consumedAt: new Date() } }),
    // Invalidate any other outstanding tokens for this agent.
    db.agentPasswordReset.updateMany({ where: { agentId: reset.agentId, consumedAt: null }, data: { consumedAt: new Date() } }),
  ]);
  return NextResponse.json({ ok: true });
}
