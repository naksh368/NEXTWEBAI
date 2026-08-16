import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requestOtp, normalizeMobile } from "@/lib/services/otp-service";

export const runtime = "nodejs";

const schema = z.object({ mobile: z.string().min(6).max(20) });

/** Admin login step 1 — send an OTP only if the number is a registered admin. */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Enter a valid mobile number." }, { status: 422 });

  const mobile = normalizeMobile(parsed.data.mobile);
  // Never reveal whether a number is an admin — always respond ok.
  if (mobile) {
    const admin = await db.adminUser.findUnique({ where: { mobile }, select: { id: true, status: true } });
    if (admin && admin.status === "ACTIVE") {
      await requestOtp(mobile);
    }
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
