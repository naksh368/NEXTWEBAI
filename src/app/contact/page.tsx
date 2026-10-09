import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone, Globe } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { BreadcrumbJsonLd, TravelAgencyJsonLd } from "@/components/layout/structured-data";
import { TripPlanner } from "@/components/enquiry/trip-planner";
import { Accordion } from "@/components/ui/accordion";
import { getAndamanDestinations, getGlobalFaqs, listPackages } from "@/lib/queries";
import { getSiteSettings, telLinkFor, whatsappLinkFor } from "@/lib/site-settings";
import { mapsHref } from "@/lib/brand";
import { getSiteUrl } from "@/lib/utils";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    title: "Contact us",
    description: `Contact ${s.brandName} — call ${s.phonePrimary}, message us on WhatsApp, or send an enquiry and we will reply with an itinerary and a written quotation.`,
    alternates: { canonical: "/contact" },
  };
}

export default async function ContactPage() {
  const [settings, destinations, packages, faqs] = await Promise.all([
    getSiteSettings(),
    getAndamanDestinations(),
    listPackages({ page: 1, sort: "price-asc" }),
    getGlobalFaqs(),
  ]);

  const tel = telLinkFor(settings);
  const wa = whatsappLinkFor(settings, `Hello ${settings.brandName}, I would like to plan an Andaman holiday.`);
  const address = settings.addressLines.filter(Boolean);
  const siteUrl = getSiteUrl();

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={crumbs} />
      <TravelAgencyJsonLd settings={settings} />

      <PageHeader
        eyebrow="Contact"
        title="Let's plan your Andaman holiday"
        description="Send us your dates and group size. We reply with an itinerary and a written quotation — no obligation, and nothing is booked until you say so."
        breadcrumbs={crumbs}
      />

      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-14">
            {/* Contact details */}
            <div>
              <h2 className="text-xl sm:text-2xl">Talk to us directly</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
                The fastest answer is a phone call or a WhatsApp message — we are on island time (IST), and someone is
                usually reachable well outside office hours during the season.
              </p>

              <ul className="mt-7 space-y-4">
                {tel && (
                  <ContactRow icon={<Phone className="h-5 w-5" />} label="Phone">
                    <a href={tel} className="text-lg font-extrabold text-brand-navy hover:text-brand-blue">
                      {settings.phonePrimary}
                    </a>
                    {settings.phoneSecondary && (
                      <span className="mt-0.5 block text-sm text-ink-muted">{settings.phoneSecondary}</span>
                    )}
                  </ContactRow>
                )}

                {wa && (
                  <ContactRow icon={<MessageCircle className="h-5 w-5" />} label="WhatsApp">
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="font-bold text-brand-navy hover:text-brand-blue">
                      Start a WhatsApp chat
                    </a>
                    <span className="mt-0.5 block text-sm text-ink-muted">Send us your dates and we will reply with options.</span>
                  </ContactRow>
                )}

                {settings.email && (
                  <ContactRow icon={<Mail className="h-5 w-5" />} label="Email">
                    <a href={`mailto:${settings.email}`} className="font-bold text-brand-navy hover:text-brand-blue">
                      {settings.email}
                    </a>
                  </ContactRow>
                )}

                {address.length > 0 && (
                  <ContactRow icon={<MapPin className="h-5 w-5" />} label="Office">
                    <address className="not-italic text-[15px] leading-relaxed text-ink">
                      {address.map((line) => (
                        <span key={line} className="block">{line}</span>
                      ))}
                    </address>
                    <a
                      href={mapsHref(address.join(", "))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-block text-sm font-bold text-brand-blue underline-offset-2 hover:underline"
                    >
                      Open in Google Maps
                    </a>
                  </ContactRow>
                )}

                <ContactRow icon={<Globe className="h-5 w-5" />} label="Website">
                  <a href={siteUrl} className="font-bold text-brand-navy hover:text-brand-blue">
                    {siteUrl.replace(/^https?:\/\//, "")}
                  </a>
                </ContactRow>

                {settings.officeHours && (
                  <ContactRow icon={<Clock className="h-5 w-5" />} label="Office hours">
                    <span className="text-[15px] text-ink">{settings.officeHours}</span>
                  </ContactRow>
                )}
              </ul>

              {address.length > 0 && (
                <div className="mt-8 overflow-hidden rounded-2xl border border-surface-border">
                  <iframe
                    title={`Map showing ${settings.brandName}`}
                    src={`https://www.google.com/maps?q=${encodeURIComponent(address.join(", "))}&output=embed`}
                    className="h-[280px] w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
            </div>

            {/* Enquiry form */}
            <div>
              <TripPlanner
                destinations={["Andaman Islands", ...destinations.map((d) => d.name)]}
                packages={packages.items.map((p) => ({ slug: p.slug, name: p.name }))}
                className="lg:sticky lg:top-24"
              />
            </div>
          </div>
        </Container>
      </Section>

      {faqs.length > 0 && (
        <Section className="bg-surface-muted">
          <Container className="max-w-3xl">
            <h2 className="mb-7 text-center text-2xl sm:text-3xl">Before you write to us</h2>
            <Accordion items={faqs.slice(0, 5).map((f) => ({ question: f.question, answer: f.answer }))} />
          </Container>
        </Section>
      )}
    </>
  );
}

function ContactRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4 rounded-2xl border border-surface-border bg-white p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">{label}</p>
        <div className="mt-1">{children}</div>
      </div>
    </li>
  );
}
