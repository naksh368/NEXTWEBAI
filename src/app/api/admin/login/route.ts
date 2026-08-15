import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { setAdminCookie } from "@/lib/admin-session";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Enter your email and password." }, { status: 422 });

  const admin = await db.adminUser.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  // Constant-ish response — don't reveal whether the email exists.
  const valid = admin && admin.status === "ACTIVE" && verifyPassword(parsed.data.password, admin.passwordHash);
  if (!admin || !valid) {
    return NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 401 });
  }

  await db.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  await setAdminCookie(admin.id);
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
