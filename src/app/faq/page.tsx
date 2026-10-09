import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { BreadcrumbJsonLd } from "@/components/layout/structured-data";
import { Accordion } from "@/components/ui/accordion";
import { EmptyState } from "@/components/ui/states";
import { buttonVariants } from "@/components/ui/button";
import { getGlobalFaqs } from "@/lib/queries";
import { getSiteSettings } from "@/lib/site-settings";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    title: "Frequently asked questions",
    description: `Answers to the questions we are asked most about Andaman holidays — permits, ferries, the best time to visit and how ${s.brandName} quotes and books.`,
    alternates: { canonical: "/faq" },
  };
}

export default async function FaqPage() {
  const [faqs, settings] = await Promise.all([getGlobalFaqs(), getSiteSettings()]);

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "FAQs", href: "/faq" },
  ];

  // FAQPage structured data is emitted only from the real, published answers.
  const faqJsonLd = faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }
    : null;

  return (
    <>
      <BreadcrumbJsonLd items={crumbs} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}

      <PageHeader
        eyebrow="Good to know"
        title="Frequently asked questions"
        description="Permits, ferries, the season, what is included and how we quote. If your question is not here, ask us directly — we answer every one."
        breadcrumbs={crumbs}
      />

      <Section>
        <Container className="max-w-3xl">
          {faqs.length ? (
            <Accordion items={faqs.map((f) => ({ question: f.question, answer: f.answer }))} />
          ) : (
            <EmptyState
              icon={<HelpCircle className="h-5 w-5" />}
              title="No questions published yet"
              description="Our answers will appear here shortly. In the meantime, please get in touch."
              action={{ label: "Contact us", href: "/contact" }}
            />
          )}

          <div className="mt-12 rounded-2xl border border-surface-border bg-surface-muted p-8 text-center">
            <h2 className="text-xl">Still have a question?</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
              Call {settings.phonePrimary}, message us on WhatsApp, or send an enquiry — a real person will answer.
            </p>
            <Link href="/contact" className={buttonVariants({ variant: "orange", className: "mt-6" })}>
              Ask us
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
