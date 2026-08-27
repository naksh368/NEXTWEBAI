import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAgentSessionId } from "@/lib/agent-session";
import { requiredDocsFor } from "@/lib/agent-constants";
import { sendWelcomeEmail, sendAdminNewAgencyEmail, notifyAgent } from "@/lib/services/agent-notify";
import { getOrCreateWallet } from "@/lib/services/wallet-service";

function makeApplicationId(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `EXZ-${out}`;
}

/**
 * Step 6 — submit the application for review. Idempotent: a retried submit never
 * re-sends the welcome/admin emails (guarded by *SentAt/*NotifiedAt columns) and
 * never re-generates the application id.
 */
export async function POST() {
  const id = await getAgentSessionId();
  if (!id) return NextResponse.json({ error: "Session expired. Please start again." }, { status: 401 });

  const agent = await db.agent.findUnique({ where: { id }, include: { agency: true, documents: true } });
  if (!agent) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  if (!agent.isEmailVerified) return NextResponse.json({ error: "Verify your email before submitting." }, { status: 403 });
  if (!agent.agency) return NextResponse.json({ error: "Complete your agency details first." }, { status: 400 });

  // Required documents present?
  const required = requiredDocsFor(agent.agency.businessType);
  const have = new Set(agent.documents.map((d) => d.type));
  const missing = required.filter((r) => !have.has(r.type));
  if (missing.length) {
    return NextResponse.json({ error: `Please upload: ${missing.map((m) => m.label).join(", ")}.` }, { status: 400 });
  }

  // Assign application id + move to review (only if not already submitted).
  const alreadySubmitted = agent.status === "PENDING_REVIEW" || Boolean(agent.applicationId);
  const applicationId = agent.applicationId ?? makeApplicationId();

  const updated = await db.agent.update({
    where: { id: agent.id },
    data: {
      applicationId,
      status: agent.status === "APPROVED" ? "APPROVED" : "PENDING_REVIEW",
      submittedAt: agent.submittedAt ?? new Date(),
    },
  });
  await db.agencyProfile.update({ where: { agentId: agent.id }, data: { kycStatus: "IN_REVIEW" } });
  await getOrCreateWallet(agent.id);

  const agentLike = { id: updated.id, fullName: updated.fullName, email: updated.email, mobile: updated.mobile, applicationId };
  const agencyLike = { agencyName: agent.agency.agencyName, businessType: agent.agency.businessType, gstin: agent.agency.gstin, pan: agent.agency.pan };

  // Idempotent notifications — only on the first successful submit.
  if (!agent.welcomeEmailSentAt) {
    await sendWelcomeEmail(agentLike, agencyLike).catch(() => {});
    await db.agent.update({ where: { id: agent.id }, data: { welcomeEmailSentAt: new Date() } });
    await notifyAgent({ agentId: agent.id, type: "REGISTRATION", title: "Application submitted", body: `Application ID ${applicationId} — under review.`, href: "/application", dedupeKey: `submitted:${agent.id}` });
  }
  if (!agent.adminNotifiedAt) {
    await sendAdminNewAgencyEmail(agentLike, agencyLike).catch(() => {});
    await db.agent.update({ where: { id: agent.id }, data: { adminNotifiedAt: new Date() } });
  }

  return NextResponse.json({ ok: true, applicationId, alreadySubmitted });
}
