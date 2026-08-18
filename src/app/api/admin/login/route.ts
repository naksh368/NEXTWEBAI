import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { setAdminCookie } from "@/lib/admin-session";

export const runtime = "nodejs";

// Hardcoded admin credentials — change these via env vars in production.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@expertztrip.com";
const ADMIN_MOBILE = process.env.ADMIN_MOBILE || "8700650467";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Ashok@84";

const schema = z.object({
  identifier: z.string().min(1, "Enter your email or mobile number."),
  password: z.string().min(1, "Enter your password."),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 422 });
  }

  const { identifier, password } = parsed.data;
  const identifierLower = identifier.trim().toLowerCase();
  const matchesEmail = identifierLower === ADMIN_EMAIL.toLowerCase();
  const matchesMobile = identifier.trim() === ADMIN_MOBILE;

  if ((!matchesEmail && !matchesMobile) || password !== ADMIN_PASSWORD) {
    // Constant-time-ish: always run both checks before returning
    return NextResponse.json({ ok: false, error: "Invalid credentials." }, { status: 401 });
  }

  // Ensure admin row exists in DB (auto-provision on first login)
  const admin = await db.adminUser.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      mobile: ADMIN_MOBILE,
      fullName: "Admin",
      passwordHash: hashPassword(ADMIN_PASSWORD),
      status: "ACTIVE",
    },
    update: { lastLoginAt: new Date() },
    select: { id: true },
  });

  await setAdminCookie(admin.id);
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
