import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAgentSessionId } from "@/lib/agent-session";
import { AuthShell } from "@/components/b2b/auth-shell";
import { RegisterFlow, type RegisterInitial } from "@/components/b2b/register-flow";

export const metadata = { title: "Register Your Agency" };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const id = await getAgentSessionId();
  let initial: RegisterInitial = {
    email: "", isEmailVerified: false, status: "", applicationId: null,
    agency: null, documents: [], fullName: "", mobile: "",
  };

  if (id) {
    const agent = await db.agent.findUnique({ where: { id }, include: { agency: true, documents: true } });
    // Already submitted / approved → send to the status page instead.
    if (agent && agent.status !== "DRAFT") redirect("/application");
    if (agent) {
      initial = {
        email: agent.email,
        isEmailVerified: agent.isEmailVerified,
        status: agent.status,
        applicationId: agent.applicationId,
        fullName: agent.fullName,
        mobile: agent.mobile,
        agency: agent.agency
          ? {
              agencyName: agent.agency.agencyName, businessType: agent.agency.businessType,
              officeAddress: agent.agency.officeAddress, country: agent.agency.country,
              state: agent.agency.state, city: agent.agency.city, pinCode: agent.agency.pinCode,
              pan: agent.agency.pan ?? "", gstin: agent.agency.gstin ?? "", udyam: agent.agency.udyam ?? "",
              otherRegistration: agent.agency.otherRegistration ?? "",
            }
          : null,
        documents: agent.documents.map((d) => ({ id: d.id, type: d.type, title: d.title, filename: d.filename, status: d.status })),
      };
    }
  }

  return (
    <AuthShell
      title="Register Your Agency"
      subtitle="Join India's smarter B2B travel platform"
      wide
      footer={<>Already have an account? <Link href="/login" className="font-semibold text-brand-blue">Login</Link></>}
    >
      <RegisterFlow initial={initial} />
    </AuthShell>
  );
}
