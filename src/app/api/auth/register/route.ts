import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { setCustomerCookie } from "@/lib/customer-session";

export const runtime = "nodejs";

const schema = z.object({
  fullName: z.string().min(1, "Enter your full name."),
  identifier: z.string().min(1, "Enter your email or mobile number."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 422 });
  }

  const { fullName, identifier, password } = parsed.data;
  const isEmail = identifier.includes("@");
  const email = isEmail ? identifier.toLowerCase() : null;
  const mobile = isEmail ? null : identifier;

  // Check if already exists
  const existing = await db.customer.findFirst({
    where: isEmail ? { email } : { mobile },
  });
  if (existing) {
    return NextResponse.json({ ok: false, error: "An account with this email/mobile already exists. Please sign in." }, { status: 409 });
  }

  const customer = await db.customer.create({
    data: { fullName, email, mobile, passwordHash: hashPassword(password), isVerified: false },
    select: { id: true },
  });

  await setCustomerCookie(customer.id);
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
