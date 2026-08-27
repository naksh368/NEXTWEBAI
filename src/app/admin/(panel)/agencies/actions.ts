"use server";

import { revalidatePath } from "next/cache";
import { authorize } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/services/audit-service";
import { getOrCreateWallet } from "@/lib/services/wallet-service";
import { sendEmail, emailLayout } from "@/lib/services/email";
import { getSiteUrl } from "@/lib/utils";

const PERM = "customer.view";

function esc(s: string): string {
  return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export async function setUnderReview(formData: FormData) {
  const admin = await authorize(PERM);
  if (!admin) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const app = await db.agencyApplication.findUnique({ where: { id }, select: { status: true } });
  if (!app || app.status === "APPROVED") return;
  await db.agencyApplication.update({ where: { id }, data: { status: "UNDER_REVIEW" } });
  await writeAudit({ adminUserId: admin.id, action: "agency.under_review", resource: `AgencyApplication:${id}` });
  revalidatePath("/admin/agencies");
  revalidatePath(`/admin/agencies/${id}`);
}

export async function approveAgency(formData: FormData) {
  const admin = await authorize(PERM);
  if (!admin) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const app = await db.agencyApplication.findUnique({ where: { id } });
  if (!app || app.status === "APPROVED") return;

  await db.agencyApplication.update({ where: { id }, data: { status: "APPROVED", reviewedAt: new Date(), reviewNote: null } });

  // Activate the agent account + ensure their wallet exists.
  if (app.customerId) {
    await db.customer.update({ where: { id: app.customerId }, data: { status: "ACTIVE", isVerified: true } }).catch(() => {});
    await getOrCreateWallet(app.customerId).catch(() => {});
  }

  await writeAudit({ adminUserId: admin.id, action: "agency.approved", resource: `AgencyApplication:${id}`, after: { agencyName: app.agencyName } });

  // Approval email (§24) — best-effort.
  await sendEmail({
    to: app.email,
    subject: "Your ExpertzTrip Agency Account Has Been Approved",
    html: emailLayout(
      "You're approved 🎉",
      `<p>Great news — <b>${esc(app.agencyName)}</b> has been approved on ExpertzTrip.</p>
       <p>You can now sign in to your Partner Portal, add your prepaid balance and start booking flights.</p>
       ${app.reference ? `<p>Application reference: <b>${esc(app.reference)}</b></p>` : ""}`,
      { label: "Go to your dashboard", href: `${getSiteUrl()}/dashboard` },
    ),
  }).catch(() => {});

  revalidatePath("/admin/agencies");
  revalidatePath(`/admin/agencies/${id}`);
}

export async function rejectAgency(formData: FormData) {
  const admin = await authorize(PERM);
  if (!admin) return;
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "").slice(0, 500);
  if (!id) return;

  const app = await db.agencyApplication.findUnique({ where: { id } });
  if (!app || app.status === "APPROVED") return;

  await db.agencyApplication.update({ where: { id }, data: { status: "REJECTED", reviewedAt: new Date(), reviewNote: note || null } });
  if (app.customerId) {
    await db.customer.update({ where: { id: app.customerId }, data: { status: "SUSPENDED" } }).catch(() => {});
  }
  await writeAudit({ adminUserId: admin.id, action: "agency.rejected", resource: `AgencyApplication:${id}`, after: { note } });

  await sendEmail({
    to: app.email,
    subject: "Update on your ExpertzTrip agency application",
    html: emailLayout(
      "About your application",
      `<p>Thank you for your interest in ExpertzTrip. After review, we&apos;re unable to approve <b>${esc(app.agencyName)}</b> at this time.</p>
       ${note ? `<p><b>Reason:</b> ${esc(note)}</p>` : ""}
       <p>If you believe this was in error or can provide additional details, please reply to this email or contact support.</p>`,
    ),
  }).catch(() => {});

  revalidatePath("/admin/agencies");
  revalidatePath(`/admin/agencies/${id}`);
}
