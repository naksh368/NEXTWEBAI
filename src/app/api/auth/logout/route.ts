import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Sign-out is handled by Clerk directly — this route is kept for compatibility.
export async function POST() {
  return NextResponse.json({ ok: true });
}
