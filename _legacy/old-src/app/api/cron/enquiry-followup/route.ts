import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail, emailLayout } from "@/lib/services/email";
import { getSiteUrl } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sends a one-time "still planning?" nudge to leads that came in 24–72h ago,
 * were never responded to, and haven't been nudged yet. Idempotent via
 * followUpEmailedAt. Guard with CRON_SECRET (Vercel Cron requests pass through).
 */
async function handle(request: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const url = new URL(request.url);
    const isVercelCron = request.headers.get("x-vercel-cron") != null;
    const ok = isVercelCron || request.headers.get("authorization") === `Bearer ${secret}` || url.searchParams.get("key") === secret;
    if (!ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const from = new Date(now - 72 * 3600_000); // no older than 3 days (avoid emailing stale leads)
  const until = new Date(now - 24 * 3600_000); // at least a day old

  const leads = await db.enquiry.findMany({
    where: {
      email: { not: null },
      firstRespondedAt: null,
      followUpEmailedAt: null,
      status: { in: ["NEW", "CONTACTED"] },
      createdAt: { gte: from, lte: until },
    },
    take: 50,
    select: { id: true, fullName: true, email: true, packageName: true, packageSlug: true, destination: true, reference: true },
  });

  const site = getSiteUrl();
  let sent = 0;
  for (const e of leads) {
    if (!e.email) continue;
    const first = e.fullName.split(" ")[0] || "there";
    const interest = e.packageName ?? e.destination ?? "your holiday";
    const cta = e.packageSlug
      ? { label: "View your holiday", href: `${site}/packages/${e.packageSlug}` }
      : { label: "Explore holidays", href: `${site}/packages` };
    const result = await sendEmail({
      to: e.email,
      replyTo: "support@expertztrip.com",
      subject: `Still planning ${interest}? We're here to help ✈️`,
      html: emailLayout(
        `Hi ${first}, still thinking about ${interest}?`,
        `We saw your enquiry${e.reference ? ` (<b>${e.reference}</b>)` : ""} and didn't want you to miss out.<br><br>
         Our travel experts can put together a tailored plan with clear, transparent pricing — no obligation. Just reply to this email or reach us on WhatsApp and we'll take it from there.<br><br>
         Warm regards,<br>Team ExpertzTrip`,
        cta,
      ),
    });
    // Mark as nudged whether or not the email provider succeeded, so a lead is
    // never emailed twice by successive cron runs.
    await db.enquiry.update({ where: { id: e.id }, data: { followUpEmailedAt: new Date() } }).catch(() => {});
    if (result.ok) sent += 1;
  }

  return NextResponse.json({ ok: true, considered: leads.length, sent }, { headers: { "Cache-Control": "no-store" } });
}

export const GET = handle;
export const POST = handle;
