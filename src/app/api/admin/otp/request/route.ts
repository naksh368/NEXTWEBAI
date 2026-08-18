import { NextResponse } from "next/server";

export const runtime = "nodejs";

// OTP login removed — admin now uses email/mobile + password via /api/admin/login
export async function POST() {
  return NextResponse.json({ ok: false, error: "OTP login removed. Use /api/admin/login." }, { status: 410 });
}
