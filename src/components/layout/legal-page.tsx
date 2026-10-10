import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { BreadcrumbJsonLd } from "@/components/layout/structured-data";
import { RichBlocks } from "@/components/ui/rich-blocks";
import { fillTokens, type LegalContent } from "@/lib/page-content";
import type { SiteSettings } from "@/lib/site-settings";
import { formatDate, slugify } from "@/lib/utils";

/**
 * Shared layout for the policy pages. The words come from Admin → Pages; this
 * component only lays them out and fills in the business details.
 */
export function LegalPage({
  content,
  settings,
  crumbLabel,
  crumbHref,
}: {
  content: LegalContent;
  settings: SiteSettings;
  crumbLabel: string;
  crumbHref: string;
}) {
  const fill = (t: string) => fillTokens(t, settings);
  const crumbs = [
    { label: "Home", href: "/" },
    { label: crumbLabel, href: crumbHref },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={crumbs} />
      <PageHeader eyebrow="Legal" title={fill(content.title)} description={fill(content.intro)} breadcrumbs={crumbs} />

      <Section>
        <Container className="max-w-3xl">
          {content.updatedAt && <p className="text-sm font-semibold text-ink-muted">Last updated {formatDate(content.updatedAt)}</p>}

          <div className="mt-8 space-y-10">
            {content.sections.map((s, i) => (
              <section key={`${i}-${s.heading}`} id={s.id || slugify(s.heading.replace(/^\d+\.\s*/, ""))}>
                <h2 className="text-xl sm:text-2xl">{fill(s.heading)}</h2>
                <RichBlocks text={fill(s.body)} className="mt-3" />
              </section>
            ))}
          </div>

          {content.contactLine.trim() && (
            <p className="mt-12 rounded-xl bg-surface-muted p-5 text-[15px] leading-relaxed text-ink">{fill(content.contactLine)}</p>
          )}
        </Container>
      </Section>
    </>
  );
}
