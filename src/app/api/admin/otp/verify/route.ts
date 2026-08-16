import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyEmailOtpCode, normalizeEmail } from "@/lib/services/otp-service";
import { setAdminCookie } from "@/lib/admin-session";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().email(), code: z.string().length(6) });

/** Admin login step 2 — verify OTP and open an admin session if the email is an admin. */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Enter the 6-digit code." }, { status: 422 });

  const email = normalizeEmail(parsed.data.email);
  if (!email) return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 422 });

  const admin = await db.adminUser.findUnique({ where: { email }, select: { id: true, status: true, fullName: true } });
  if (!admin || admin.status !== "ACTIVE") {
    return NextResponse.json({ ok: false, error: "This email doesn't have admin access." }, { status: 403 });
  }

  const res = await verifyEmailOtpCode(email, parsed.data.code);
  if (!res.ok) return NextResponse.json(res, { status: 401 });

  await db.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  await setAdminCookie(admin.id);

  const profileComplete = Boolean(admin.fullName && admin.fullName !== "Admin");
  return NextResponse.json({ ok: true, profileComplete }, { headers: { "Cache-Control": "no-store" } });
}
