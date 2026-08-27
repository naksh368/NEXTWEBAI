import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getAgentSessionId } from "@/lib/agent-session";
import { getOrCreateWallet } from "@/lib/wallet";
import { normalizeMobile, normalizeEmail } from "@/lib/services/otp-service";

export type SafeAgent = {
  id: string; agencyName: string; ownerName: string; email: string; mobile: string;
  status: string; mobileVerified: boolean; emailVerified: boolean;
  businessType: string | null; pan: string | null; gstin: string | null;
  city: string | null; state: string | null;
};

const SELECT = {
  id: true, agencyName: true, ownerName: true, email: true, mobile: true,
  status: true, mobileVerified: true, emailVerified: true,
  businessType: true, pan: true, gstin: true, city: true, state: true,
} as const;

/** The signed-in agent (from the agent cookie), or null. */
export async function getCurrentAgent(): Promise<SafeAgent | null> {
  const id = await getAgentSessionId();
  if (!id) return null;
  return db.agent.findUnique({ where: { id }, select: SELECT });
}

export type RegisterInput = {
  agencyName: string; ownerName: string; email: string; mobile: string; password: string;
};

export type RegisterResult =
  | { ok: true; agentId: string }
  | { ok: false; field?: "email" | "mobile" | "password" | "form"; error: string };

/** Create a PENDING agent + an empty wallet. Password is scrypt-hashed. */
export async function registerAgent(input: RegisterInput): Promise<RegisterResult> {
  const email = normalizeEmail(input.email);
  const mobile = normalizeMobile(input.mobile);
  if (!input.agencyName?.trim() || !input.ownerName?.trim()) return { ok: false, field: "form", error: "Agency and contact name are required." };
  if (!email) return { ok: false, field: "email", error: "Enter a valid email address." };
  if (!mobile) return { ok: false, field: "mobile", error: "Enter a valid mobile number." };
  if (!input.password || input.password.length < 8) return { ok: false, field: "password", error: "Password must be at least 8 characters." };

  const clash = await db.agent.findFirst({ where: { OR: [{ email }, { mobile }] }, select: { email: true, mobile: true } });
  if (clash?.email === email) return { ok: false, field: "email", error: "An agency with this email already exists." };
  if (clash?.mobile === mobile) return { ok: false, field: "mobile", error: "An agency with this mobile already exists." };

  const agent = await db.agent.create({
    data: {
      agencyName: input.agencyName.trim(),
      ownerName: input.ownerName.trim(),
      email, mobile,
      passwordHash: hashPassword(input.password),
      status: "PENDING",
    },
  });
  await getOrCreateWallet(agent.id);
  return { ok: true, agentId: agent.id };
}

export type LoginResult =
  | { ok: true; agentId: string; status: string }
  | { ok: false; error: string };

/** Verify email/agent-id + password. Rejected/suspended agents cannot log in. */
export async function authenticateAgent(identifier: string, password: string): Promise<LoginResult> {
  const email = normalizeEmail(identifier);
  const agent = await db.agent.findFirst({
    where: email ? { email } : { id: identifier.trim() },
    select: { id: true, passwordHash: true, status: true },
  });
  if (!agent || !verifyPassword(password, agent.passwordHash)) {
    return { ok: false, error: "Incorrect email/agent ID or password." };
  }
  if (agent.status === "REJECTED") return { ok: false, error: "This application was rejected. Contact support." };
  if (agent.status === "SUSPENDED") return { ok: false, error: "This account is suspended. Contact support." };
  return { ok: true, agentId: agent.id, status: agent.status };
}

/** Mark a verified channel on the agent (called after OTP success). */
export async function markVerified(agentId: string, channel: "mobile" | "email") {
  await db.agent.update({
    where: { id: agentId },
    data: channel === "mobile" ? { mobileVerified: true } : { emailVerified: true },
  });
}
