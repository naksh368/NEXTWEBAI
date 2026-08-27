import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Agent (partner) session — its own cookie + token namespace, separate from the
 * customer and admin sessions, so no token can cross a role boundary.
 */
const COOKIE = "etx_agent";
const SECRET = process.env.AUTH_SECRET || "insecure-dev-secret-change-me";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days

type Payload = { sub: string; iat: number; exp: number; jti: string };

function sign(data: string) {
  return createHmac("sha256", `agent:${SECRET}`).update(data).digest("base64url");
}

export function createAgentToken(agentId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: Payload = { sub: agentId, iat: now, exp: now + MAX_AGE, jti: randomUUID() };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function verify(token: string | undefined): Payload | null {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  try {
    const a = Buffer.from(sig!);
    const b = Buffer.from(sign(body!));
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(body!, "base64url").toString()) as Payload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setAgentCookie(agentId: string) {
  const jar = await cookies();
  jar.set(COOKIE, createAgentToken(agentId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearAgentCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getAgentSessionId(): Promise<string | null> {
  const jar = await cookies();
  return verify(jar.get(COOKIE)?.value)?.sub ?? null;
}

export const AGENT_COOKIE_NAME = COOKIE;
