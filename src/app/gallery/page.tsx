import type { Metadata } from "next";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { BreadcrumbJsonLd } from "@/components/layout/structured-data";
import { EmptyState } from "@/components/ui/states";
import { buttonVariants } from "@/components/ui/button";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { GALLERY_CATEGORIES, getGalleryItems } from "@/lib/queries";
import { getSiteSettings } from "@/lib/site-settings";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    title: "Gallery",
    description: `Photographs from across the Andaman Islands — beaches, reefs, island crossings and resort stays arranged by ${s.brandName}.`,
    alternates: { canonical: "/gallery" },
    openGraph: { title: `Gallery · ${s.brandName}`, url: "/gallery" },
  };
}

export default async function GalleryPage() {
  const [items, settings] = await Promise.all([getGalleryItems(), getSiteSettings()]);

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Gallery", href: "/gallery" },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={crumbs} />
      <PageHeader
        eyebrow="Gallery"
        title="The Andamans, in photographs"
        description={`Beaches, reefs, island crossings and the places we take our travellers. ${settings.brandName} arranges every one of them.`}
        breadcrumbs={crumbs}
      />

      <Section>
        <Container>
          {items.length ? (
            <GalleryGrid
              items={items.map((i) => ({
                id: i.id, url: i.url, alt: i.alt, caption: i.caption, location: i.location, category: i.category,
              }))}
              categories={GALLERY_CATEGORIES.map((c) => ({ key: c.key, label: c.label }))}
            />
          ) : (
            <EmptyState
              icon={<ImageOff className="h-5 w-5" />}
              title="No photographs published yet"
              description="Our gallery will appear here as soon as photographs are published."
              action={{ label: "Browse holiday packages", href: "/packages" }}
            />
          )}

          <div className="mt-14 rounded-2xl border border-surface-border bg-surface-muted p-8 text-center">
            <h2 className="text-xl sm:text-2xl">Want to see these places for yourself?</h2>
            <p className="mx-auto mt-2.5 max-w-xl text-sm leading-relaxed text-ink-muted">
              Tell us your dates and group size and we will put together an itinerary and a written quotation.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className={buttonVariants({ variant: "orange" })}>Plan my trip</Link>
              <Link href="/packages" className={buttonVariants({ variant: "outline" })}>See the packages</Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
