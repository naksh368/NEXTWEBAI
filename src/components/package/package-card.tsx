import Link from "next/link";
import { MapPin, Clock, ArrowRight } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge } from "@/components/ui/badge";
import { EnquireButton } from "@/components/package/enquire-button";
import { formatINR } from "@/lib/utils";
import type { PackageListItem } from "@/lib/queries";

const THEME_LABEL: Record<string, string> = {
  HONEYMOON: "Honeymoon",
  FAMILY: "Family",
  LUXURY: "Luxury",
  BEACH: "Beach",
  ADVENTURE: "Adventure",
  GROUP: "Group",
};

export function PackageCard({ pkg, priority }: { pkg: PackageListItem; priority?: boolean }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-surface-border bg-white shadow-card transition-shadow duration-200 hover:shadow-cardHover">
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
      </Link>
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
        {pkg.summary && (
          <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{pkg.summary}</p>
        )}
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
