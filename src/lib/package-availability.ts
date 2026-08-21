/**
 * Whether a package VERSION may be priced and booked.
 *
 * The admin publishes at the PACKAGE level (package.status), so a version's own
 * isPublished flag can lag behind. A version is sellable if it is explicitly
 * published, OR it is the current version of a PUBLISHED package. This is the
 * single source of truth used by pricing-service and booking-service so the two
 * can never disagree (the bug where a live package showed
 * "This package is no longer available" and disabled booking).
 */
export function isVersionSellable(args: {
  isPublished: boolean;
  packageStatus?: string | null;
  packageCurrentVersionId?: string | null;
  versionId: string;
}): boolean {
  if (args.isPublished) return true;
  return args.packageStatus === "PUBLISHED" && args.packageCurrentVersionId === args.versionId;
}
