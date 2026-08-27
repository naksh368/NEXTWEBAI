import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { generateOtp, hashOtp } from "@/lib/otp";
import { sendEmail, emailLayout } from "@/lib/services/email";
import { normalizeMobile } from "@/lib/services/otp-service";
import { BUSINESS_TYPE_VALUES } from "@/lib/agency";

export const runtime = "nodejs";

const OTP_TTL_MIN = 10;

/** Short, readable application reference, e.g. APP-7F3K9Q (server-only). */
function generateApplicationReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  const bytes = randomBytes(6);
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[bytes[i]! % alphabet.length];
  return `APP-${out}`;
}

// Full agency registration payload (spec §17). Mobile + all details are
// collected; verification is by EMAIL OTP only (no mobile OTP).
const schema = z.object({
  // Step 1 — applicant account
  fullName: z.string().trim().min(2, "Enter your full name.").max(120),
  email: z.string().trim().email("Enter a valid email address.").max(160),
  mobile: z.string().trim().min(6, "Enter your mobile number.").max(20),
  password: z.string().min(8, "Password must be at least 8 characters.").max(128),
  // Step 2 — agency
  agencyName: z.string().trim().min(2, "Enter your agency name.").max(160),
  businessType: z.enum(BUSINESS_TYPE_VALUES as [string, ...string[]], { message: "Choose a business type." }),
  officeAddress: z.string().trim().max(300).optional().or(z.literal("")),
  country: z.string().trim().max(80).default("India"),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  pincode: z.string().trim().max(12).optional().or(z.literal("")),
  // Step 3 — tax / KYC (optional at submission)
  pan: z.string().trim().max(15).optional().or(z.literal("")),
  gstin: z.string().trim().max(20).optional().or(z.literal("")),
  udyam: z.string().trim().max(30).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 422 });
  }
  const d = parsed.data;
  const email = d.email.toLowerCase();

  const mobile = normalizeMobile(d.mobile);
  if (!mobile) {
    return NextResponse.json({ ok: false, error: "Enter a valid mobile number." }, { status: 422 });
  }

  // Already registered? (email or mobile) — send them to sign in instead.
  const existing = await db.customer.findFirst({ where: { OR: [{ email }, { mobile }] }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ ok: false, error: "An account with this email or mobile already exists. Please sign in." }, { status: 409 });
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60_000);

  // Replace any prior pending signup + application for this email, then stage
  // both: the account (in EmailOtp) and the full agency application (PENDING_OTP).
  await db.emailOtp.deleteMany({ where: { email } });
  await db.agencyApplication.deleteMany({ where: { email, status: "PENDING_OTP" } });

  await db.emailOtp.create({
    data: { email, mobile, codeHash: hashOtp(code), fullName: d.fullName, passwordHash: hashPassword(d.password), expiresAt },
  });
  await db.agencyApplication.create({
    data: {
      reference: generateApplicationReference(),
      status: "PENDING_OTP",
      applicantName: d.fullName,
      email,
      mobile,
      agencyName: d.agencyName,
      businessType: d.businessType,
      officeAddress: d.officeAddress || null,
      country: d.country || "India",
      state: d.state || null,
      city: d.city || null,
      pincode: d.pincode || null,
      pan: d.pan ? d.pan.toUpperCase() : null,
      gstin: d.gstin ? d.gstin.toUpperCase() : null,
      udyam: d.udyam ? d.udyam.toUpperCase() : null,
    },
  });

  const sent = await sendEmail({
    to: email,
    subject: `${code} is your ExpertzTrip verification code`,
    html: emailLayout(
      "Verify your email",
      `<p>Welcome to ExpertzTrip — let's finish registering <b>${escapeHtml(d.agencyName)}</b>. Use this code to verify your email:</p>
       <div style="margin:16px 0;text-align:center">
         <span style="display:inline-block;background:#EEF1FE;border:1px solid #2340D9;border-radius:12px;padding:12px 22px;font-size:30px;font-weight:800;letter-spacing:8px;color:#2340D9">${code}</span>
       </div>
       <p>This code expires in ${OTP_TTL_MIN} minutes. Do not share this code with anyone. If you didn't request it, you can ignore this email.</p>`,
    ),
  });

  return NextResponse.json(
    { ok: true, ...(process.env.NODE_ENV !== "production" && !sent.ok ? { devHint: "Email not configured — check server console for the code." } : {}) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
