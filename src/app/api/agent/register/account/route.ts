import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { accountSchema } from "@/lib/agent-schemas";
import { setAgentCookie, getAgentSessionId } from "@/lib/agent-session";
import { requestEmailOtp } from "@/lib/services/otp-service";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/**
 * Step 1 — create the draft agent account and send an email OTP.
 * The draft agent is signed in immediately (status DRAFT) so the rest of the
 * multi-step flow is authenticated; DRAFT agents can only reach registration /
 * the application page, never the operating portal (see agent-auth guard).
 */
export async function POST(req: Request) {
  const ip = await clientIp();
  const rl = rateLimit(`reg:${ip}`, 8, 600);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = accountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const { fullName, email, mobile, password } = parsed.data;

  // If already signed in as a draft agent, treat as resume rather than error.
  const existingSession = await getAgentSessionId();

  const existing = await db.agent.findUnique({ where: { email } });
  if (existing && existing.id !== existingSession) {
    if (existing.status === "DRAFT") {
      // A prior abandoned draft with the same email — refuse silently-ish.
      return NextResponse.json({ error: "An application with this email is already in progress. Please log in to continue." }, { status: 409 });
    }
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const mobileClash = await db.agent.findFirst({ where: { mobile, NOT: { email } } });
  if (mobileClash) {
    return NextResponse.json({ error: "This mobile number is already registered." }, { status: 409 });
  }

  const agent = existing
    ? await db.agent.update({ where: { id: existing.id }, data: { fullName, mobile, passwordHash: hashPassword(password) } })
    : await db.agent.create({
        data: { fullName, email, mobile, passwordHash: hashPassword(password), status: "DRAFT" },
      });

  await setAgentCookie(agent.id);

  const otp = await requestEmailOtp(email, "REGISTER");
  if (!otp.ok) {
    return NextResponse.json({ ok: true, otpError: otp.error, email }, { status: 200 });
  }
  return NextResponse.json({ ok: true, email, resendInSeconds: otp.resendInSeconds });
}
