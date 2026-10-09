import { AlertTriangle } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { BreadcrumbJsonLd } from "@/components/layout/structured-data";
import { formatDate } from "@/lib/utils";

export type LegalSection = { id?: string; heading: string; paragraphs: string[]; bullets?: string[] };

/**
 * Shared layout for the policy pages.
 *
 * The banner is deliberate: this copy is a thorough, honest starting point
 * written from how the business actually operates, but it has not been
 * reviewed by a lawyer. It stays visible until the agency replaces the text,
 * so nobody mistakes it for vetted legal advice.
 */
export function LegalPage({
  title,
  intro,
  sections,
  lastUpdated,
  crumbLabel,
  crumbHref,
  contactLine,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
  lastUpdated: string;
  crumbLabel: string;
  crumbHref: string;
  contactLine: string;
}) {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: crumbLabel, href: crumbHref },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={crumbs} />
      <PageHeader eyebrow="Legal" title={title} description={intro} breadcrumbs={crumbs} />

      <Section>
        <Container className="max-w-3xl">
          <p className="text-sm font-semibold text-ink-muted">
            Last updated {formatDate(lastUpdated)}
          </p>

          <div className="mt-5 flex gap-3 rounded-xl border border-warning/30 bg-[#FDF6E9] p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
            <p className="text-sm leading-relaxed text-ink">
              <strong className="font-bold">Please have this reviewed before you go live.</strong> This text describes
              how the business actually works and is a sound starting point, but it has not been checked by a lawyer.
              Replace it with your own reviewed wording from the admin panel before trading on it.
            </p>
          </div>

          <div className="mt-10 space-y-10">
            {sections.map((s) => (
              <section key={s.heading} id={s.id}>
                <h2 className="text-xl sm:text-2xl">{s.heading}</h2>
                {s.paragraphs.map((p, i) => (
                  <p key={i} className="mt-3 text-[15px] leading-relaxed text-ink-muted">{p}</p>
                ))}
                {s.bullets && s.bullets.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex gap-3 text-[15px] leading-relaxed text-ink-muted">
                        <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-turquoise" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <p className="mt-12 rounded-xl bg-surface-muted p-5 text-[15px] leading-relaxed text-ink">
            {contactLine}
          </p>
        </Container>
      </Section>
    </>
  );
}
