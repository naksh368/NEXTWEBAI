import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { setCustomerCookie } from "@/lib/customer-session";
import { setAdminCookie } from "@/lib/admin-session";
import { tryAdminLogin } from "@/lib/services/admin-login";

export const runtime = "nodejs";

const schema = z.object({
  identifier: z.string().min(1, "Enter your email or mobile number."),
  password: z.string().min(1, "Enter your password."),
  redirect: z.string().max(512).optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 422 });
  }

  const { identifier, password, redirect } = parsed.data;

  // ONE login page. The backend decides the role: admin credentials land in the
  // Admin Dashboard, everyone else in their customer account / My Trips.
  const adminId = await tryAdminLogin(identifier, password);
  if (adminId) {
    await setAdminCookie(adminId);
    return NextResponse.json({ ok: true, redirect: "/admin", role: "admin" }, { headers: { "Cache-Control": "no-store" } });
  }

  const isEmail = identifier.includes("@");
  const customer = await db.customer.findFirst({
    where: isEmail ? { email: identifier.toLowerCase() } : { mobile: identifier.trim() },
    select: { id: true, passwordHash: true, status: true },
  });

  if (!customer || customer.status !== "ACTIVE" || !customer.passwordHash || !verifyPassword(password, customer.passwordHash)) {
    return NextResponse.json({ ok: false, error: "Incorrect email/mobile or password." }, { status: 401 });
  }

  await setCustomerCookie(customer.id);
  // Only allow internal (same-site) redirects.
  const safeRedirect = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/account";
  return NextResponse.json({ ok: true, redirect: safeRedirect, role: "customer" }, { headers: { "Cache-Control": "no-store" } });
}
