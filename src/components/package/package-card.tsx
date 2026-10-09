import Link from "next/link";
import { MapPin, Clock, ArrowRight, Check, Users, BedDouble } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge } from "@/components/ui/badge";
import { EnquireButton } from "@/components/package/enquire-button";
import { SaveButton } from "@/components/package/save-button";
import { formatINR } from "@/lib/utils";
import type { PackageListItem } from "@/lib/queries";

/** Public label for a package tier. Unknown themes simply show nothing. */
export const TIER_LABEL: Record<string, string> = {
  BUDGET: "Budget",
  STANDARD: "Standard",
  TWO_STAR: "2 Star",
  THREE_STAR: "3 Star",
  FOUR_STAR: "4 Star",
  FIVE_STAR: "5 Star",
  HONEYMOON: "Honeymoon",
  FAMILY: "Family",
  LUXURY: "Luxury",
  GROUP: "Group",
};

/**
 * Inclusion chips, read from this package's own saved inclusions. Nothing is
 * assumed: a package that does not include breakfast never shows a breakfast
 * chip.
 */
function inclusionChips(pkg: PackageListItem): string[] {
  const text = pkg.inclusions.join(" · ").toLowerCase();
  const chips: string[] = [];
  if (/breakfast/.test(text)) chips.push("Breakfast");
  if (/air-conditioned|\bac\b/.test(text)) chips.push("AC transport");
  if (/ferry|inter-island/.test(text)) chips.push("Island ferries");
  if (/sightseeing/.test(text)) chips.push("Sightseeing");
  if (/assistance/.test(text)) chips.push("Travel assistance");
  if (chips.length) return chips.slice(0, 4);
  // No structured inclusions saved yet — show the duration instead of guessing.
  return [`${pkg.nights} nights' stay`];
}

export function PackageCard({
  pkg,
  priority,
  matchPct,
  reasons,
}: {
  pkg: PackageListItem;
  priority?: boolean;
  matchPct?: number;
  reasons?: string[];
}) {
  const tier = pkg.theme ? TIER_LABEL[pkg.theme] : null;
  const priceBasis = pkg.perPersonPricing ? "per person" : "per group";

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-surface-border bg-white shadow-card transition-shadow duration-200 hover:shadow-cardHover">
      <Link href={`/packages/${pkg.slug}`} className="relative block aspect-[4/3] w-full" tabIndex={-1} aria-hidden>
        <SmartImage
          src={pkg.cover}
          alt={pkg.name}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={priority}
          imgClassName="transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/35 via-transparent to-transparent" aria-hidden />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {tier && <Badge tone="brand">{tier}</Badge>}
          {pkg.isFeatured && <Badge tone="info">Popular</Badge>}
        </div>
        {typeof matchPct === "number" && (
          <div className="absolute bottom-3 left-3 rounded-full bg-success px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            {matchPct}% match
          </div>
        )}
      </Link>

      <div className="pointer-events-none absolute right-3 top-3">
        <div className="pointer-events-auto">
          <SaveButton slug={pkg.slug} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-ink-muted">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-brand-turquoiseDark" />
            {pkg.destination.name}
          </span>
          <span className="text-ink-faint" aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {pkg.nights}N / {pkg.days}D
          </span>
          {pkg.minTravellers > 1 && (
            <>
              <span className="text-ink-faint" aria-hidden>·</span>
              <span className="inline-flex items-center gap-1 text-brand-orangeDark">
                <Users className="h-3.5 w-3.5" />
                Min {pkg.minTravellers} pax
              </span>
            </>
          )}
        </div>

        <h3 className="mt-2">
          <Link href={`/packages/${pkg.slug}`} className="line-clamp-2 text-[17px] font-bold text-brand-navy transition-colors group-hover:text-brand-blue">
            {pkg.name}
          </Link>
        </h3>

        {pkg.roomCategory && (
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
            <BedDouble className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
            <span className="line-clamp-1">{pkg.roomCategory}</span>
          </p>
        )}

        {pkg.cityBreakdown && pkg.cityBreakdown.length > 0 ? (
          <p className="mt-2 line-clamp-1 text-xs font-medium text-ink-muted">
            {pkg.cityBreakdown.map((c, i) => (
              <span key={c.city}>
                {i > 0 && <span className="text-ink-faint"> › </span>}
                {c.city} <span className="text-ink-faint">({c.nights}N)</span>
              </span>
            ))}
          </p>
        ) : pkg.summary ? (
          <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{pkg.summary}</p>
        ) : null}

        {reasons && reasons.length > 0 && (
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {reasons.slice(0, 3).map((r) => (
              <li key={r} className="inline-flex items-center gap-1 rounded-full bg-[#E7F6EC] px-2 py-0.5 text-[11px] font-semibold text-success">
                <Check className="h-3 w-3 shrink-0" /> {r}
              </li>
            ))}
          </ul>
        )}

        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
          {inclusionChips(pkg).map((c) => (
            <li key={c} className="inline-flex items-center gap-1 text-xs font-semibold text-ink">
              <Check className="h-3.5 w-3.5 shrink-0 text-success" /> {c}
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between gap-3 border-t border-surface-border pt-3.5">
            {pkg.pricingStatus === "PRICE_REVIEW_REQUIRED" ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Pricing</p>
                <p className="text-base font-extrabold text-brand-navy">On request</p>
              </div>
            ) : (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Starting from</p>
                <p className="tabular text-xl font-extrabold leading-tight text-brand-navy">
                  {formatINR(pkg.basePrice)}
                  <span className="ml-1 text-xs font-semibold text-ink-muted">{priceBasis}</span>
                </p>
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <EnquireButton packageName={pkg.name} packageSlug={pkg.slug} label="Enquire Now" className="!h-10 text-sm" />
            <Link
              href={`/packages/${pkg.slug}`}
              className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-brand-blue text-sm font-bold text-white transition-colors hover:bg-brand-blueDark"
            >
              View Details <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
