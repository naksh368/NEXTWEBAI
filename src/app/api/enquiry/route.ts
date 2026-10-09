import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendEmail, emailLayout, businessNotifyEmail } from "@/lib/services/email";
import { getSiteUrl, makeReference } from "@/lib/utils";
import { clientIp, hit } from "@/lib/rate-limit";
import { getSiteSettings } from "@/lib/site-settings";

export const runtime = "nodejs";

const schema = z.object({
  fullName: z.string().min(1, "Please enter your name.").max(120),
  phone: z.string().min(6, "Please enter a valid phone number.").max(20),
  email: z.string().email().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  destination: z.string().max(160).optional(),
  packageSlug: z.string().max(200).optional(),
  packageName: z.string().max(200).optional(),
  travelDate: z.string().max(60).optional(),
  travellers: z.coerce.number().int().min(1).max(99).optional(),
  adults: z.coerce.number().int().min(0).max(99).optional(),
  children: z.coerce.number().int().min(0).max(99).optional(),
  nights: z.coerce.number().int().min(0).max(99).optional(),
  roomType: z.string().max(40).optional(),
  flightType: z.string().max(40).optional(),
  budget: z.string().max(60).optional(),
  bookingPlan: z.string().max(60).optional(),
  travelType: z.string().max(60).optional(),
  hotelCategory: z.string().max(40).optional(),
  preferredTime: z.string().max(40).optional(),
  wantsDiscount: z.boolean().optional(),
  message: z.string().max(2000).optional(),
  source: z.enum(["WEBSITE", "PACKAGE", "WHATSAPP"]).optional(),
  /** Privacy-notice consent. Required — we will not store a lead without it. */
  consent: z.literal(true, { errorMap: () => ({ message: "Please accept the privacy notice so we can contact you." }) }),
  /** Honeypot: a real person never fills a field they cannot see. */
  company: z.string().max(0).optional(),
});

// Per-address caps. Generous enough for a family filling several package
// forms, tight enough that a script gets nothing useful.
const RATE_LIMIT = 8;
const RATE_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const limit = hit(`enquiry:${clientIp(request)}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "You have sent several enquiries already. Please call or WhatsApp us and we will help straight away." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." }, { status: 422 });
  }

  const d = parsed.data;
  const reference = makeReference("ENQ");
  try {
    await db.enquiry.create({
      data: {
        reference,
        fullName: d.fullName,
        phone: d.phone,
        email: d.email ?? null,
        destination: d.destination ?? null,
        packageSlug: d.packageSlug ?? null,
        packageName: d.packageName ?? null,
        travelDate: d.travelDate ?? null,
        travellers: d.travellers ?? null,
        adults: d.adults ?? null,
        children: d.children ?? null,
        nights: d.nights ?? null,
        roomType: d.roomType ?? null,
        flightType: d.flightType ?? null,
        budget: d.budget ?? null,
        bookingPlan: d.bookingPlan ?? null,
        wantsDiscount: d.wantsDiscount ?? false,
        travelType: d.travelType ?? null,
        hotelCategory: d.hotelCategory ?? null,
        preferredTime: d.preferredTime ?? null,
        message: d.message ?? null,
        source: d.source ?? (d.packageSlug ? "PACKAGE" : "WEBSITE"),
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not submit right now. Please try WhatsApp or call us." }, { status: 500 });
  }

  const first = d.fullName.split(" ")[0] || "traveller";
  const site = getSiteUrl();
  const settings = await getSiteSettings().catch(() => null);
  const brand = settings?.brandName ?? "JST Andaman Travels";
  const travellersLine =
    d.adults || d.children
      ? [d.adults ? `${d.adults} Adult${d.adults > 1 ? "s" : ""}` : "", d.children ? `${d.children} Child${d.children > 1 ? "ren" : ""}` : ""].filter(Boolean).join(", ")
      : d.travellers ? `${d.travellers}` : "";
  const detailRows = [
    d.packageName ? `Holiday: <b>${d.packageName}</b>` : d.destination ? `Destination: <b>${d.destination}</b>` : "",
    d.travelDate ? `Travel date: <b>${d.travelDate}</b>` : "",
    travellersLine ? `Travellers: <b>${travellersLine}</b>` : "",
  ].filter(Boolean).join("<br>");

  // Customer enquiry-received email (non-blocking; only when an email was provided).
  if (d.email) {
    void sendEmail({
      to: d.email,
      subject: `We have received your ${brand} enquiry — ${reference}`,
      html: emailLayout(
        "Enquiry received",
        `Hi ${first}, thank you for your interest${d.packageName ? ` in <b>${d.packageName}</b>` : ""}.<br><br>Enquiry ID: <b>${reference}</b><br>${detailRows}${detailRows ? "<br>" : ""}<br>Your enquiry has been received. A ${brand} travel specialist will review your request and contact you using the details you provided, with an itinerary and a written quotation. An enquiry does not book or hold anything &mdash; nothing is confirmed until we confirm it with you in writing.`,
        d.packageSlug ? { label: "View the package", href: `${site}/packages/${d.packageSlug}` } : { label: "Explore packages", href: `${site}/packages` },
      ),
    }).catch(() => {});
  }

  // Internal business alert — goes to the company inbox only, with the customer's
  // address as Reply-To so the team can respond in one click. Never sends the
  // customer's details to an unrelated recipient.
  void sendEmail({
    to: businessNotifyEmail(),
    replyTo: d.email || undefined,
    subject: `🔔 New enquiry — ${d.packageName ?? d.destination ?? brand} — ${reference}`,
    html: emailLayout(
      "New enquiry received",
      `Enquiry ID: <b>${reference}</b><br>
       Customer: <b>${d.fullName}</b><br>
       Email: <b>${d.email ?? "—"}</b><br>
       Phone: <b>${d.phone}</b><br>
       ${d.packageName ? `Package: <b>${d.packageName}</b><br>` : d.destination ? `Destination: <b>${d.destination}</b><br>` : ""}
       ${d.travelDate ? `Travel date: <b>${d.travelDate}</b><br>` : ""}
       ${travellersLine ? `Travellers: <b>${travellersLine}</b><br>` : ""}
       ${d.budget ? `Budget: <b>${d.budget}</b><br>` : ""}
       ${d.bookingPlan ? `Plan: <b>${d.bookingPlan}</b><br>` : ""}
       ${d.message ? `<br>Message:<br>${d.message}` : ""}
       <br><br>Source: ${d.source ?? (d.packageSlug ? "PACKAGE" : "WEBSITE")}`,
      d.packageSlug ? { label: "Open the package", href: `${site}/packages/${d.packageSlug}` } : { label: "Open admin", href: `${site}/admin/enquiries` },
    ),
  }).catch(() => {});

  return NextResponse.json({ ok: true, reference }, { headers: { "Cache-Control": "no-store" } });
}
