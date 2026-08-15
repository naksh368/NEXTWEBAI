import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/states";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageCard } from "@/components/package/package-card";
import { PackageFilters } from "@/components/package/package-filters";
import { listPackages, type PackageFilters as Filters } from "@/lib/queries";
import { SearchX } from "lucide-react";

export const metadata: Metadata = {
  title: "Holiday packages",
  description: "Browse and customize complete holiday packages with clear, server-verified pricing.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function PackagesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const filters: Filters = {
    page: Number(first(sp.page) ?? 1) || 1,
    destination: first(sp.destination),
    theme: first(sp.theme),
    q: first(sp.q),
    sort: (first(sp.sort) as Filters["sort"]) ?? "popular",
  };

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    if (filters.destination) params.set("destination", filters.destination);
    if (filters.theme) params.set("theme", filters.theme);
    if (filters.q) params.set("q", filters.q);
    if (filters.sort && filters.sort !== "popular") params.set("sort", filters.sort);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `/packages?${qs}` : "/packages";
  };

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Packages" }]} />
      <div className="mt-4">
        <h1 className="text-3xl font-bold">Holiday packages</h1>
        <p className="mt-1.5 text-ink-muted">Complete holidays you can tailor to your taste — priced transparently.</p>
      </div>

      <div className="mt-6">
        <Suspense fallback={<div className="h-10" />}>
          <PackageFilters />
        </Suspense>
      </div>

      <Suspense key={JSON.stringify(filters)} fallback={<GridSkeleton />}>
        <Results filters={filters} buildHref={buildHref} />
      </Suspense>
    </Container>
  );
}

async function Results({ filters, buildHref }: { filters: Filters; buildHref: (p: number) => string }) {
  const { items, total, page, totalPages } = await listPackages(filters);

  if (!items.length) {
    return (
      <div className="mt-8">
        <EmptyState
          icon={<SearchX className="h-5 w-5" />}
          title="No packages found"
          description="Try clearing filters or searching a different destination."
          action={{ label: "Clear filters", href: "/packages" }}
        />
      </div>
    );
  }

  return (
    <>
      <p className="mt-6 text-sm text-ink-muted">
        {total} package{total === 1 ? "" : "s"} found{filters.q ? ` for “${filters.q}”` : ""}
      </p>
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p, i) => (
          <PackageCard key={p.id} pkg={p} priority={i < 3} />
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
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
