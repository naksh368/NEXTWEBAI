import Link from "next/link";
import { MapPin, Clock, ArrowRight, Check } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge } from "@/components/ui/badge";
import { EnquireButton } from "@/components/package/enquire-button";
import { SaveButton } from "@/components/package/save-button";
import { formatINR } from "@/lib/utils";
import type { PackageListItem } from "@/lib/queries";

/** Honest inclusion chips — only shown when the package actually has the data. */
function inclusionChips(pkg: PackageListItem): string[] {
  const chips: string[] = [];
  if (pkg.roomCategory) chips.push(pkg.roomCategory.replace(/hotel/i, "").trim() ? `${pkg.roomCategory}` : "Hotel");
  else chips.push(`${pkg.nights} nights stay`);
  if (pkg.flightSector) chips.push("Flights");
  if (pkg.mealPlan) chips.push(pkg.mealPlan);
  chips.push("24×7 support");
  return chips.slice(0, 4);
}

const THEME_LABEL: Record<string, string> = {
  HONEYMOON: "Honeymoon",
  FAMILY: "Family",
  LUXURY: "Luxury",
  BEACH: "Beach",
  ADVENTURE: "Adventure",
  GROUP: "Group",
};

export function PackageCard({ pkg, priority, matchPct, reasons }: { pkg: PackageListItem; priority?: boolean; matchPct?: number; reasons?: string[] }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-surface-border bg-white shadow-card transition-shadow duration-200 hover:shadow-cardHover">
      <Link href={`/packages/${pkg.slug}`} className="relative block aspect-[4/3] w-full" aria-label={pkg.name}>
        <SmartImage
          src={pkg.cover}
          alt={pkg.name}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={priority}
          imgClassName="transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {pkg.theme && THEME_LABEL[pkg.theme] && (
          <div className="absolute left-3 top-3">
            <Badge tone="brand">{THEME_LABEL[pkg.theme]}</Badge>
          </div>
        )}
        {typeof matchPct === "number" && (
          <div className="absolute left-3 bottom-3 rounded-full bg-success px-2.5 py-1 text-xs font-bold text-white shadow-sm">{matchPct}% match</div>
        )}
      </Link>
      <div className="pointer-events-none absolute right-3 top-3">
        <div className="pointer-events-auto"><SaveButton slug={pkg.slug} /></div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
          <MapPin className="h-3.5 w-3.5 text-brand-orange" />
          {pkg.destination.name}
          <span className="text-ink-faint">·</span>
          <Clock className="h-3.5 w-3.5" />
          {pkg.nights}N / {pkg.days}D
        </div>
        <Link href={`/packages/${pkg.slug}`}>
          <h3 className="mt-1.5 line-clamp-2 text-[15px] font-semibold text-brand-navy group-hover:text-brand-blue">
            {pkg.name}
          </h3>
        </Link>
        {pkg.cityBreakdown && pkg.cityBreakdown.length > 0 ? (
          <p className="mt-1 line-clamp-1 text-xs font-medium text-ink-muted">
            {pkg.nights} nights:{" "}
            {pkg.cityBreakdown.slice(0, 2).map((c, i) => (
              <span key={c.city}>{i > 0 ? " › " : " "}{c.city} <span className="text-ink-faint">({c.nights}N)</span></span>
            ))}
            {pkg.cityBreakdown.length > 2 && <span className="text-brand-blue"> +{pkg.cityBreakdown.length - 2} more</span>}
          </p>
        ) : pkg.summary ? (
          <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{pkg.summary}</p>
        ) : null}

        {reasons && reasons.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {reasons.slice(0, 3).map((r) => (
              <li key={r} className="inline-flex items-center gap-1 rounded-full bg-[#E7F6EC] px-2 py-0.5 text-[11px] font-semibold text-success">
                <Check className="h-3 w-3 shrink-0" /> {r}
              </li>
            ))}
          </ul>
        )}

        <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
          {inclusionChips(pkg).map((c) => (
            <li key={c} className="inline-flex items-center gap-1 text-xs font-medium text-ink">
              <Check className="h-3.5 w-3.5 shrink-0 text-success" /> {c}
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between">
            {pkg.pricingStatus === "PRICE_REVIEW_REQUIRED" ? (
              <div>
                <p className="text-[11px] uppercase tracking-wide text-ink-faint">Pricing</p>
                <p className="text-base font-bold text-brand-navy">Price on request</p>
              </div>
            ) : (
              <div>
                <p className="text-[11px] uppercase tracking-wide text-ink-faint">Starting from</p>
                <p className="text-lg font-bold text-brand-navy">
                  {formatINR(pkg.basePrice)}
                  <span className="text-xs font-medium text-ink-muted"> /person</span>
                </p>
              </div>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <EnquireButton packageName={pkg.name} packageSlug={pkg.slug} label="Enquire" className="!h-10 text-sm" />
            <Link
              href={`/packages/${pkg.slug}`}
              className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-brand-blue text-sm font-semibold text-white transition-colors hover:bg-brand-blueDark"
            >
              View Package <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
