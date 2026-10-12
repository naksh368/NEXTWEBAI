import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Website visitor tracking. The public site beacons a page view here on each
 * navigation; we record the path against an anonymous, first-party visitor id.
 *
 * Privacy by design: no IP address, no personal data, no third-party cookie.
 * The `etx_vid` cookie is a random id used only to count unique visitors, and
 * admin/API paths are never recorded. Powers Admin → Analytics → Website
 * traffic ("how many people came to the website").
 */

const VISITOR_COOKIE = "etx_vid";
const ONE_YEAR = 60 * 60 * 24 * 365;

/** Paths we never count: the admin panel, auth, and the API itself. */
function isTracked(path: string): boolean {
  if (!path.startsWith("/")) return false;
  return !/^\/(admin|api|sign-in|account|_next)(\/|$)/.test(path);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { path?: unknown; referrer?: unknown };
    let path = typeof body.path === "string" ? body.path : "";
    // Keep only the pathname, capped — never query strings or fragments.
    path = path.split(/[?#]/)[0].slice(0, 300);
    if (!isTracked(path)) return NextResponse.json({ ok: true, skipped: true });

    const jar = await cookies();
    let visitor = jar.get(VISITOR_COOKIE)?.value;
    const res = NextResponse.json({ ok: true });
    if (!visitor || visitor.length < 8) {
      visitor = randomBytes(16).toString("hex");
      res.cookies.set(VISITOR_COOKIE, visitor, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: ONE_YEAR,
      });
    }

    let referrer: string | null = typeof body.referrer === "string" ? body.referrer.slice(0, 300) : null;
    if (referrer === "") referrer = null;

    await db.pageView.create({ data: { path, visitor, referrer } }).catch(() => {});
    return res;
  } catch {
    // Tracking must never break a page — swallow and move on.
    return NextResponse.json({ ok: true });
  }
}
