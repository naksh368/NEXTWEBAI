import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "etx_cust";
const SECRET = process.env.AUTH_SECRET || "insecure-dev-secret-change-me";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

type Payload = { sub: string; iat: number; exp: number; jti: string };

function sign(data: string) {
  return createHmac("sha256", `customer:${SECRET}`).update(data).digest("base64url");
}

export function createCustomerToken(customerId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: Payload = { sub: customerId, iat: now, exp: now + MAX_AGE, jti: randomUUID() };
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

export async function setCustomerCookie(customerId: string) {
  const jar = await cookies();
  jar.set(COOKIE, createCustomerToken(customerId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearCustomerCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getCustomerSessionId(): Promise<string | null> {
  const jar = await cookies();
  return verify(jar.get(COOKIE)?.value)?.sub ?? null;
}

export const CUSTOMER_COOKIE_NAME = COOKIE;
