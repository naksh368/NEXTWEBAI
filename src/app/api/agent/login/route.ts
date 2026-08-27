import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { setAgentCookie } from "@/lib/agent-session";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/services/otp-service";

/**
 * Agent login by email / mobile / Application ID + password. Server-side
 * authorization only — the returned redirect depends on the account status so
 * unapproved agents land on their application page, never the portal.
 */
export async function POST(req: Request) {
  const ip = await clientIp();
  const body = await req.json().catch(() => null);
  const identifier = String(body?.identifier ?? "").trim();
  const password = String(body?.password ?? "");
  if (!identifier || !password) return NextResponse.json({ error: "Enter your credentials." }, { status: 400 });

  // Brute-force protection per IP and per identifier.
  const rl1 = rateLimit(`login:${ip}`, 20, 300);
  const rl2 = rateLimit(`login:id:${identifier.toLowerCase()}`, 8, 300);
  if (!rl1.ok || !rl2.ok) return NextResponse.json({ error: "Too many attempts. Please try again in a few minutes." }, { status: 429 });

  const email = normalizeEmail(identifier);
  const agent = await db.agent.findFirst({
    where: {
      OR: [
        ...(email ? [{ email }] : []),
        { mobile: identifier },
        { mobile: `+91${identifier.replace(/^0+/, "")}` },
        { applicationId: identifier.toUpperCase() },
      ],
    },
  });

  // Generic error — never reveal which part was wrong.
  if (!agent || !verifyPassword(password, agent.passwordHash)) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }
  if (agent.status === "DRAFT") {
    return NextResponse.json({ error: "Please complete your registration first.", redirect: "/register" }, { status: 403 });
  }

  await setAgentCookie(agent.id);
  await db.agent.update({ where: { id: agent.id }, data: { lastLoginAt: new Date() } });

  const redirect = agent.status === "APPROVED" ? "/agent" : "/application";
  return NextResponse.json({ ok: true, redirect });
}
