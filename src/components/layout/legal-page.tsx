import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { BreadcrumbJsonLd } from "@/components/layout/structured-data";
import { formatDate } from "@/lib/utils";

export type LegalSection = { id?: string; heading: string; paragraphs: string[]; bullets?: string[] };

/**
 * Shared layout for the policy pages.
 *
 * The copy is written from how the business actually operates and is edited
 * like any other content. The page shows the date it was last updated so a
 * reader can see how current it is.
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
          <p className="text-sm font-semibold text-ink-muted">Last updated {formatDate(lastUpdated)}</p>

          <div className="mt-8 space-y-10">
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
