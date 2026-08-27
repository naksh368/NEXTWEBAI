import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentAgent } from "@/lib/agent-auth";

export const runtime = "nodejs";

const PAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}$/;

const schema = z.object({
  businessType: z.enum(["PROPRIETORSHIP", "PARTNERSHIP", "PVT_LTD", "LLP", "OTHER"]),
  pan: z.string().transform((s) => s.toUpperCase()).refine((s) => PAN.test(s), "Enter a valid PAN."),
  gstin: z.string().transform((s) => s.toUpperCase()).refine((s) => s === "" || GSTIN.test(s), "Enter a valid GSTIN.").optional().or(z.literal("")),
  addressLine: z.string().min(3).max(240),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(80),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code."),
});

/** Save Step-2 business details and move the application to UNDER_REVIEW. */
export async function POST(request: Request) {
  const agent = await getCurrentAgent();
  if (!agent) return NextResponse.json({ ok: false, error: "Please register or sign in first." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." }, { status: 422 });
  }
  const d = parsed.data;
  await db.agent.update({
    where: { id: agent.id },
    data: {
      businessType: d.businessType, pan: d.pan, gstin: d.gstin || null,
      addressLine: d.addressLine, city: d.city, state: d.state, pincode: d.pincode,
      status: "UNDER_REVIEW",
    },
  });
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
