import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionCustomerId } from "@/lib/session";
import { cancelFlightBooking } from "@/lib/services/flight-booking-service";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const customerId = await getSessionCustomerId();
  if (!customerId) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });

  const { id } = await params;
  const result = await cancelFlightBooking(customerId, id);
  revalidatePath("/dashboard/bookings");
  revalidatePath(`/dashboard/bookings/${id}`);
  revalidatePath("/dashboard/wallet");

  return NextResponse.json(result, { status: result.ok ? 200 : 422, headers: { "Cache-Control": "no-store" } });
}
