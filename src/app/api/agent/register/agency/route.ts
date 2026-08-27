import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAgentSessionId } from "@/lib/agent-session";
import { agencySchema } from "@/lib/agent-schemas";

/** Steps 3 + 4 — save agency details and business information. */
export async function POST(req: Request) {
  const id = await getAgentSessionId();
  if (!id) return NextResponse.json({ error: "Session expired. Please start again." }, { status: 401 });
  const agent = await db.agent.findUnique({ where: { id }, include: { agency: true } });
  if (!agent) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  if (!agent.isEmailVerified) return NextResponse.json({ error: "Verify your email first." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = agencySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const d = parsed.data;

  await db.agencyProfile.upsert({
    where: { agentId: agent.id },
    update: {
      agencyName: d.agencyName,
      businessType: d.businessType,
      officeAddress: d.officeAddress,
      country: d.country,
      state: d.state,
      city: d.city,
      pinCode: d.pinCode,
      pan: d.pan,
      gstin: d.gstin ?? null,
      udyam: d.udyam ?? null,
      otherRegistration: d.otherRegistration ?? null,
    },
    create: {
      agentId: agent.id,
      agencyName: d.agencyName,
      businessType: d.businessType,
      officeAddress: d.officeAddress,
      country: d.country,
      state: d.state,
      city: d.city,
      pinCode: d.pinCode,
      pan: d.pan,
      gstin: d.gstin ?? null,
      udyam: d.udyam ?? null,
      otherRegistration: d.otherRegistration ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
