import { NextResponse } from "next/server";
import { z } from "zod";
import { requestEmailOtp } from "@/lib/services/otp-service";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 422 });

  const result = await requestEmailOtp(parsed.data.email);
  return NextResponse.json(result, { status: result.ok ? 200 : 429, headers: { "Cache-Control": "no-store" } });
}
