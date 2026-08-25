import { NextResponse } from "next/server";

export const runtime = "nodejs";

// OTP auth is now handled by Clerk — this route is kept for compatibility.
export async function POST() {
  return NextResponse.json({ ok: false, error: "Auth is now handled by Clerk." }, { status: 410 });
}
