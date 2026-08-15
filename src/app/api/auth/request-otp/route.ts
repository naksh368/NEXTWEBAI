import { NextResponse } from "next/server";
import { z } from "zod";
import { requestOtp } from "@/lib/services/otp-service";

export const runtime = "nodejs";

const schema = z.object({ mobile: z.string().min(6).max(20) });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Enter a valid mobile number." }, { status: 422 });

  const result = await requestOtp(parsed.data.mobile);
  return NextResponse.json(result, { status: result.ok ? 200 : 429, headers: { "Cache-Control": "no-store" } });
}
