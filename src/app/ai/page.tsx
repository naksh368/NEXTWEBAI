import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { BreadcrumbJsonLd } from "@/components/layout/structured-data";
import { AssistantChat } from "@/components/ai/assistant-chat";
import { buttonVariants } from "@/components/ui/button";
import { isAiConfigured } from "@/lib/services/ai-service";
import { getSiteSettings, telLinkFor, whatsappLinkFor } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    title: "Trip planner",
    description: `Describe the Andaman holiday you have in mind and get matched to real, published ${s.brandName} packages — never an invented price or an availability we cannot honour.`,
    alternates: { canonical: "/ai" },
  };
}

export default async function AiPage() {
  const settings = await getSiteSettings();
  const aiOn = isAiConfigured();
  const tel = telLinkFor(settings);
  const wa = whatsappLinkFor(settings, `Hello ${settings.brandName}, I would like to plan an Andaman holiday.`);

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Trip planner", href: "/ai" },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={crumbs} />
      <PageHeader
        eyebrow="Trip planner"
        title="Tell us the trip you have in mind"
        description="Describe your dates, group and budget in your own words. The planner searches our real published Andaman packages and shows you what genuinely fits."
        breadcrumbs={crumbs}
      />

      <Section className="pt-8">
        <Container className="max-w-4xl">
          <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-brand-turquoiseLight px-4 py-3 text-sm font-semibold text-brand-navy">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-turquoiseDark" />
              Answers come from our real published packages
            </span>
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-turquoiseDark" />
              No invented prices, hotels or availability
            </span>
          </div>

          <AssistantChat />

          {!aiOn && (
            <p className="mt-4 rounded-xl bg-surface-muted p-4 text-sm leading-relaxed text-ink-muted">
              The conversational planner is not switched on yet, so this page is searching our packages directly by
              keyword. Both routes only ever return real published packages.
            </p>
          )}

          <div className="mt-10 rounded-2xl border border-surface-border bg-surface-muted p-6 text-center">
            <h2 className="text-lg">Would you rather talk to a person?</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
              The planner is good at narrowing things down. For ferry timings, hotel choices and a written quotation,
              our team on the islands is better.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className={buttonVariants({ variant: "orange", size: "sm" })}>Send an enquiry</Link>
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              )}
              {tel && (
                <a href={tel} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  <Phone className="h-4 w-4" /> {settings.phonePrimary}
                </a>
              )}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
