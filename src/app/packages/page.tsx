import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SearchX, CalendarCheck, Info } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { BreadcrumbJsonLd } from "@/components/layout/structured-data";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/states";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { PackageCard } from "@/components/package/package-card";
import { PackageFilters } from "@/components/package/package-filters";
import { parseRange } from "@/lib/filters";
import { getAndamanDestinations, listPackages, type PackageFilters as Filters } from "@/lib/queries";
import { getSiteSettings, promoIsActive } from "@/lib/site-settings";
import { formatDate } from "@/lib/utils";

export const revalidate = 300;

/**
 * No `loading.tsx` in this segment on purpose.
 *
 * A loading file applies to the whole `/packages` segment INCLUDING
 * `/packages/[slug]`, and the Suspense boundary it creates flushes the
 * response shell — committing HTTP 200 — before a package page can call
 * `notFound()`. That turned every unknown or unpublished package into a soft
 * 404 that search engines would happily index. The listing below has its own
 * Suspense boundaries for the parts that actually need them.
 */

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    title: "Andaman holiday packages",
    description: `Andaman holiday packages from ${s.brandName} — 5 nights and 6 days across Port Blair, Havelock and Neil, in hotel categories from budget to 4 star.`,
    alternates: { canonical: "/packages" },
    openGraph: { title: `Andaman holiday packages · ${s.brandName}`, url: "/packages" },
  };
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function PackagesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const duration = parseRange(first(sp.duration));
  const price = parseRange(first(sp.price));
  const group = Number(first(sp.group));

  const filters: Filters = {
    page: Number(first(sp.page) ?? 1) || 1,
    destination: first(sp.destination),
    theme: first(sp.theme),
    q: first(sp.q),
    sort: (first(sp.sort) as Filters["sort"]) ?? "popular",
    minNights: duration.min,
    maxNights: duration.max,
    minPrice: price.min,
    maxPrice: price.max,
    groupSize: Number.isFinite(group) && group > 0 ? group : undefined,
  };

  const [settings, destinations] = await Promise.all([getSiteSettings(), getAndamanDestinations()]);
  const promoLive = promoIsActive(settings);

  // Preserve the whole filter state across pagination links.
  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    for (const key of ["destination", "theme", "duration", "price", "group", "q"] as const) {
      const v = first(sp[key]);
      if (v) params.set(key, v);
    }
    const sort = first(sp.sort);
    if (sort && sort !== "popular") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `/packages?${qs}` : "/packages";
  };

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Holiday packages", href: "/packages" },
  ];

  // Only islands that actually have packages are offered as a filter.
  const filterDestinations = destinations
    .filter((d) => d.packageCount > 0)
    .map((d) => ({ slug: d.slug, name: d.name }));

  return (
    <>
      <BreadcrumbJsonLd items={crumbs} />
      <PageHeader
        eyebrow="Holiday packages"
        title="Find your perfect Andaman escape"
        description="Five nights and six days across Port Blair, Havelock and Neil. Choose the hotel category that suits your group — every itinerary is ours to adjust."
        breadcrumbs={crumbs}
      />

      <Section className="pt-8">
        <Container>
          {promoLive ? (
            <p className="mb-5 flex flex-wrap items-center gap-2 rounded-xl bg-brand-orangeLight px-4 py-3 text-sm font-semibold text-brand-orangeDark">
              <CalendarCheck className="h-4 w-4 shrink-0" />
              Promotional rates valid for travel {formatDate(settings.promoValidFrom)} – {formatDate(settings.promoValidTo)} · minimum {settings.defaultMinTravellers} travellers
            </p>
          ) : (
            <p className="mb-5 flex flex-wrap items-center gap-2 rounded-xl bg-surface-muted px-4 py-3 text-sm font-semibold text-ink-muted">
              <Info className="h-4 w-4 shrink-0" />
              Our promotional window has closed. Send us an enquiry for current rates on your dates.
            </p>
          )}

          <Suspense fallback={<div className="h-24 rounded-2xl bg-surface-muted" />}>
            <PackageFilters destinations={filterDestinations} />
          </Suspense>

          <Suspense key={JSON.stringify(filters)} fallback={<GridSkeleton />}>
            <Results filters={filters} buildHref={buildHref} disclaimer={settings.priceDisclaimer} />
          </Suspense>
        </Container>
      </Section>
    </>
  );
}

async function Results({
  filters,
  buildHref,
  disclaimer,
}: {
  filters: Filters;
  buildHref: (p: number) => string;
  disclaimer: string;
}) {
  const { items, total, page, totalPages } = await listPackages(filters);

  if (!items.length) {
    return (
      <div className="mt-8">
        <EmptyState
          icon={<SearchX className="h-5 w-5" />}
          title="No packages match those filters"
          description="Try widening the price range or the hotel category — or tell us what you have in mind and we will build it."
          action={{ label: "Clear all filters", href: "/packages" }}
        />
        <p className="mt-5 text-center text-sm text-ink-muted">
          Prefer to just ask?{" "}
          <Link href="/contact" className="font-bold text-brand-blue underline-offset-2 hover:underline">
            Send us an enquiry
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="mt-6 text-sm font-semibold text-ink-muted">
        <span className="tabular">{total}</span> package{total === 1 ? "" : "s"}
        {filters.q ? ` matching “${filters.q}”` : ""}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p, i) => (
          <PackageCard key={p.id} pkg={p} priority={i < 3} />
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />

      <p className="mt-10 rounded-xl bg-surface-muted p-5 text-sm leading-relaxed text-ink-muted">
        <strong className="font-bold text-ink">About these prices.</strong> {disclaimer}
      </p>
    </>
  );
}

function GridSkeleton() {
  return (
    <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-surface-border">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-8 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
