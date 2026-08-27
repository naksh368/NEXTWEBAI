import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "./db";
import { getAgentSessionId } from "./agent-session";

export type CurrentAgent = {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  status: string;
  applicationId: string | null;
  agencyName: string | null;
  logoDocumentId: string | null;
  kycStatus: string | null;
};

/**
 * The signed-in agent + their agency summary (request-cached). Returns null when
 * there is no valid agent session. Ownership of every agency-scoped resource is
 * derived from this — never from an agency id supplied by the client.
 */
export const getCurrentAgent = cache(async (): Promise<CurrentAgent | null> => {
  const id = await getAgentSessionId();
  if (!id) return null;
  const agent = await db.agent.findUnique({
    where: { id },
    include: { agency: true },
  });
  if (!agent) return null;
  return {
    id: agent.id,
    fullName: agent.fullName,
    email: agent.email,
    mobile: agent.mobile,
    status: agent.status,
    applicationId: agent.applicationId,
    agencyName: agent.agency?.agencyName ?? null,
    logoDocumentId: agent.agency?.logoDocumentId ?? null,
    kycStatus: agent.agency?.kycStatus ?? null,
  };
});

/**
 * Portal page guard. Only APPROVED agents may reach the operating portal.
 * Everyone else is routed to the status/application page so they always know
 * where their application stands — never a blank wall.
 */
export async function requireApprovedAgent(): Promise<CurrentAgent> {
  const agent = await getCurrentAgent();
  if (!agent) redirect("/login?redirect_url=/agent");
  if (agent.status !== "APPROVED") redirect("/application");
  return agent;
}

/** Server-action guard — returns the approved agent or null (no redirect). */
export async function authorizeAgent(): Promise<CurrentAgent | null> {
  const agent = await getCurrentAgent();
  if (!agent || agent.status !== "APPROVED") return null;
  return agent;
}
