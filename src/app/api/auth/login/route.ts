import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { setCustomerCookie } from "@/lib/customer-session";

export const runtime = "nodejs";

const schema = z.object({
  identifier: z.string().min(1, "Enter your email or mobile number."),
  password: z.string().min(1, "Enter your password."),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 422 });
  }

  const { identifier, password } = parsed.data;
  const isEmail = identifier.includes("@");

  const customer = await db.customer.findFirst({
    where: isEmail ? { email: identifier.toLowerCase() } : { mobile: identifier },
    select: { id: true, passwordHash: true, status: true },
  });

  if (!customer || customer.status !== "ACTIVE" || !customer.passwordHash || !verifyPassword(password, customer.passwordHash)) {
    return NextResponse.json({ ok: false, error: "Incorrect email/mobile or password." }, { status: 401 });
  }

  await setCustomerCookie(customer.id);
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
