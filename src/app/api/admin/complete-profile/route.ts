import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

const schema = z.object({ fullName: z.string().min(2).max(80), email: z.string().email() });

/** First-login admin profile — set the admin's name and email. */
export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "A valid name and email are required." }, { status: 422 });

  const existing = await db.adminUser.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existing && existing.id !== admin.id) {
    return NextResponse.json({ ok: false, error: "That email is already in use." }, { status: 409 });
  }

  await db.adminUser.update({ where: { id: admin.id }, data: { fullName: parsed.data.fullName, email: parsed.data.email.toLowerCase() } });
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
