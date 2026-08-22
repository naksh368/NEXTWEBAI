import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { setAdminCookie } from "@/lib/admin-session";
import { tryAdminLogin } from "@/lib/services/admin-login";
import { setCustomerCookie } from "@/lib/customer-session";
import { generateOtp, hashOtp } from "@/lib/otp";
import { sendEmail, emailLayout, isEmailConfigured } from "@/lib/services/email";

export const runtime = "nodejs";

const schema = z.object({
  identifier: z.string().min(1, "Enter your email."),
  password: z.string().min(1, "Enter your password."),
  redirect: z.string().max(512).optional(),
});

const OTP_TTL_MIN = 10;

function safeRedirect(raw?: string): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/account";
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 422 });
  }
  const { identifier, password } = parsed.data;

  // Admin credentials → email OTP as well (falls back to direct login if email
  // isn't configured or the send fails, so the admin is never locked out).
  const adminId = await tryAdminLogin(identifier, password);
  if (adminId) {
    const admin = await db.adminUser.findUnique({ where: { id: adminId }, select: { email: true } });
    const adminEmail = (admin?.email ?? identifier).toLowerCase();

    if (!isEmailConfigured()) {
      await setAdminCookie(adminId);
      return NextResponse.json({ ok: true, step: "done", redirect: "/admin", role: "admin" }, { headers: { "Cache-Control": "no-store" } });
    }

    // OTP is best-effort: any failure (send error OR a DB/schema hiccup) must
    // sign the admin in directly rather than lock them out or 500 the request.
    try {
      const code = generateOtp();
      await db.loginOtp.deleteMany({ where: { adminUserId: adminId } });
      await db.loginOtp.create({ data: { adminUserId: adminId, email: adminEmail, codeHash: hashOtp(code), expiresAt: new Date(Date.now() + OTP_TTL_MIN * 60_000) } });
      const sent = await sendEmail({
        to: adminEmail,
        subject: `${code} is your ExpertzTrip admin login code`,
        html: emailLayout(
          "Your admin login code",
          `<p>Use this code to finish signing in to the ExpertzTrip admin:</p>
           <div style="margin:16px 0;text-align:center">
             <span style="display:inline-block;background:#EEF1FE;border:1px solid #2340D9;border-radius:12px;padding:12px 22px;font-size:30px;font-weight:800;letter-spacing:8px;color:#2340D9">${code}</span>
           </div>
           <p>This code expires in ${OTP_TTL_MIN} minutes. If this wasn't you, ignore this email.</p>`,
        ),
      });
      if (!sent.ok) {
        await db.loginOtp.deleteMany({ where: { adminUserId: adminId } }).catch(() => {});
        await setAdminCookie(adminId);
        return NextResponse.json({ ok: true, step: "done", redirect: "/admin", role: "admin" }, { headers: { "Cache-Control": "no-store" } });
      }
      return NextResponse.json({ ok: true, step: "otp", email: adminEmail, role: "admin" }, { headers: { "Cache-Control": "no-store" } });
    } catch (e) {
      console.error("[login] admin OTP step failed, signing in directly:", e);
      await setAdminCookie(adminId);
      return NextResponse.json({ ok: true, step: "done", redirect: "/admin", role: "admin" }, { headers: { "Cache-Control": "no-store" } });
    }
  }

  const email = identifier.trim().toLowerCase();
  const customer = await db.customer.findFirst({ where: { email }, select: { id: true, passwordHash: true, status: true, email: true } });

  // No account for this email → tell the customer to create one (not "wrong password").
  if (!customer) {
    return NextResponse.json({ ok: false, code: "NO_ACCOUNT", error: "We couldn't find an account with that email." }, { status: 404 });
  }
  if (customer.status !== "ACTIVE" || !customer.passwordHash || !verifyPassword(password, customer.passwordHash)) {
    return NextResponse.json({ ok: false, error: "Incorrect password. Please try again." }, { status: 401 });
  }

  // Safeguard: only enforce the email OTP step when email actually works —
  // otherwise a provider outage would lock every customer out. If email isn't
  // configured, or the code send fails, sign in directly (password verified).
  if (!isEmailConfigured()) {
    await setCustomerCookie(customer.id);
    return NextResponse.json({ ok: true, step: "done", redirect: safeRedirect(parsed.data.redirect), role: "customer" }, { headers: { "Cache-Control": "no-store" } });
  }

  // OTP is best-effort: any failure (send error OR a DB/schema hiccup) signs the
  // customer in directly (password already verified) rather than 500 or lock out.
  try {
    const code = generateOtp();
    await db.loginOtp.deleteMany({ where: { customerId: customer.id } });
    await db.loginOtp.create({ data: { customerId: customer.id, email, codeHash: hashOtp(code), expiresAt: new Date(Date.now() + OTP_TTL_MIN * 60_000) } });

    const sent = await sendEmail({
      to: email,
      subject: `${code} is your ExpertzTrip login code`,
      html: emailLayout(
        "Your login code",
        `<p>Use this code to finish signing in to ExpertzTrip:</p>
         <div style="margin:16px 0;text-align:center">
           <span style="display:inline-block;background:#EEF1FE;border:1px solid #2340D9;border-radius:12px;padding:12px 22px;font-size:30px;font-weight:800;letter-spacing:8px;color:#2340D9">${code}</span>
         </div>
         <p>This code expires in ${OTP_TTL_MIN} minutes. If you didn't try to sign in, you can ignore this email.</p>`,
      ),
    });

    if (!sent.ok) {
      await db.loginOtp.deleteMany({ where: { customerId: customer.id } }).catch(() => {});
      await setCustomerCookie(customer.id);
      return NextResponse.json({ ok: true, step: "done", redirect: safeRedirect(parsed.data.redirect), role: "customer" }, { headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({ ok: true, step: "otp", email }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[login] customer OTP step failed, signing in directly:", e);
    await setCustomerCookie(customer.id);
    return NextResponse.json({ ok: true, step: "done", redirect: safeRedirect(parsed.data.redirect), role: "customer" }, { headers: { "Cache-Control": "no-store" } });
  }
}
