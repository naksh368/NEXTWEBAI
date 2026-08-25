"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { authorize } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/services/audit-service";
import { sendEmail, emailLayout } from "@/lib/services/email";
import { getSiteUrl, makeReference, formatINR } from "@/lib/utils";

type ActionResult = { ok: true } | { ok: false; error: string };

const num = (v: FormDataEntryValue | null, d = 0) => {
  const n = Number(String(v ?? "").replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : d;
};
const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s || null;
};

/** Create a DRAFT quote (optionally from an enquiry / for a package). */
export async function createQuoteAction(formData: FormData): Promise<void> {
  const admin = await authorize("booking.update");
  if (!admin) return;

  const packageId = str(formData.get("packageId"));
  let packageVersionId: string | null = null;
  let title = str(formData.get("title")) ?? "Custom holiday quote";
  if (packageId) {
    const pkg = await db.package.findUnique({ where: { id: packageId }, select: { name: true, currentVersionId: true, currentVersion: { select: { durationNights: true, durationDays: true } } } });
    if (pkg) {
      packageVersionId = pkg.currentVersionId ?? null;
      if (!str(formData.get("title"))) title = `${pkg.name}${pkg.currentVersion ? ` — ${pkg.currentVersion.durationNights}N / ${pkg.currentVersion.durationDays}D` : ""}`;
    }
  }

  const amount = num(formData.get("amount"));
  const validDays = num(formData.get("validDays"), 7);
  const customerName = str(formData.get("customerName")) ?? "Traveller";

  const quote = await db.quote.create({
    data: {
      reference: makeReference("QUO"),
      enquiryId: str(formData.get("enquiryId")),
      packageId,
      packageVersionId,
      customerName,
      customerEmail: str(formData.get("customerEmail")),
      customerPhone: str(formData.get("customerPhone")),
      title,
      travellerCount: Math.max(1, num(formData.get("travellerCount"), 2)),
      travelDate: str(formData.get("travelDate")),
      departureCity: str(formData.get("departureCity")),
      amount,
      notes: str(formData.get("notes")),
      status: "DRAFT",
      validUntil: validDays > 0 ? new Date(Date.now() + validDays * 86400_000) : null,
      createdById: admin.id,
      items: { create: [{ label: "Holiday package (as quoted)", amount, sortOrder: 0 }] },
    },
    select: { id: true },
  });

  await writeAudit({ adminUserId: admin.id, action: "quote.create", resource: `Quote:${quote.id}`, after: { amount, packageId } });
  revalidatePath("/admin/quotes");
  redirect("/admin/quotes");
}

/** Send a quote to the customer by email + mark it SENT. */
export async function sendQuoteAction(quoteId: string): Promise<ActionResult> {
  const admin = await authorize("booking.update");
  if (!admin) return { ok: false, error: "Not authorized." };

  const quote = await db.quote.findUnique({ where: { id: quoteId } });
  if (!quote) return { ok: false, error: "Quote not found." };
  if (!quote.customerEmail) return { ok: false, error: "This quote has no customer email to send to." };

  const site = getSiteUrl();
  const sent = await sendEmail({
    to: quote.customerEmail,
    subject: `Your ExpertzTrip holiday quote — ${quote.reference}`,
    html: emailLayout(
      "Your personalized holiday quote is ready",
      `Hi ${quote.customerName.split(" ")[0]}, here is your personalized quote from ExpertzTrip.<br><br>
       Quote ID: <b>${quote.reference}</b><br>
       Holiday: <b>${quote.title}</b><br>
       Travellers: <b>${quote.travellerCount}</b><br>
       ${quote.travelDate ? `Travel date: <b>${quote.travelDate}</b><br>` : ""}
       ${quote.departureCity ? `From: <b>${quote.departureCity}</b><br>` : ""}
       Total: <b>${formatINR(quote.amount)}</b>${quote.validUntil ? `<br>Valid until: <b>${quote.validUntil.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</b>` : ""}
       ${quote.notes ? `<br><br>${quote.notes}` : ""}`,
      { label: "View & accept your quote", href: `${site}/quote/${quote.id}` },
    ),
  });
  if (!sent.ok) return { ok: false, error: `Couldn't send the email: ${sent.error ?? "unknown error"}` };

  await db.quote.update({ where: { id: quoteId }, data: { status: "SENT" } });
  if (quote.enquiryId) await db.enquiry.update({ where: { id: quote.enquiryId }, data: { status: "QUOTE_SENT" } }).catch(() => {});
  await writeAudit({ adminUserId: admin.id, action: "quote.send", resource: `Quote:${quoteId}`, after: { to: quote.customerEmail } });
  revalidatePath("/admin/quotes");
  return { ok: true };
}
