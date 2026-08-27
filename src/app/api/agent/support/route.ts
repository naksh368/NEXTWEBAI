import { NextResponse } from "next/server";
import { authorizeAgent } from "@/lib/agent-auth";
import { db } from "@/lib/db";
import { makeReference } from "@/lib/utils";
import { SUPPORT_CATEGORIES } from "@/lib/agent-constants";
import { notifyAdmin } from "@/lib/services/agent-notify";

/** Create a support ticket for the signed-in agent. */
export async function POST(req: Request) {
  const agent = await authorizeAgent();
  if (!agent) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const category = String(body?.category ?? "");
  const subject = String(body?.subject ?? "").trim();
  const message = String(body?.message ?? "").trim();
  if (!SUPPORT_CATEGORIES.includes(category as (typeof SUPPORT_CATEGORIES)[number])) {
    return NextResponse.json({ error: "Choose a valid category." }, { status: 400 });
  }
  if (subject.length < 3) return NextResponse.json({ error: "Enter a subject." }, { status: 400 });
  if (message.length < 5) return NextResponse.json({ error: "Describe your issue." }, { status: 400 });

  const ticket = await db.agentSupportTicket.create({
    data: {
      reference: makeReference("ETS"),
      agentId: agent.id,
      category,
      subject,
      messages: { create: { authorType: "AGENT", authorId: agent.id, body: message } },
    },
  });
  await notifyAdmin({
    type: "SYSTEM",
    title: `New support ticket — ${ticket.reference}`,
    body: `${agent.agencyName ?? agent.fullName}: ${subject}`,
    href: "/admin/support",
  });
  return NextResponse.json({ ok: true, reference: ticket.reference });
}
