import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/lib/services/otp-service";
import { setSessionCookie } from "@/lib/session";

export const runtime = "nodejs";

const schema = z.object({ mobile: z.string().min(6).max(20), code: z.string().length(6) });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Enter the 6-digit code." }, { status: 422 });

  const result = await verifyOtp(parsed.data.mobile, parsed.data.code);
  if (!result.ok) return NextResponse.json(result, { status: 401, headers: { "Cache-Control": "no-store" } });

  await setSessionCookie(result.customerId);
  return NextResponse.json(
    { ok: true, profileComplete: result.profileComplete },
    { headers: { "Cache-Control": "no-store" } }
  );
}
