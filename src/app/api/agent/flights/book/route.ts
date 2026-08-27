import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionCustomerId } from "@/lib/session";
import { bookFlight } from "@/lib/services/flight-booking-service";

export const runtime = "nodejs";

const passenger = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(60),
  lastName: z.string().trim().min(1, "Last name is required.").max(60),
  type: z.enum(["ADULT", "CHILD", "INFANT"]).default("ADULT"),
});

const schema = z.object({
  token: z.string().min(10),
  passengers: z.array(passenger).min(1, "Add at least one passenger.").max(9),
});

export async function POST(request: Request) {
  const customerId = await getSessionCustomerId();
  if (!customerId) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 422 });

  const result = await bookFlight(customerId, parsed.data.token, parsed.data.passengers);
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard/wallet");
  revalidatePath("/dashboard");

  const status = result.ok ? 200 : result.code === "INSUFFICIENT" ? 402 : result.code === "PRICE_CHANGED" ? 409 : 422;
  return NextResponse.json(result, { status, headers: { "Cache-Control": "no-store" } });
}
