import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionCustomerId } from "@/lib/session";
import { createBooking } from "@/lib/services/booking-service";

export const runtime = "nodejs";

const optionalStr = z.string().max(60).optional().default("");
const travellerSchema = z.object({
  title: z.enum(["MR", "MS", "MRS"]),
  givenName: z.string().min(1).max(60),
  surname: z.string().min(1).max(60),
  dateOfBirth: z.string().min(8).max(10).refine((s) => { const d = new Date(s); return !Number.isNaN(d.getTime()) && d <= new Date(); }, "Date of birth cannot be in the future."),
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
  travellers: z.array(travellerSchema).min(1),
  termsAccepted: z.literal(true, { errorMap: () => ({ message: "You must accept the terms." }) }),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const customerId = await getSessionCustomerId();
  if (!customerId) return NextResponse.json({ ok: false, error: "Please sign in to accept this quote." }, { status: 401 });

  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 422 });
  }

  const quote = await db.quote.findUnique({ where: { id } });
  if (!quote) return NextResponse.json({ ok: false, error: "Quote not found." }, { status: 404 });
  if (quote.bookingId) return NextResponse.json({ ok: false, error: "This quote has already been booked." }, { status: 409 });
  if (!["SENT", "DRAFT", "ACCEPTED"].includes(quote.status)) return NextResponse.json({ ok: false, error: "This quote can no longer be accepted." }, { status: 409 });
  if (quote.validUntil && quote.validUntil < new Date()) return NextResponse.json({ ok: false, error: "This quote has expired. Please ask us for a fresh quote." }, { status: 410 });
  if (!quote.packageVersionId) return NextResponse.json({ ok: false, error: "This quote isn't linked to a bookable package — please contact us to book." }, { status: 409 });

  // Server-authoritative: the price comes from the stored quote, never the client.
  const result = await createBooking({
    customerId,
    versionId: quote.packageVersionId,
    travellerCount: parsed.data.travellers.length,
    selectedOptionIds: [],
    travelDate: null,
    departureCity: quote.departureCity ?? null,
    couponCode: null,
    overrideTotal: quote.amount,
    quoteId: quote.id,
    travellers: parsed.data.travellers.map((t) => ({ ...t, fullName: `${t.givenName} ${t.surname}`.trim() })),
  });

  if (!result.ok) return NextResponse.json(result, { status: 409 });
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
