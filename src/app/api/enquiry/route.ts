import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  fullName: z.string().min(1, "Please enter your name.").max(120),
  phone: z.string().min(6, "Please enter a valid phone number.").max(20),
  email: z.string().email().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  destination: z.string().max(160).optional(),
  packageSlug: z.string().max(200).optional(),
  packageName: z.string().max(200).optional(),
  travelDate: z.string().max(60).optional(),
  travellers: z.coerce.number().int().min(1).max(99).optional(),
  adults: z.coerce.number().int().min(0).max(99).optional(),
  children: z.coerce.number().int().min(0).max(99).optional(),
  nights: z.coerce.number().int().min(0).max(99).optional(),
  roomType: z.string().max(40).optional(),
  flightType: z.string().max(40).optional(),
  budget: z.string().max(60).optional(),
  bookingPlan: z.string().max(60).optional(),
  travelType: z.string().max(60).optional(),
  hotelCategory: z.string().max(40).optional(),
  preferredTime: z.string().max(40).optional(),
  wantsDiscount: z.boolean().optional(),
  message: z.string().max(2000).optional(),
  source: z.enum(["WEBSITE", "PACKAGE", "WHATSAPP"]).optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." }, { status: 422 });
  }

  const d = parsed.data;
  try {
    await db.enquiry.create({
      data: {
        fullName: d.fullName,
        phone: d.phone,
        email: d.email ?? null,
        destination: d.destination ?? null,
        packageSlug: d.packageSlug ?? null,
        packageName: d.packageName ?? null,
        travelDate: d.travelDate ?? null,
        travellers: d.travellers ?? null,
        adults: d.adults ?? null,
        children: d.children ?? null,
        nights: d.nights ?? null,
        roomType: d.roomType ?? null,
        flightType: d.flightType ?? null,
        budget: d.budget ?? null,
        bookingPlan: d.bookingPlan ?? null,
        wantsDiscount: d.wantsDiscount ?? false,
        travelType: d.travelType ?? null,
        hotelCategory: d.hotelCategory ?? null,
        preferredTime: d.preferredTime ?? null,
        message: d.message ?? null,
        source: d.source ?? (d.packageSlug ? "PACKAGE" : "WEBSITE"),
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not submit right now. Please try WhatsApp or call us." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
