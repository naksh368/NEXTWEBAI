import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionCustomerId } from "@/lib/session";
import { createBooking } from "@/lib/services/booking-service";

export const runtime = "nodejs";

// Traveller details collected at booking. Passport fields are optional —
// they are only required for international trips (enforced in the UI); domestic
// (India) trips submit them empty.
const optionalStr = z.string().max(60).optional().default("");
const travellerSchema = z.object({
  title: z.enum(["MR", "MS", "MRS"]),
  givenName: z.string().min(1).max(60),
  surname: z.string().min(1).max(60),
  dateOfBirth: z.string().min(8).max(10),
  passportNo: optionalStr,
  passportExpiry: optionalStr,
  passportIssueDate: optionalStr,
  passportIssueCity: optionalStr,
  passportIssueCountry: optionalStr,
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
  travellerBreakdown: z.object({
    adults: z.number().int().min(1).max(99),
    children: z.number().int().min(0).max(99),
    childrenAges: z.array(z.number().int().min(0).max(17)).max(99),
    infants: z.number().int().min(0).max(99),
    rooms: z.number().int().min(1).max(30),
  }).nullable().optional(),
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
    travellerBreakdown: parsed.data.travellerBreakdown ?? null,
  });

  if (!result.ok) return NextResponse.json(result, { status: 409 });
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
