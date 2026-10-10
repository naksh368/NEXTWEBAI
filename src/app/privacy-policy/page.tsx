import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";
import { getSiteSettings } from "@/lib/site-settings";
import { getPageContent } from "@/lib/page-content";

// Edited in Admin → Pages → Privacy; saving refreshes this page.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    title: "Privacy policy",
    description: `How ${s.brandName} collects, uses and protects the personal information you give us when you send a travel enquiry or make a booking.`,
    alternates: { canonical: "/privacy-policy" },
    robots: { index: true, follow: true },
  };
}

export default async function PrivacyPolicyPage() {
  const [settings, content] = await Promise.all([getSiteSettings(), getPageContent("privacy")]);
  return <LegalPage content={content} settings={settings} crumbLabel="Privacy policy" crumbHref="/privacy-policy" />;
}
