import { cache } from "react";
import { unstable_cache } from "next/cache";
import { db } from "./db";
import type { Prisma } from "@prisma/client";

/**
 * Centralized read queries (Phase 1/39). Server components import from here so
 * data-access rules live in one place. `cache()` dedupes within a request;
 * `unstable_cache` caches read-heavy, rarely-changing data across requests.
 *
 * Every query is wrapped so that if the database is momentarily unavailable
 * (e.g. during a build before migrations, or a transient outage) the page
 * renders with empty data instead of crashing the whole build/request.
 */

export const PACKAGE_PAGE_SIZE = 9;

/** Run a query, returning `fallback` if the DB throws (never crash the build). */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.error("query failed (using fallback):", (e as Error).message);
    return fallback;
  }
}

export const getPopularDestinations = unstable_cache(
  async () =>
    safe(
      () =>
        db.destination.findMany({
          where: { isPublished: true, isPopular: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true, slug: true, name: true, country: true, thumbnail: true,
            shortSummary: true,
            _count: { select: { packages: { where: { status: "PUBLISHED" } } } },
          },
        }),
      []
    ),
  ["popular-destinations"],
  { revalidate: 3600, tags: ["destinations"] }
);

export const getAllDestinations = unstable_cache(
  async () =>
    safe(
      () =>
        db.destination.findMany({
          where: { isPublished: true },
          orderBy: [{ isPopular: "desc" }, { sortOrder: "asc" }],
          select: {
            id: true, slug: true, name: true, country: true, region: true,
            thumbnail: true, shortSummary: true,
            _count: { select: { packages: { where: { status: "PUBLISHED" } } } },
          },
        }),
      []
    ),
  ["all-destinations"],
  { revalidate: 3600, tags: ["destinations"] }
);

export const getDestinationBySlug = cache(async (slug: string) =>
  safe(
    () =>
      db.destination.findFirst({
        where: { slug, isPublished: true },
        include: {
          categories: { include: { category: true } },
          faqs: { orderBy: { sortOrder: "asc" } },
          guides: { where: { isPublished: true }, take: 4, orderBy: { publishedAt: "desc" } },
        },
      }),
    null
  )
);

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
  pricingStatus: string;
  availabilityStatus: string;
  roomCategory?: string | null;
  mealPlan?: string | null;
  flightSector?: string | null;
  cityBreakdown?: { city: string; nights: number }[];
  /** Minimum group size the advertised rate applies to (e.g. "MIN 4 PAX"). */
  minTravellers: number;
  /** True when the price is per person; false when it is a whole-group rate. */
  perPersonPricing: boolean;
  /** Top inclusions, as configured on this package only. */
  inclusions: string[];
  isFeatured: boolean;
};

function toListItem(p: PackageWithVersion): PackageListItem {
  const v = p.currentVersion!;
  return {
    id: p.id, slug: p.slug, name: p.name, theme: p.theme,
    destination: { name: p.destination.name, slug: p.destination.slug },
    cover: v.images[0]?.url ?? null,
    nights: v.durationNights, days: v.durationDays,
    basePrice: v.basePrice, currency: v.currency, summary: v.summary,
    pricingStatus: v.pricingStatus, availabilityStatus: v.availabilityStatus,
    roomCategory: v.roomCategory, mealPlan: v.mealPlan, flightSector: v.flightSector,
    cityBreakdown: Array.isArray(v.cityBreakdown)
      ? (v.cityBreakdown as unknown[]).map((c) => c as { city: string; nights: number }).filter((c) => c && typeof c.city === "string").slice(0, 8)
      : undefined,
    minTravellers: v.minTravellers,
    perPersonPricing: v.perPersonPricing,
    inclusions: asStringList(v.inclusions),
    isFeatured: p.isFeatured,
  };
}

/** Narrow an untyped Json column to a clean string[] (never throws). */
export function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
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
  /** Hotel tier: BUDGET | STANDARD | TWO_STAR | THREE_STAR | FOUR_STAR. */
  theme?: string;
  q?: string;
  sort?: "popular" | "price-asc" | "price-desc" | "duration-asc";
  /** Inclusive nights range. */
  minNights?: number;
  maxNights?: number;
  /** Inclusive price range, whole rupees. */
  minPrice?: number;
  maxPrice?: number;
  /** Only packages whose advertised rate applies at this group size or below. */
  groupSize?: number;
};

export async function listPackages(filters: PackageFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const empty = { items: [] as PackageListItem[], total: 0, page, pageSize: PACKAGE_PAGE_SIZE, totalPages: 1 };
  return safe(async () => {
    const where: Prisma.PackageWhereInput = {
      status: "PUBLISHED",
      ...(filters.destination ? { destination: { slug: filters.destination } } : {}),
      ...(filters.theme ? { theme: filters.theme } : {}),
      ...(filters.minNights || filters.maxNights || filters.minPrice || filters.maxPrice || filters.groupSize
        ? {
            currentVersion: {
              ...(filters.minNights || filters.maxNights
                ? { durationNights: { ...(filters.minNights ? { gte: filters.minNights } : {}), ...(filters.maxNights ? { lte: filters.maxNights } : {}) } }
                : {}),
              ...(filters.minPrice || filters.maxPrice
                ? { basePrice: { ...(filters.minPrice ? { gte: filters.minPrice } : {}), ...(filters.maxPrice ? { lte: filters.maxPrice } : {}) } }
                : {}),
              // "I am N travellers" → show packages whose minimum is within reach.
              ...(filters.groupSize ? { minTravellers: { lte: filters.groupSize } } : {}),
            },
          }
        : {}),
      ...(filters.q
        ? {
            OR: [
              { name: { contains: filters.q, mode: "insensitive" } },
              { currentVersion: { summary: { contains: filters.q, mode: "insensitive" } } },
              { currentVersion: { roomCategory: { contains: filters.q, mode: "insensitive" } } },
              { destination: { name: { contains: filters.q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.PackageOrderByWithRelationInput[] =
      filters.sort === "price-asc" || filters.sort === "price-desc"
        ? [{ currentVersion: { basePrice: filters.sort === "price-asc" ? "asc" : "desc" } }]
        : filters.sort === "duration-asc"
          ? [{ currentVersion: { durationNights: "asc" } }]
          : [{ isFeatured: "desc" }, { currentVersion: { basePrice: "asc" } }];

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
  }, empty);
}

export async function getFeaturedPackages(limit = 6): Promise<PackageListItem[]> {
  return safe(async () => {
    const rows = await db.package.findMany({
      where: { status: "PUBLISHED", isFeatured: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...packageWithVersionArgs,
    });
    return rows.filter((r) => r.currentVersion).map(toListItem);
  }, []);
}

/** Fetch published package cards by slug, preserving the given order (for the wishlist). */
export async function getPackagesBySlugs(slugs: string[]): Promise<PackageListItem[]> {
  const clean = [...new Set(slugs.filter(Boolean))].slice(0, 30);
  if (!clean.length) return [];
  return safe(async () => {
    const rows = await db.package.findMany({
      where: { status: "PUBLISHED", slug: { in: clean } },
      ...packageWithVersionArgs,
    });
    const items = rows.filter((r) => r.currentVersion).map(toListItem);
    const bySlug = new Map(items.map((i) => [i.slug, i]));
    return clean.map((s) => bySlug.get(s)).filter((x): x is PackageListItem => Boolean(x));
  }, []);
}

export async function getPackagesForDestination(destinationSlug: string, theme?: string): Promise<PackageListItem[]> {
  return safe(async () => {
    const rows = await db.package.findMany({
      where: { status: "PUBLISHED", destination: { slug: destinationSlug }, ...(theme ? { theme } : {}) },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      ...packageWithVersionArgs,
    });
    return rows.filter((r) => r.currentVersion).map(toListItem);
  }, []);
}

export const getPackageBySlug = cache(async (slug: string) =>
  safe(async () => {
    const pkg = await db.package.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: {
        destination: { select: { name: true, slug: true, country: true } },
        faqs: { orderBy: { sortOrder: "asc" } },
        reviews: {
          where: { status: "PUBLISHED" },
          orderBy: { createdAt: "desc" },
          include: { customer: { select: { fullName: true } } },
        },
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
  }, null)
);

/** Similar published packages — same destination first, then same theme. Never fabricated. */
export async function getSimilarPackages(destinationId: string, theme: string | null, excludePackageId: string, limit = 3): Promise<PackageListItem[]> {
  return safe(async () => {
    const rows = await db.package.findMany({
      where: {
        status: "PUBLISHED",
        id: { not: excludePackageId },
        OR: [{ destinationId }, ...(theme ? [{ theme }] : [])],
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: limit,
      include: {
        destination: { select: { name: true, slug: true } },
        currentVersion: { select: { basePrice: true, currency: true, summary: true, durationNights: true, durationDays: true, pricingStatus: true, availabilityStatus: true, roomCategory: true, mealPlan: true, minTravellers: true, perPersonPricing: true, inclusions: true, images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } } } },
      },
    });
    return rows
      .filter((p) => p.currentVersion)
      .map((p) => ({
        id: p.id, slug: p.slug, name: p.name, theme: p.theme,
        destination: { name: p.destination.name, slug: p.destination.slug },
        cover: p.currentVersion!.images[0]?.url ?? null,
        nights: p.currentVersion!.durationNights,
        days: p.currentVersion!.durationDays,
        basePrice: p.currentVersion!.basePrice,
        currency: p.currentVersion!.currency,
        summary: p.currentVersion!.summary,
        pricingStatus: p.currentVersion!.pricingStatus,
        availabilityStatus: p.currentVersion!.availabilityStatus,
        roomCategory: p.currentVersion!.roomCategory,
        mealPlan: p.currentVersion!.mealPlan,
        minTravellers: p.currentVersion!.minTravellers,
        perPersonPricing: p.currentVersion!.perPersonPricing,
        inclusions: asStringList(p.currentVersion!.inclusions),
        isFeatured: p.isFeatured,
      }));
  }, []);
}

export type PackageDetail = NonNullable<Awaited<ReturnType<typeof getPackageBySlug>>>;

export async function getActiveOffers() {
  return safe(() => db.offer.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 6 }), []);
}

export async function getGlobalFaqs() {
  return safe(() => db.faq.findMany({ where: { scope: "GLOBAL" }, orderBy: { sortOrder: "asc" } }), []);
}

/** Published-review fetch — returns [] when there are none (never fabricated). */
export async function getPublishedReviews(limit = 6) {
  return safe(
    () =>
      db.review.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { customer: { select: { fullName: true } }, package: { select: { name: true } } },
      }),
    []
  );
}

// ─────────────────────────────────────────────────────────────
// GALLERY · TESTIMONIALS · DESTINATION HUBS
// ─────────────────────────────────────────────────────────────

export const GALLERY_CATEGORIES = [
  { key: "BEACHES", label: "Beaches" },
  { key: "ISLANDS", label: "Islands" },
  { key: "SIGHTSEEING", label: "Sightseeing" },
  { key: "RESORTS", label: "Resorts" },
  { key: "EXPERIENCES", label: "Experiences" },
] as const;

export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number]["key"];

export function galleryCategoryLabel(key: string): string {
  return GALLERY_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

/** Published gallery images in the administrator's chosen order. */
export const getGalleryItems = unstable_cache(
  async (category?: string) =>
    safe(
      () =>
        db.galleryItem.findMany({
          where: { isPublished: true, ...(category ? { category } : {}) },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
          take: 120,
        }),
      []
    ),
  ["gallery-items"],
  { revalidate: 600, tags: ["gallery"] }
);

/**
 * Published testimonials only. Returns [] when the agency has not published
 * any — the homepage section then hides itself rather than inventing content.
 */
export const getPublishedTestimonials = unstable_cache(
  async (limit = 6) =>
    safe(
      () =>
        db.testimonial.findMany({
          where: { status: "PUBLISHED" },
          orderBy: [{ sortOrder: "asc" }, { reviewDate: "desc" }, { createdAt: "desc" }],
          take: limit,
        }),
      []
    ),
  ["published-testimonials"],
  { revalidate: 600, tags: ["testimonials"] }
);

/** The island base a sight is visited from, read off the destination record. */
function hubSlugOf(travelInfo: unknown, ownSlug: string): string {
  if (travelInfo && typeof travelInfo === "object" && !Array.isArray(travelInfo)) {
    const v = (travelInfo as Record<string, unknown>).hubSlug;
    if (typeof v === "string" && v) return v;
  }
  return ownSlug;
}

/** Normalise a place name so "Havelock Island" and "havelock island" match. */
function normalisePlace(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * How many published packages actually visit each place, keyed by the lower-cased
 * city name taken from every package's saved route (`cityBreakdown`).
 *
 * A package is stored against the island it is based in, so counting the
 * `destinationId` alone would report "0 packages" for Havelock and Neil even
 * though every itinerary sleeps there. The route is the honest source.
 */
async function routeCounts(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  const rows = await db.package.findMany({
    where: { status: "PUBLISHED" },
    select: { currentVersion: { select: { cityBreakdown: true } } },
  });
  for (const row of rows) {
    const route = row.currentVersion?.cityBreakdown;
    if (!Array.isArray(route)) continue;
    const seen = new Set<string>();
    for (const leg of route) {
      const city = (leg as { city?: unknown })?.city;
      if (typeof city !== "string" || !city.trim()) continue;
      const key = normalisePlace(city);
      if (seen.has(key)) continue; // one package counts once per place
      seen.add(key);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * Destinations for the "Explore Andaman" rail, each with the number of
 * packages that genuinely visit it.
 *
 * Resolution order: packages attached directly to this destination, then
 * packages whose route includes it by name, then — for a sight visited on a
 * day trip, such as Ross Island or the Cellular Jail — the packages that
 * visit its hub island.
 */
export const getAndamanDestinations = unstable_cache(
  async () =>
    safe(async () => {
      const [rows, byRoute] = await Promise.all([
        db.destination.findMany({
          where: { isPublished: true },
          orderBy: [{ sortOrder: "asc" }],
          select: {
            id: true, slug: true, name: true, country: true, region: true,
            thumbnail: true, heroImage: true, shortSummary: true, travelInfo: true,
            isPopular: true,
            _count: { select: { packages: { where: { status: "PUBLISHED" } } } },
          },
        }),
        routeCounts(),
      ]);

      const nameBySlug = new Map(rows.map((r) => [r.slug, r.name]));
      const directBySlug = new Map(rows.map((r) => [r.slug, r._count.packages]));

      return rows.map((r) => {
        const hub = hubSlugOf(r.travelInfo, r.slug);
        const hubName = nameBySlug.get(hub);
        const packageCount =
          r._count.packages ||
          byRoute.get(normalisePlace(r.name)) ||
          (hubName ? byRoute.get(normalisePlace(hubName)) ?? 0 : 0) ||
          directBySlug.get(hub) ||
          0;
        return { ...r, packageCount, hubSlug: hub };
      });
    }, []),
  ["andaman-destinations"],
  { revalidate: 3600, tags: ["destinations", "packages"] }
);

export type AndamanDestination = Awaited<ReturnType<typeof getAndamanDestinations>>[number];

/**
 * Packages relevant to a destination page.
 *
 * Direct matches first; then packages whose route visits this place by name;
 * then, for a day-trip sight, the packages based at its hub island.
 */
export async function getPackagesForDestinationOrHub(
  slug: string,
  travelInfo: unknown,
  name?: string
): Promise<{ items: PackageListItem[]; viaRoute: boolean }> {
  const direct = await getPackagesForDestination(slug);
  if (direct.length) return { items: direct, viaRoute: false };

  // Packages whose saved route includes this place by name.
  if (name) {
    const target = normalisePlace(name);
    const all = await safe(async () => {
      const rows = await db.package.findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ isFeatured: "desc" }, { currentVersion: { basePrice: "asc" } }],
        ...packageWithVersionArgs,
      });
      return rows.filter((r) => r.currentVersion).map(toListItem);
    }, [] as PackageListItem[]);

    const onRoute = all.filter((p) =>
      (p.cityBreakdown ?? []).some((leg) => normalisePlace(leg.city) === target)
    );
    if (onRoute.length) return { items: onRoute, viaRoute: true };

    // Finally, the hub island this sight is visited from.
    const hub = hubSlugOf(travelInfo, slug);
    if (hub !== slug) {
      const hubItems = await getPackagesForDestination(hub);
      if (hubItems.length) return { items: hubItems, viaRoute: true };
    }
    // Nothing matched by name or hub — fall back to everything published, which
    // is honest for a sight that every one of our itineraries happens to cover.
    return { items: [], viaRoute: false };
  }

  const hub = hubSlugOf(travelInfo, slug);
  if (hub === slug) return { items: [], viaRoute: false };
  const items = await getPackagesForDestination(hub);
  return { items, viaRoute: items.length > 0 };
}

/** The lowest published starting price across the catalogue, or null. */
export async function getStartingPrice(): Promise<number | null> {
  return safe(async () => {
    const row = await db.packageVersion.findFirst({
      where: { currentOf: { status: "PUBLISHED" }, pricingStatus: { not: "PRICE_REVIEW_REQUIRED" } },
      orderBy: { basePrice: "asc" },
      select: { basePrice: true },
    });
    return row?.basePrice ?? null;
  }, null);
}
