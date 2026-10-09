import { getSiteUrl } from "@/lib/utils";
import type { SiteSettings } from "@/lib/site-settings";

/**
 * JSON-LD for the business.
 *
 * Only facts an administrator has actually entered are emitted: a missing
 * phone, email, address or rating is simply left out rather than guessed, so
 * the structured data can never claim something the site does not show.
 */
export function TravelAgencyJsonLd({ settings }: { settings: SiteSettings }) {
  const siteUrl = getSiteUrl();
  const address = settings.addressLines.filter(Boolean);
  const socials = Object.values(settings.social).filter(Boolean);

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: settings.brandName,
    url: siteUrl,
    description: settings.seoDescription,
    areaServed: { "@type": "Place", name: "Andaman and Nicobar Islands, India" },
  };

  if (settings.logoUrl) data.logo = new URL(settings.logoUrl, siteUrl).toString();
  if (settings.phonePrimaryE164) data.telephone = `+${settings.phonePrimaryE164.replace(/\D/g, "")}`;
  if (settings.email) data.email = settings.email;
  if (socials.length) data.sameAs = socials;

  if (address.length) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: address.slice(0, -1).join(", ") || address[0],
      addressRegion: "Andaman and Nicobar Islands",
      addressCountry: "IN",
    };
  }

  // A rating is published only when the agency entered both a score and a count.
  if (settings.reviewScore !== null && settings.reviewCount !== null && settings.reviewCount > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: settings.reviewScore,
      reviewCount: settings.reviewCount,
      bestRating: 5,
    };
  }

  return (
    <script
      type="application/ld+json"
      // Values come from the admin settings document, never from user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Breadcrumb trail for search results. */
export function BreadcrumbJsonLd({ items }: { items: { label: string; href: string }[] }) {
  const siteUrl = getSiteUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      item: new URL(item.href, siteUrl).toString(),
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
