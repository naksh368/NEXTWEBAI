import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requestEmailOtp, normalizeEmail } from "@/lib/services/otp-service";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().email() });

/** Admin login step 1 — send an OTP only if the email is a registered admin. */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 422 });

  const email = normalizeEmail(parsed.data.email);
  // Never reveal whether an email is an admin — always respond ok.
  if (email) {
    const admin = await db.adminUser.findUnique({ where: { email }, select: { id: true, status: true } });
    if (admin && admin.status === "ACTIVE") {
      await requestEmailOtp(email);
    }
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
