import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { getSiteUrl } from "@/lib/utils";

// Never prerender the sitemap at build (it queries the DB) — generate it at
// request time so the build can't fail if the DB isn't ready yet.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  try {

  const [destinations, packages] = await Promise.all([
    db.destination.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
    db.package.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/packages`, priority: 0.9 },
    { url: `${base}/destinations`, priority: 0.8 },
    { url: `${base}/offers`, priority: 0.6 },
    { url: `${base}/ai`, priority: 0.6 },
  ].map((r) => ({ ...r, lastModified: new Date(), changeFrequency: "weekly" as const }));

  return [
    ...staticRoutes,
    ...destinations.map((d) => ({ url: `${base}/destinations/${d.slug}`, lastModified: d.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...packages.map((p) => ({ url: `${base}/packages/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
  } catch {
    // DB not ready — return the static routes so the build/route never fails.
    return [
      { url: `${base}/`, priority: 1, lastModified: new Date(), changeFrequency: "weekly" as const },
      { url: `${base}/packages`, priority: 0.9, lastModified: new Date(), changeFrequency: "weekly" as const },
    ];
  }
}
