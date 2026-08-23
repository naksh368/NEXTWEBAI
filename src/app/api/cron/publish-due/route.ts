import { NextResponse } from "next/server";
import { publishDuePackages } from "@/lib/services/scheduler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Publishes packages whose scheduled time has arrived.
 * Point a scheduler at this (Vercel Cron, Netlify Scheduled Function, or any
 * uptime pinger). When CRON_SECRET is set, callers must pass it as
 *   Authorization: Bearer <CRON_SECRET>   or   ?key=<CRON_SECRET>
 * Vercel Cron requests (x-vercel-cron header) are always allowed.
 */
async function handle(request: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const url = new URL(request.url);
    const auth = request.headers.get("authorization");
    const isVercelCron = request.headers.get("x-vercel-cron") != null;
    const ok = isVercelCron || auth === `Bearer ${secret}` || url.searchParams.get("key") === secret;
    if (!ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const published = await publishDuePackages();
  return NextResponse.json({ ok: true, published }, { headers: { "Cache-Control": "no-store" } });
}

export const GET = handle;
export const POST = handle;
