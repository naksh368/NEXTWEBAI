import Link from "next/link";
import { MapPin, Clock, ArrowRight } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge } from "@/components/ui/badge";
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
    <Link
      href={`/packages/${pkg.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-surface-border bg-white shadow-card transition-shadow duration-200 hover:shadow-cardHover"
    >
      <div className="relative aspect-[4/3] w-full">
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
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
          <MapPin className="h-3.5 w-3.5 text-brand-orange" />
          {pkg.destination.name}
          <span className="text-ink-faint">·</span>
          <Clock className="h-3.5 w-3.5" />
          {pkg.nights}N / {pkg.days}D
        </div>
        <h3 className="mt-1.5 line-clamp-2 text-[15px] font-semibold text-brand-navy group-hover:text-brand-blue">
          {pkg.name}
        </h3>
        {pkg.summary && (
          <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{pkg.summary}</p>
        )}
        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            {pkg.pricingStatus === "PRICE_REVIEW_REQUIRED" ? (
              <>
                <p className="text-[11px] uppercase tracking-wide text-ink-faint">Pricing</p>
                <p className="text-base font-bold text-brand-navy">Price on request</p>
              </>
            ) : (
              <>
                <p className="text-[11px] uppercase tracking-wide text-ink-faint">Starting from</p>
                <p className="text-lg font-bold text-brand-navy">
                  {formatINR(pkg.basePrice)}
                  <span className="text-xs font-medium text-ink-muted"> /person</span>
                </p>
              </>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue">
            View Package <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
