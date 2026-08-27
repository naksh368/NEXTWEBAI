import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/services/otp-service";
import { sendPasswordResetEmail } from "@/lib/services/agent-notify";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/**
 * Request a password reset. Always returns ok (never reveals whether an account
 * exists). Emits a single-use, 30-minute, hashed token by email.
 */
export async function POST(req: Request) {
  const ip = await clientIp();
  const rl = rateLimit(`forgot:${ip}`, 6, 600);
  if (!rl.ok) return NextResponse.json({ ok: true });

  const body = await req.json().catch(() => null);
  const email = normalizeEmail(String(body?.email ?? ""));
  if (!email) return NextResponse.json({ ok: true });

  const agent = await db.agent.findUnique({ where: { email } });
  if (agent && agent.status !== "DRAFT") {
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    // Invalidate previous outstanding resets for this agent.
    await db.agentPasswordReset.updateMany({ where: { agentId: agent.id, consumedAt: null }, data: { consumedAt: new Date() } });
    await db.agentPasswordReset.create({
      data: { agentId: agent.id, tokenHash, expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
    });
    await sendPasswordResetEmail(agent.email, agent.fullName, token).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
