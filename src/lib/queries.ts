import { cache } from "react";
import { unstable_cache } from "next/cache";
import { db } from "./db";
import type { Prisma } from "@prisma/client";

/**
 * Centralized read queries (Phase 1/39). Server components import from here so
 * data-access rules live in one place. `cache()` dedupes within a request;
 * `unstable_cache` caches read-heavy, rarely-changing data across requests
 * (Phase 3/32) with tags so admin edits can revalidate.
 */

export const PACKAGE_PAGE_SIZE = 9;

export const getPopularDestinations = unstable_cache(
  async () => {
    return db.destination.findMany({
      where: { isPublished: true, isPopular: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true, slug: true, name: true, country: true, thumbnail: true,
        shortSummary: true,
        _count: { select: { packages: { where: { status: "PUBLISHED" } } } },
      },
    });
  },
  ["popular-destinations"],
  { revalidate: 3600, tags: ["destinations"] }
);

export const getAllDestinations = unstable_cache(
  async () => {
    return db.destination.findMany({
      where: { isPublished: true },
      orderBy: [{ isPopular: "desc" }, { sortOrder: "asc" }],
      select: {
        id: true, slug: true, name: true, country: true, region: true,
        thumbnail: true, shortSummary: true,
        _count: { select: { packages: { where: { status: "PUBLISHED" } } } },
      },
    });
  },
  ["all-destinations"],
  { revalidate: 3600, tags: ["destinations"] }
);

export const getDestinationBySlug = cache(async (slug: string) => {
  return db.destination.findFirst({
    where: { slug, isPublished: true },
    include: {
      categories: { include: { category: true } },
      faqs: { orderBy: { sortOrder: "asc" } },
      guides: { where: { isPublished: true }, take: 4, orderBy: { publishedAt: "desc" } },
    },
  });
});

export type PackageListItem = {
  id: string;
  slug: string;
  name: string;
  theme: string | null;
  destination: { name: string; slug: string };
  cover: string | null;
  nights: number;
  days: number;
  basePrice: number;
  currency: string;
  summary: string | null;
};

function toListItem(p: PackageWithVersion): PackageListItem {
  const v = p.currentVersion!;
  return {
    id: p.id, slug: p.slug, name: p.name, theme: p.theme,
    destination: { name: p.destination.name, slug: p.destination.slug },
    cover: v.images[0]?.url ?? null,
    nights: v.durationNights, days: v.durationDays,
    basePrice: v.basePrice, currency: v.currency, summary: v.summary,
  };
}

const packageWithVersionArgs = {
  include: {
    destination: { select: { name: true, slug: true } },
    currentVersion: { include: { images: { where: { isCover: true }, take: 1 } } },
  },
} satisfies Prisma.PackageDefaultArgs;
type PackageWithVersion = Prisma.PackageGetPayload<typeof packageWithVersionArgs>;

export type PackageFilters = {
  page?: number;
  destination?: string;
  theme?: string;
  q?: string;
  sort?: "popular" | "price-asc" | "price-desc";
};

export async function listPackages(filters: PackageFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const where: Prisma.PackageWhereInput = {
    status: "PUBLISHED",
    ...(filters.destination ? { destination: { slug: filters.destination } } : {}),
    ...(filters.theme ? { theme: filters.theme } : {}),
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q } },
            { destination: { name: { contains: filters.q } } },
            { destination: { country: { contains: filters.q } } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.PackageOrderByWithRelationInput[] =
    filters.sort === "price-asc" || filters.sort === "price-desc"
      ? [{ currentVersion: { basePrice: filters.sort === "price-asc" ? "asc" : "desc" } }]
      : [{ isFeatured: "desc" }, { createdAt: "desc" }];

  const [total, rows] = await Promise.all([
    db.package.count({ where }),
    db.package.findMany({
      where,
      orderBy,
      skip: (page - 1) * PACKAGE_PAGE_SIZE,
      take: PACKAGE_PAGE_SIZE,
      ...packageWithVersionArgs,
    }),
  ]);

  return {
    items: rows.filter((r) => r.currentVersion).map(toListItem),
    total,
    page,
    pageSize: PACKAGE_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PACKAGE_PAGE_SIZE)),
  };
}

export async function getFeaturedPackages(limit = 6): Promise<PackageListItem[]> {
  const rows = await db.package.findMany({
    where: { status: "PUBLISHED", isFeatured: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...packageWithVersionArgs,
  });
  return rows.filter((r) => r.currentVersion).map(toListItem);
}

export async function getPackagesForDestination(destinationSlug: string, theme?: string): Promise<PackageListItem[]> {
  const rows = await db.package.findMany({
    where: { status: "PUBLISHED", destination: { slug: destinationSlug }, ...(theme ? { theme } : {}) },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    ...packageWithVersionArgs,
  });
  return rows.filter((r) => r.currentVersion).map(toListItem);
}

export const getPackageBySlug = cache(async (slug: string) => {
  const pkg = await db.package.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      destination: { select: { name: true, slug: true, country: true } },
      faqs: { orderBy: { sortOrder: "asc" } },
      currentVersion: {
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          days: { orderBy: { dayNumber: "asc" }, include: { items: { orderBy: { sortOrder: "asc" } } } },
          options: { where: { isEnabled: true }, orderBy: { sortOrder: "asc" } },
          departures: { where: { isEnabled: true }, orderBy: { date: "asc" } },
        },
      },
    },
  });
  if (!pkg || !pkg.currentVersion) return null;
  return pkg;
});

export type PackageDetail = NonNullable<Awaited<ReturnType<typeof getPackageBySlug>>>;

export async function getActiveOffers() {
  return db.offer.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 6 });
}

export async function getGlobalFaqs() {
  return db.faq.findMany({ where: { scope: "GLOBAL" }, orderBy: { sortOrder: "asc" } });
}

/** Published-review fetch — returns [] when there are none (never fabricated). */
export async function getPublishedReviews(limit = 6) {
  return db.review.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { customer: { select: { fullName: true } }, package: { select: { name: true } } },
  });
}
