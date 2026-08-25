import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Admin session — separate cookie + token namespace from the customer session,
 * so a customer token can never be used to reach the admin panel (Phase 29/30).
 */
const COOKIE = "etx_admin";
const SECRET = process.env.AUTH_SECRET || "insecure-dev-secret-change-me";
const MAX_AGE = 60 * 60 * 12; // 12h admin sessions

type AdminPayload = { sub: string; iat: number; exp: number; jti: string };

function sign(data: string) {
  return createHmac("sha256", `admin:${SECRET}`).update(data).digest("base64url");
}

export function createAdminToken(adminId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminPayload = { sub: adminId, iat: now, exp: now + MAX_AGE, jti: randomUUID() };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function verify(token: string | undefined): AdminPayload | null {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(sign(body));
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as AdminPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setAdminCookie(adminId: string) {
  const jar = await cookies();
  jar.set(COOKIE, createAdminToken(adminId), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: MAX_AGE,
  });
}

export async function clearAdminCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getAdminSessionId(): Promise<string | null> {
  const jar = await cookies();
  return verify(jar.get(COOKIE)?.value)?.sub ?? null;
}
