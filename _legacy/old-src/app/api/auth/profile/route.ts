import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentCustomer } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  fullName: z.string().optional(),
  email: z.string().email().nullable().optional(),
  mobile: z.string().nullable().optional(),
});

export async function PATCH(request: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid data." }, { status: 422 });

  const { fullName, email, mobile } = parsed.data;

  await db.customer.update({
    where: { id: customer.id },
    data: {
      ...(fullName !== undefined && { fullName }),
      ...(email !== undefined && { email: email?.toLowerCase() ?? null }),
      ...(mobile !== undefined && { mobile: mobile ?? null }),
    },
  });

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
