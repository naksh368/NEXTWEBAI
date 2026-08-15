import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionCustomerId } from "@/lib/session";
import { createBooking } from "@/lib/services/booking-service";

export const runtime = "nodejs";

const travellerSchema = z.object({
  fullName: z.string().min(2).max(80),
  type: z.enum(["ADULT", "CHILD", "INFANT"]).optional(),
  dateOfBirth: z.string().nullable().optional(),
  passportNo: z.string().max(30).nullable().optional(),
});

const schema = z.object({
  versionId: z.string().min(1),
  travellerCount: z.number().int().min(1).max(99),
  selectedOptionIds: z.array(z.string()).default([]),
  departureId: z.string().nullable().optional(),
  couponCode: z.string().max(40).nullable().optional(),
  travellers: z.array(travellerSchema).min(1),
  termsAccepted: z.literal(true, { errorMap: () => ({ message: "You must accept the terms." }) }),
});

export async function POST(request: Request) {
  const customerId = await getSessionCustomerId();
  if (!customerId) return NextResponse.json({ ok: false, error: "Please sign in to book." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid booking request." }, { status: 422 });
  }

  const result = await createBooking({
    customerId,
    versionId: parsed.data.versionId,
    travellerCount: parsed.data.travellers.length,
    selectedOptionIds: parsed.data.selectedOptionIds,
    departureId: parsed.data.departureId,
    couponCode: parsed.data.couponCode,
    travellers: parsed.data.travellers,
  });

  if (!result.ok) return NextResponse.json(result, { status: 409 });
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
