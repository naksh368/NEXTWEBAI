"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/services/audit-service";
import { applyLedger } from "@/lib/wallet";
import { rupeesToPaise } from "@/lib/money";

async function adminOrThrow() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authorized.");
  return admin;
}

export async function approveAgent(formData: FormData) {
  const admin = await adminOrThrow();
  const agentId = String(formData.get("agentId") || "");
  const before = await db.agent.findUnique({ where: { id: agentId }, select: { status: true } });
  await db.agent.update({ where: { id: agentId }, data: { status: "APPROVED", approvedAt: new Date(), approvedById: admin.id, rejectionReason: null } });
  await writeAudit({ adminUserId: admin.id, action: "AGENT_APPROVE", resource: `agent:${agentId}`, before, after: { status: "APPROVED" } });
  revalidatePath(`/admin/agents/${agentId}`);
  revalidatePath("/admin/agents");
}

export async function rejectAgent(formData: FormData) {
  const admin = await adminOrThrow();
  const agentId = String(formData.get("agentId") || "");
  const reason = String(formData.get("reason") || "").slice(0, 500) || "Not approved";
  const before = await db.agent.findUnique({ where: { id: agentId }, select: { status: true } });
  await db.agent.update({ where: { id: agentId }, data: { status: "REJECTED", rejectionReason: reason } });
  await writeAudit({ adminUserId: admin.id, action: "AGENT_REJECT", resource: `agent:${agentId}`, before, after: { status: "REJECTED", reason } });
  revalidatePath(`/admin/agents/${agentId}`);
  revalidatePath("/admin/agents");
}

export async function suspendAgent(formData: FormData) {
  const admin = await adminOrThrow();
  const agentId = String(formData.get("agentId") || "");
  const before = await db.agent.findUnique({ where: { id: agentId }, select: { status: true } });
  const next = before?.status === "SUSPENDED" ? "APPROVED" : "SUSPENDED";
  await db.agent.update({ where: { id: agentId }, data: { status: next } });
  await writeAudit({ adminUserId: admin.id, action: "AGENT_SUSPEND_TOGGLE", resource: `agent:${agentId}`, before, after: { status: next } });
  revalidatePath(`/admin/agents/${agentId}`);
  revalidatePath("/admin/agents");
}

/** Manual wallet adjustment — always audited (admin identity + reason + amount). */
export async function adjustWallet(formData: FormData) {
  const admin = await adminOrThrow();
  const agentId = String(formData.get("agentId") || "");
  const direction = String(formData.get("direction") || "CREDIT"); // CREDIT | DEBIT
  const amountRupees = Number(formData.get("amountRupees") || 0);
  const reason = String(formData.get("reason") || "").slice(0, 500);
  if (!agentId || !reason.trim() || !Number.isFinite(amountRupees) || amountRupees <= 0) {
    throw new Error("Amount and reason are required.");
  }
  const type = direction === "DEBIT" ? "MANUAL_DEBIT" : "MANUAL_CREDIT";
  const res = await applyLedger({
    agentId,
    amountPaise: rupeesToPaise(amountRupees),
    type,
    idempotencyKey: `manual:${admin.id}:${Date.now()}`,
    description: reason,
    createdById: admin.id,
  });
  await writeAudit({ adminUserId: admin.id, action: `WALLET_${type}`, resource: `agent:${agentId}`, after: { amountRupees, reason, applied: res.applied } });
  revalidatePath(`/admin/agents/${agentId}`);
}
