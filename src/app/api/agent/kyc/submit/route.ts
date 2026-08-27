import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSessionCustomerId } from "@/lib/session";
import { getKycState } from "@/lib/services/kyc-service";
import { sendEmail, emailLayout, businessNotifyEmail } from "@/lib/services/email";
import { getSiteUrl } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST() {
  const customerId = await getSessionCustomerId();
  if (!customerId) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });

  const state = await getKycState(customerId);
  if (!state.complete) {
    return NextResponse.json({ ok: false, error: `Please upload all required documents first (${state.requiredDone}/${state.requiredTotal}).` }, { status: 422 });
  }

  const app = await db.agencyApplication.findFirst({ where: { customerId }, orderBy: { createdAt: "desc" } });
  if (!app) return NextResponse.json({ ok: false, error: "No application found." }, { status: 404 });
  if (app.status === "APPROVED") return NextResponse.json({ ok: true, already: true });

  await db.agencyApplication.update({ where: { id: app.id }, data: { status: "UNDER_REVIEW" } });

  // Nudge the admin that KYC is ready to review (best-effort).
  await sendEmail({
    to: businessNotifyEmail(),
    subject: `KYC submitted for review — ${app.agencyName}`,
    html: emailLayout(
      "KYC ready for review",
      `<p><b>${app.agencyName}</b> (${app.reference}) has submitted their KYC documents and is ready for review.</p>`,
      { label: "Review application", href: `${getSiteUrl()}/admin/agencies/${app.id}` },
    ),
  }).catch(() => {});

  revalidatePath("/dashboard/kyc");
  revalidatePath("/dashboard");
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
