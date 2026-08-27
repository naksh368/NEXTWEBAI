import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyOtp } from "@/lib/otp";
import { setCustomerCookie } from "@/lib/customer-session";
import { sendEmail, emailLayout, businessNotifyEmail } from "@/lib/services/email";
import { businessTypeLabel } from "@/lib/agency";
import { getSiteUrl } from "@/lib/utils";

export const runtime = "nodejs";

const MAX_ATTEMPTS = 5;

const schema = z.object({
  email: z.string().email().max(160),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 422 });
  }
  const email = parsed.data.email.toLowerCase();

  const otp = await db.emailOtp.findFirst({ where: { email, consumedAt: null }, orderBy: { createdAt: "desc" } });
  if (!otp) return NextResponse.json({ ok: false, error: "No pending verification. Please start again." }, { status: 404 });
  if (otp.expiresAt < new Date()) return NextResponse.json({ ok: false, error: "This code has expired. Please request a new one." }, { status: 410 });
  if (otp.attempts >= MAX_ATTEMPTS) return NextResponse.json({ ok: false, error: "Too many attempts. Please request a new code." }, { status: 429 });

  if (!verifyOtp(parsed.data.code, otp.codeHash)) {
    await db.emailOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return NextResponse.json({ ok: false, error: "Incorrect code. Please try again." }, { status: 401 });
  }

  // Guard against a race where the email got registered meanwhile.
  const existing = await db.customer.findFirst({ where: { email }, select: { id: true } });
  if (existing) {
    await db.emailOtp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
    return NextResponse.json({ ok: false, error: "An account with this email already exists. Please sign in." }, { status: 409 });
  }

  // Create the agent account (email-verified) and consume the OTP.
  const customer = await db.customer.create({
    data: { email, mobile: otp.mobile ?? undefined, fullName: otp.fullName, passwordHash: otp.passwordHash, isVerified: true },
    select: { id: true },
  });
  await db.emailOtp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });

  // Attach the account to the staged application and mark it submitted.
  const application = await db.agencyApplication.findFirst({
    where: { email, status: "PENDING_OTP" },
    orderBy: { createdAt: "desc" },
  });
  if (application) {
    await db.agencyApplication.update({
      where: { id: application.id },
      data: { status: "SUBMITTED", customerId: customer.id, submittedAt: new Date() },
    });
  }
  await setCustomerCookie(customer.id);

  // Best-effort notifications (never block registration).
  await notifyApplicant(email, otp.fullName, application?.reference ?? null, application?.agencyName ?? null).catch(() => {});
  await notifyAdmin(application, email, otp.fullName, otp.mobile ?? null).catch(() => {});

  return NextResponse.json(
    { ok: true, reference: application?.reference ?? null, redirect: "/dashboard" },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** Welcome email — application received, NOT approved (spec §24). */
async function notifyApplicant(email: string, name: string, reference: string | null, agencyName: string | null) {
  const first = (name || "there").split(" ")[0];
  await sendEmail({
    to: email,
    subject: "Welcome to ExpertzTrip — Application Received",
    html: emailLayout(
      `Welcome, ${escapeHtml(first)}!`,
      `<p>Thanks for registering ${agencyName ? `<b>${escapeHtml(agencyName)}</b>` : "your agency"} on ExpertzTrip. We've received your application and our team will review it shortly.</p>
       ${reference ? `<p>Your application reference is <b>${escapeHtml(reference)}</b> — keep it for your records.</p>` : ""}
       <p><b>Current status:</b> Submitted — pending review.</p>
       <p>You can sign in any time to check your status. We'll email you again once your agency is approved.</p>`,
      { label: "Go to your dashboard", href: `${getSiteUrl()}/dashboard` },
    ),
  });
}

/** Admin alert for every new agency submission (spec §23). */
async function notifyAdmin(
  application: { reference: string; agencyName: string; businessType: string; officeAddress: string | null; city: string | null; state: string | null } | null,
  email: string,
  applicantName: string,
  mobile: string | null,
) {
  const to = businessNotifyEmail();
  const ref = application?.reference ?? "—";
  const agency = application?.agencyName ?? "—";
  const rows: [string, string][] = [
    ["Agency Name", agency],
    ["Applicant Name", applicantName],
    ["Email", email],
    ["Mobile", mobile ?? "—"],
    ["Business Type", application ? businessTypeLabel(application.businessType) : "—"],
    ["Location", [application?.city, application?.state].filter(Boolean).join(", ") || "—"],
    ["Application ID", ref],
    ["Submitted At", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })],
    ["Status", "Submitted — pending review"],
  ];
  const table = rows
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#8A8F9E;font-size:13px">${k}</td><td style="padding:4px 0;font-weight:700;font-size:14px">${escapeHtml(v)}</td></tr>`)
    .join("");
  await sendEmail({
    to,
    subject: `New Agency Registration — ${agency}`,
    html: emailLayout(
      "New agency registration",
      `<p>A new travel agency has submitted a registration on ExpertzTrip.</p>
       <table role="presentation" style="margin:8px 0 4px">${table}</table>`,
      { label: "Review Application", href: `${getSiteUrl()}/admin` },
    ),
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
