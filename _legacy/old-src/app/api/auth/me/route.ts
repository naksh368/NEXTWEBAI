import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ customer: null });
  return NextResponse.json({ customer }, { headers: { "Cache-Control": "no-store" } });
}
