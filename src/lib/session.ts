import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Stateless signed session (Phase 12/30). An HMAC-signed token in an httpOnly
 * cookie — no secret ever reaches the client. Kept deliberately small; swap for
 * a DB-backed session table if you need server-side revocation.
 */
const COOKIE = process.env.SESSION_COOKIE_NAME || "etx_session";
const SECRET = process.env.AUTH_SECRET || "insecure-dev-secret-change-me";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

type SessionPayload = { sub: string; iat: number; exp: number; jti: string };

function sign(data: string): string {
  return createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function createSessionToken(customerId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { sub: customerId, iat: now, exp: now + MAX_AGE, jti: randomUUID() };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = sign(body);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(customerId: string) {
  const jar = await cookies();
  jar.set(COOKIE, createSessionToken(customerId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSessionCustomerId(): Promise<string | null> {
  const jar = await cookies();
  const payload = verifySessionToken(jar.get(COOKIE)?.value);
  return payload?.sub ?? null;
}
