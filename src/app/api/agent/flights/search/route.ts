import { NextResponse } from "next/server";
import { authorizeAgent } from "@/lib/agent-auth";
import { searchFlights, type FlightQuery } from "@/lib/services/flight-service";

/** Search available flights via the configured supplier (server-side creds). */
export async function POST(req: Request) {
  const agent = await authorizeAgent();
  if (!agent) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const q: FlightQuery = {
    origin: String(body?.origin ?? "").trim().toUpperCase(),
    destination: String(body?.destination ?? "").trim().toUpperCase(),
    departDate: String(body?.departDate ?? ""),
    returnDate: body?.returnDate ? String(body.returnDate) : undefined,
    tripType: body?.tripType === "ROUND" ? "ROUND" : "ONEWAY",
    cabin: String(body?.cabin ?? "ECONOMY"),
    adults: Math.max(1, Number(body?.adults ?? 1)),
    children: Math.max(0, Number(body?.children ?? 0)),
    infants: Math.max(0, Number(body?.infants ?? 0)),
  };
  if (!q.origin || !q.destination || !q.departDate) {
    return NextResponse.json({ error: "Enter origin, destination and departure date." }, { status: 400 });
  }
  const { configured, offers } = await searchFlights(q);
  return NextResponse.json({ configured, offers });
}
