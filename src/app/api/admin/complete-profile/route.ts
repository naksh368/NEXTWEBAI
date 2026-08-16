import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

// Email is the admin's login identifier (already set). Here we set the name.
const schema = z.object({ fullName: z.string().min(2).max(80) });

/** First-login admin profile — set the admin's display name. */
export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "A valid name is required." }, { status: 422 });

  await db.adminUser.update({ where: { id: admin.id }, data: { fullName: parsed.data.fullName } });
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
