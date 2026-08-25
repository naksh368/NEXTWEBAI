import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

const PAGES: Record<string, { title: string; body: string[] }> = {
  terms: {
    title: "Terms of Service",
    body: [
      "These terms govern your use of ExpertzTrip. By booking a holiday you agree to the package inclusions, pricing and cancellation policy shown at the time of booking.",
      "All prices are calculated and confirmed on our servers before payment. The amount you pay is the amount shown at checkout, inclusive of applicable taxes.",
      "Bookings are subject to supplier availability. A payment received does not by itself constitute a confirmed booking — confirmation is issued once the relevant travel components are secured.",
      "This is placeholder legal copy for the ExpertzTrip build. Replace with your reviewed legal text before going live.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    body: [
      "We collect your mobile number and email to authenticate you and deliver booking documents such as e-tickets, vouchers and invoices.",
      "We never sell your personal data. Payment details are processed securely by our payment provider (Razorpay) — ExpertzTrip does not store card data.",
      "You can request deletion of your account and personal data by contacting support.",
      "This is placeholder privacy copy for the ExpertzTrip build. Replace with your reviewed policy before going live.",
    ],
  },
  cancellation: {
    title: "Cancellation Policy",
    body: [
      "Standard cancellation terms: free cancellation up to 21 days before departure; 25% charge within 21–8 days; 50% within 7–3 days; no refund within 48 hours of departure.",
      "Individual packages may specify their own cancellation terms, which are shown on the package page and take precedence.",
      "Refunds are processed to the original payment method and may take 5–7 business days to reflect.",
      "This is placeholder copy for the ExpertzTrip build. Replace with your reviewed policy before going live.",
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = PAGES[slug];
  return { title: page?.title ?? "Legal" };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) notFound();

  return (
    <Container className="max-w-3xl py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: page.title }]} />
      <h1 className="mt-4 text-3xl font-bold">{page.title}</h1>
      <div className="mt-6 space-y-4">
        {page.body.map((p, i) => (
          <p key={i} className="leading-relaxed text-ink-muted">{p}</p>
        ))}
      </div>
    </Container>
  );
}
