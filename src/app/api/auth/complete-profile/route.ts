import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionCustomerId } from "@/lib/session";
import { emitEvent } from "@/lib/services/notifications";
import { normalizeMobile } from "@/lib/services/otp-service";

export const runtime = "nodejs";

// Email is already set at login (it's the login identifier). Here we collect
// the customer's name, and optionally a mobile number for contact.
const schema = z.object({
  fullName: z.string().min(2).max(80),
  mobile: z.string().max(20).optional(),
});

export async function POST(request: Request) {
  const customerId = await getSessionCustomerId();
  if (!customerId) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "A valid name is required." }, { status: 422 });

  // Optional mobile — validate + guard against collision with another account.
  let mobile: string | null | undefined = undefined;
  if (parsed.data.mobile && parsed.data.mobile.trim()) {
    mobile = normalizeMobile(parsed.data.mobile);
    if (!mobile) return NextResponse.json({ ok: false, error: "Enter a valid mobile number." }, { status: 422 });
    const clash = await db.customer.findUnique({ where: { mobile } });
    if (clash && clash.id !== customerId) {
      return NextResponse.json({ ok: false, error: "That mobile number is already in use." }, { status: 409 });
    }
  }

  const before = await db.customer.findUnique({ where: { id: customerId }, select: { fullName: true } });

  await db.customer.update({
    where: { id: customerId },
    data: { fullName: parsed.data.fullName, ...(mobile ? { mobile } : {}) },
  });

  // Welcome (email + in-app) once, when the profile is first completed.
  if (!before?.fullName) {
    await emitEvent({ event: "USER_REGISTERED", customerId, dedupeKey: `USER_REGISTERED:${customerId}` });
  }

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
