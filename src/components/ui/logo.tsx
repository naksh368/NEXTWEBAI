import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * ExpertzTrip wordmark.
 *
 * This is a faithful CSS recreation of the supplied logo (royal-blue "expertz" +
 * orange "trip") so it renders crisply at any size with zero image weight. To use
 * the official raster/vector asset instead, drop it at /public/logo.svg and swap
 * this component's inner markup for a next/image — the colors/spacing are already
 * matched to the brand.
 */
export function Logo({
  className,
  size = "md",
  href = "/",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  href?: string | null;
}) {
  const sizeCls = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  }[size];

  const mark = (
    <span
      className={cn(
        "font-extrabold lowercase tracking-tight text-brand-blue",
        sizeCls,
        className
      )}
      aria-label="ExpertzTrip"
    >
      expertz<span className="text-brand-orange">trip</span>
    </span>
  );

  if (href === null) return mark;
  return (
    <Link href={href} className="inline-flex items-center" aria-label="ExpertzTrip home">
      {mark}
    </Link>
  );
}
