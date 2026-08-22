import { NextResponse } from "next/server";
import { z } from "zod";
import { setAdminCookie } from "@/lib/admin-session";
import { tryAdminLogin } from "@/lib/services/admin-login";

export const runtime = "nodejs";

const schema = z.object({
  identifier: z.string().min(1, "Enter your email or mobile number."),
  password: z.string().min(1, "Enter your password."),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 422 });
  }

  // Single source of truth for admin credentials + provisioning (collision-safe,
  // never throws). This legacy endpoint signs in directly (no OTP step).
  const adminId = await tryAdminLogin(parsed.data.identifier, parsed.data.password);
  if (!adminId) {
    return NextResponse.json({ ok: false, error: "Invalid credentials." }, { status: 401 });
  }

  await setAdminCookie(adminId);
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
