import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionCustomerId } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const customerId = await getSessionCustomerId();
  if (!customerId) return NextResponse.json({ ok: false, customer: null }, { status: 200 });

  const customer = await db.customer.findUnique({
    where: { id: customerId },
    select: { id: true, mobile: true, email: true, fullName: true, isVerified: true },
  });
  return NextResponse.json({ ok: true, customer }, { headers: { "Cache-Control": "no-store" } });
}
