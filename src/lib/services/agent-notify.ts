import { db } from "@/lib/db";
import { getSiteUrl } from "@/lib/utils";
import { businessTypeLabel, maskPan } from "@/lib/agent-constants";
import { sendEmail, emailLayout, businessNotifyEmail } from "./email";

/**
 * B2B notification service. Composes and sends the partner-platform emails
 * (welcome, admin new-agency alert, approval, rejection, correction, payment)
 * and mirrors them into the in-app agent / admin notification feeds.
 *
 * All sends are best-effort and non-blocking — a delivery failure is logged to
 * MessageLog and never breaks the primary action. In-app records are deduped by
 * a stable key so a retried action never stacks duplicate notifications.
 */

async function logMessage(input: {
  agentId?: string;
  channel: "EMAIL";
  event: string;
  to: string;
  ok: boolean;
  error?: string;
  dedupeKey?: string;
}) {
  try {
    await db.messageLog.create({
      data: {
        customerId: null,
        channel: input.channel,
        event: input.event,
        toAddress: input.to,
        status: input.ok ? "SENT" : "FAILED",
        error: input.error ?? null,
        dedupeKey: input.dedupeKey ?? null,
      },
    });
  } catch {
    /* logging must never throw */
  }
}

export async function notifyAgent(input: {
  agentId: string;
  type: string;
  title: string;
  body?: string;
  href?: string;
  dedupeKey?: string;
}) {
  try {
    if (input.dedupeKey) {
      await db.agentNotification.upsert({
        where: { dedupeKey: input.dedupeKey },
        update: {},
        create: {
          agentId: input.agentId,
          type: input.type,
          title: input.title,
          body: input.body,
          href: input.href,
          dedupeKey: input.dedupeKey,
        },
      });
    } else {
      await db.agentNotification.create({
        data: {
          agentId: input.agentId,
          type: input.type,
          title: input.title,
          body: input.body,
          href: input.href,
        },
      });
    }
  } catch {
    console.error("notifyAgent failed", input.type);
  }
}

export async function notifyAdmin(input: {
  type: string;
  title: string;
  body?: string;
  href?: string;
  dedupeKey?: string;
}) {
  try {
    if (input.dedupeKey) {
      await db.adminNotification.upsert({
        where: { dedupeKey: input.dedupeKey },
        update: {},
        create: { type: input.type, title: input.title, body: input.body, href: input.href, dedupeKey: input.dedupeKey },
      });
    } else {
      await db.adminNotification.create({
        data: { type: input.type, title: input.title, body: input.body, href: input.href },
      });
    }
  } catch {
    console.error("notifyAdmin failed", input.type);
  }
}

type AgentLike = {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  applicationId: string | null;
};
type AgencyLike = {
  agencyName: string;
  businessType: string;
  gstin?: string | null;
  pan?: string | null;
};

/** Welcome / application-received email to the agent (spec §5). */
export async function sendWelcomeEmail(agent: AgentLike, agency: AgencyLike) {
  const html = emailLayout(
    "Welcome to ExpertzTrip — Application Received",
    `Hello ${agent.fullName},<br><br>
     Welcome to ExpertzTrip. Your agency registration has been successfully received.<br><br>
     <b>Agency:</b> ${agency.agencyName}<br>
     <b>Application ID:</b> ${agent.applicationId ?? "—"}<br>
     <b>Current Status:</b> Under Review<br><br>
     You will receive another update once your application is reviewed.<br><br>
     Regards,<br>ExpertzTrip Team`,
    { label: "View Application", href: `${getSiteUrl()}/application` }
  );
  const res = await sendEmail({ to: agent.email, subject: "Welcome to ExpertzTrip — Application Received", html });
  await logMessage({ agentId: agent.id, channel: "EMAIL", event: "AGENT_WELCOME", to: agent.email, ok: res.ok, error: res.error, dedupeKey: `welcome:${agent.id}` });
  return res;
}

/** Admin alert on every new agency submission (spec §6). Server-side only. */
export async function sendAdminNewAgencyEmail(agent: AgentLike, agency: AgencyLike) {
  const to = businessNotifyEmail();
  const submittedAt = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const html = emailLayout(
    `New Agency Registration — ${agency.agencyName}`,
    `New ExpertzTrip agency registration received.<br><br>
     <b>Agency:</b> ${agency.agencyName}<br>
     <b>Applicant:</b> ${agent.fullName}<br>
     <b>Email:</b> ${agent.email}<br>
     <b>Mobile:</b> ${agent.mobile}<br>
     <b>Business Type:</b> ${businessTypeLabel(agency.businessType)}<br>
     <b>GSTIN:</b> ${agency.gstin || "Not provided"}<br>
     <b>PAN:</b> ${maskPan(agency.pan)}<br>
     <b>Application ID:</b> ${agent.applicationId ?? "—"}<br>
     <b>Submitted At:</b> ${submittedAt}<br>
     <b>Status:</b> Pending Review`,
    { label: "Review Application", href: `${getSiteUrl()}/admin/agencies/${agent.id}` }
  );
  const res = await sendEmail({ to, subject: `New Agency Registration — ${agency.agencyName}`, html });
  await logMessage({ agentId: agent.id, channel: "EMAIL", event: "ADMIN_NEW_AGENCY", to, ok: res.ok, error: res.error, dedupeKey: `admin-new:${agent.id}` });
  await notifyAdmin({
    type: "NEW_AGENCY",
    title: `New agency registration — ${agency.agencyName}`,
    body: `${agent.fullName} · ${agent.email}`,
    href: `/admin/agencies/${agent.id}`,
    dedupeKey: `new-agency:${agent.id}`,
  });
  return res;
}

export async function sendApprovalEmail(agent: AgentLike, agencyName: string) {
  const html = emailLayout(
    "Your ExpertzTrip Agency Account Has Been Approved",
    `Hello ${agent.fullName},<br><br>
     Great news — <b>${agencyName}</b> has been approved on ExpertzTrip.<br><br>
     You can now sign in to your partner portal, add prepaid balance and start booking flights.<br><br>
     Regards,<br>ExpertzTrip Team`,
    { label: "Login to Portal", href: `${getSiteUrl()}/login` }
  );
  const res = await sendEmail({ to: agent.email, subject: "Your ExpertzTrip Agency Account Has Been Approved", html });
  await logMessage({ agentId: agent.id, channel: "EMAIL", event: "AGENT_APPROVED", to: agent.email, ok: res.ok, error: res.error });
  await notifyAgent({ agentId: agent.id, type: "APPROVAL", title: "Your agency has been approved", body: "Sign in to access your partner portal.", href: "/agent", dedupeKey: `approved:${agent.id}` });
  return res;
}

export async function sendRejectionEmail(agent: AgentLike, agencyName: string, reason: string) {
  const html = emailLayout(
    "Update on your ExpertzTrip application",
    `Hello ${agent.fullName},<br><br>
     After reviewing the application for <b>${agencyName}</b>, we're unable to approve it at this time.<br><br>
     <b>Reason:</b> ${reason}<br><br>
     You can correct the details and resubmit from your application page.<br><br>
     Regards,<br>ExpertzTrip Team`,
    { label: "Review & Resubmit", href: `${getSiteUrl()}/application` }
  );
  const res = await sendEmail({ to: agent.email, subject: "Update on your ExpertzTrip application", html });
  await logMessage({ agentId: agent.id, channel: "EMAIL", event: "AGENT_REJECTED", to: agent.email, ok: res.ok, error: res.error });
  await notifyAgent({ agentId: agent.id, type: "KYC", title: "Application needs attention", body: reason, href: "/application" });
  return res;
}

export async function sendCorrectionEmail(agent: AgentLike, agencyName: string, reason: string) {
  const html = emailLayout(
    "Action needed on your ExpertzTrip application",
    `Hello ${agent.fullName},<br><br>
     We need a correction before we can approve <b>${agencyName}</b>.<br><br>
     <b>What to fix:</b> ${reason}<br><br>
     Please update your application and resubmit.<br><br>
     Regards,<br>ExpertzTrip Team`,
    { label: "Update Application", href: `${getSiteUrl()}/application` }
  );
  const res = await sendEmail({ to: agent.email, subject: "Action needed on your ExpertzTrip application", html });
  await logMessage({ agentId: agent.id, channel: "EMAIL", event: "AGENT_CORRECTION", to: agent.email, ok: res.ok, error: res.error });
  await notifyAgent({ agentId: agent.id, type: "KYC", title: "Correction requested", body: reason, href: "/application" });
  return res;
}

export async function sendPaymentReceiptEmail(agent: { id: string; fullName: string; email: string }, amount: number, balance: number, ref: string) {
  const html = emailLayout(
    "Wallet top-up successful",
    `Hello ${agent.fullName},<br><br>
     Your prepaid booking balance has been topped up.<br><br>
     <b>Amount:</b> ₹${amount.toLocaleString("en-IN")}<br>
     <b>Reference:</b> ${ref}<br>
     <b>Available balance:</b> ₹${balance.toLocaleString("en-IN")}<br><br>
     Regards,<br>ExpertzTrip Team`,
    { label: "Open Wallet", href: `${getSiteUrl()}/agent/wallet` }
  );
  const res = await sendEmail({ to: agent.email, subject: "ExpertzTrip — Wallet top-up successful", html });
  await logMessage({ agentId: agent.id, channel: "EMAIL", event: "WALLET_TOPUP", to: agent.email, ok: res.ok, error: res.error });
  await notifyAgent({ agentId: agent.id, type: "PAYMENT", title: `Wallet credited ₹${amount.toLocaleString("en-IN")}`, body: `Available balance ₹${balance.toLocaleString("en-IN")}`, href: "/agent/wallet" });
  return res;
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const link = `${getSiteUrl()}/reset-password?token=${token}`;
  const html = emailLayout(
    "Reset your ExpertzTrip password",
    `Hello ${name},<br><br>
     We received a request to reset your ExpertzTrip partner password. This link is valid for 30 minutes and can be used once.<br><br>
     If you didn't request this, you can safely ignore this email.`,
    { label: "Reset Password", href: link }
  );
  return sendEmail({ to: email, subject: "Reset your ExpertzTrip password", html });
}
