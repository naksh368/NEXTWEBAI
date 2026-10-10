import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";
import { getSiteSettings } from "@/lib/site-settings";
import { getPageContent } from "@/lib/page-content";

// Edited in Admin → Pages → Terms; saving refreshes this page.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    title: "Booking terms & conditions",
    description: `The terms on which ${s.brandName} quotes, confirms and operates Andaman holiday packages — pricing, payments, cancellations and what happens when a ferry or the weather changes your plan.`,
    alternates: { canonical: "/terms" },
  };
}

export default async function TermsPage() {
  const [settings, content] = await Promise.all([getSiteSettings(), getPageContent("terms")]);
  return <LegalPage content={content} settings={settings} crumbLabel="Booking terms" crumbHref="/terms" />;
}
