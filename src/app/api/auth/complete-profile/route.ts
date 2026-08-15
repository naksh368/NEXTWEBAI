import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionCustomerId } from "@/lib/session";

export const runtime = "nodejs";

// Email is mandatory (Phase 12) — needed for e-tickets, invoices, documents.
const schema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email(),
});

export async function POST(request: Request) {
  const customerId = await getSessionCustomerId();
  if (!customerId) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "A valid name and email are required." }, { status: 422 });

  // Guard against email collision with a different account.
  const existing = await db.customer.findUnique({ where: { email: parsed.data.email } });
  if (existing && existing.id !== customerId) {
    return NextResponse.json({ ok: false, error: "That email is already in use." }, { status: 409 });
  }

  await db.customer.update({
    where: { id: customerId },
    data: { fullName: parsed.data.fullName, email: parsed.data.email },
  });

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
