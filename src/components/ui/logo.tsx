import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND_LOGO, BRAND_LOGO_HEIGHT, BRAND_LOGO_WIDTH, BRAND_NAME } from "@/lib/brand";

/**
 * JST Andaman Travels logo.
 *
 * Renders the supplied transparent asset at a fixed height with `object-contain`
 * so the artwork is never stretched or recoloured. If the asset is ever missing
 * the alt text carries the brand name, and `variant="wordmark"` gives an elegant
 * text-only fallback for places where an image would be too heavy (e.g. emails
 * or a dark footer where the asset has not yet been supplied in a light form).
 */

/**
 * The supplied artwork is a stacked lockup (JST / ANDAMAN / TRAVELS), so it
 * needs real height before the wordmark becomes readable. These sizes are
 * tuned so "ANDAMAN TRAVELS" is legible at each one.
 */
const SIZES = {
  xs: { h: 32, w: 48 },
  sm: { h: 44, w: 66 },
  md: { h: 60, w: 90 },
  lg: { h: 76, w: 114 },
  xl: { h: 104, w: 156 },
} as const;

export function Logo({
  className,
  size = "md",
  href = "/",
  src,
  variant = "image",
  alt,
}: {
  className?: string;
  size?: keyof typeof SIZES;
  href?: string | null;
  /** Override the asset (admin-configurable logo from site settings). */
  src?: string;
  variant?: "image" | "wordmark";
  alt?: string;
}) {
  const { h, w } = SIZES[size];
  const label = alt ?? BRAND_NAME;

  const mark =
    variant === "wordmark" ? (
      <span className={cn("inline-flex flex-col leading-none", className)}>
        <span className="text-xl font-extrabold tracking-tight text-brand-navy sm:text-2xl">
          JST <span className="text-brand-blue">Andaman</span>
        </span>
        <span className="mt-0.5 text-[0.62rem] font-bold uppercase tracking-[0.3em] text-brand-orange">
          Travels
        </span>
      </span>
    ) : (
      <Image
        src={src || BRAND_LOGO}
        alt={label}
        width={BRAND_LOGO_WIDTH}
        height={BRAND_LOGO_HEIGHT}
        priority={size === "md" || size === "lg" || size === "xl"}
        sizes={`${w}px`}
        className={cn("w-auto object-contain", className)}
        style={{ height: h, maxWidth: w * 1.2 }}
      />
    );

  if (href === null) return mark;
  return (
    <Link href={href} className="inline-flex shrink-0 items-center" aria-label={`${BRAND_NAME} — home`}>
      {mark}
    </Link>
  );
}
