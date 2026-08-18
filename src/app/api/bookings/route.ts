import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionCustomerId } from "@/lib/session";
import { createBooking } from "@/lib/services/booking-service";

export const runtime = "nodejs";

// Mandatory traveller details collected at booking.
const travellerSchema = z.object({
  title: z.enum(["MR", "MS", "MRS"]),
  givenName: z.string().min(1).max(60),
  surname: z.string().min(1).max(60),
  dateOfBirth: z.string().min(8).max(10),
  passportNo: z.string().min(4).max(30),
  passportExpiry: z.string().min(8).max(10),
  passportIssueDate: z.string().min(8).max(10),
  passportIssueCity: z.string().min(1).max(60),
  passportIssueCountry: z.string().min(1).max(60),
  panNumber: z.string().trim().toUpperCase().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Enter a valid 10-character PAN."),
  mealPreference: z.enum(["VEG", "NON_VEG"]),
  type: z.enum(["ADULT", "CHILD", "INFANT"]).optional(),
});

const schema = z.object({
  versionId: z.string().min(1),
  travellerCount: z.number().int().min(1).max(99),
  selectedOptionIds: z.array(z.string()).default([]),
  departureId: z.string().nullable().optional(),
  travelDate: z.string().min(8).max(10).nullable().optional(), // YYYY-MM-DD from the calendar
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
    travelDate: parsed.data.travelDate,
    couponCode: parsed.data.couponCode,
    travellers: parsed.data.travellers.map((t) => ({
      ...t,
      fullName: `${t.givenName} ${t.surname}`.trim(),
    })),
  });

  if (!result.ok) return NextResponse.json(result, { status: 409 });
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
