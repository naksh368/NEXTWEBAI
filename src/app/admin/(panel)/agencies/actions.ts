"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/services/audit-service";
import { manualAdjust } from "@/lib/services/wallet-service";
import { sendApprovalEmail, sendRejectionEmail, sendCorrectionEmail, notifyAgent } from "@/lib/services/agent-notify";

type Decision = "APPROVE" | "REJECT" | "REQUEST_CORRECTION" | "SUSPEND" | "ACTIVATE";

/** Approve / reject / request-correction / suspend / activate an agency. */
export async function decideAgency(formData: FormData) {
  const admin = await requireAdmin();
  const agentId = String(formData.get("agentId") ?? "");
  const decision = String(formData.get("decision") ?? "") as Decision;
  const reason = String(formData.get("reason") ?? "").trim();

  const agent = await db.agent.findUnique({ where: { id: agentId }, include: { agency: true } });
  if (!agent) return;

  const needsReason = decision === "REJECT" || decision === "REQUEST_CORRECTION";
  if (needsReason && !reason) return; // UI enforces; guard server-side too

  const before = { status: agent.status, kycStatus: agent.agency?.kycStatus };
  let status = agent.status;
  let kycStatus = agent.agency?.kycStatus ?? "PENDING";

  switch (decision) {
    case "APPROVE": status = "APPROVED"; kycStatus = "APPROVED"; break;
    case "REJECT": status = "REJECTED"; kycStatus = "REJECTED"; break;
    case "REQUEST_CORRECTION": status = "CORRECTION_REQUESTED"; kycStatus = "IN_REVIEW"; break;
    case "SUSPEND": status = "SUSPENDED"; break;
    case "ACTIVATE": status = "APPROVED"; kycStatus = agent.agency?.kycStatus === "REJECTED" ? "APPROVED" : kycStatus; break;
  }

  await db.agent.update({
    where: { id: agentId },
    data: {
      status,
      decisionReason: needsReason ? reason : null,
      reviewedAt: new Date(),
      reviewedById: admin.id,
      ...(decision === "APPROVE" ? { approvedAt: new Date() } : {}),
    },
  });
  if (agent.agency) await db.agencyProfile.update({ where: { agentId }, data: { kycStatus } });

  await writeAudit({
    adminUserId: admin.id,
    action: `agency.${decision.toLowerCase()}`,
    resource: `Agent:${agentId}`,
    before,
    after: { status, kycStatus, reason: needsReason ? reason : undefined },
  });

  // Notify the agent.
  const agencyName = agent.agency?.agencyName ?? "your agency";
  const agentLike = { id: agent.id, fullName: agent.fullName, email: agent.email, mobile: agent.mobile, applicationId: agent.applicationId };
  if (decision === "APPROVE") await sendApprovalEmail(agentLike, agencyName).catch(() => {});
  else if (decision === "REJECT") await sendRejectionEmail(agentLike, agencyName, reason).catch(() => {});
  else if (decision === "REQUEST_CORRECTION") await sendCorrectionEmail(agentLike, agencyName, reason).catch(() => {});
  else if (decision === "SUSPEND") await notifyAgent({ agentId, type: "SYSTEM", title: "Account suspended", body: reason || "Your account has been suspended.", href: "/application" });
  else if (decision === "ACTIVATE") await notifyAgent({ agentId, type: "SYSTEM", title: "Account reactivated", body: "Your account is active again.", href: "/agent" });

  revalidatePath(`/admin/agencies/${agentId}`);
  revalidatePath("/admin/agencies");
  revalidatePath("/admin/kyc");
}

/** Approve or reject a single KYC document (records a review note). */
export async function reviewDocument(formData: FormData) {
  const admin = await requireAdmin();
  const docId = String(formData.get("docId") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) return;
  const doc = await db.agencyDocument.findUnique({ where: { id: docId } });
  if (!doc) return;
  await db.agencyDocument.update({ where: { id: docId }, data: { status, reviewNote: note || null } });
  await writeAudit({ adminUserId: admin.id, action: `kyc.document.${status.toLowerCase()}`, resource: `AgencyDocument:${docId}`, after: { status, note } });
  revalidatePath(`/admin/agencies/${doc.agentId}`);
}

/** Manual wallet adjustment — always audited, never a silent balance edit. */
export async function adjustWallet(formData: FormData) {
  const admin = await requireAdmin();
  const agentId = String(formData.get("agentId") ?? "");
  const amount = Math.round(Number(formData.get("amount")));
  const direction = String(formData.get("direction") ?? "CREDIT") as "CREDIT" | "DEBIT";
  const reason = String(formData.get("reason") ?? "").trim();
  if (!agentId || !amount || amount <= 0 || !reason) return;

  const { balance } = await manualAdjust({ agentId, amount, direction, reason, adminId: admin.id });
  await writeAudit({
    adminUserId: admin.id,
    action: `wallet.manual.${direction.toLowerCase()}`,
    resource: `Agent:${agentId}`,
    after: { amount, direction, reason, balance },
  });
  await notifyAgent({ agentId, type: "PAYMENT", title: `Wallet ${direction === "CREDIT" ? "credited" : "debited"} ₹${amount.toLocaleString("en-IN")}`, body: reason, href: "/agent/wallet" });
  revalidatePath(`/admin/agencies/${agentId}`);
}
