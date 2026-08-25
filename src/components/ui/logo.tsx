import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * ExpertzTrip wordmark.
 * "expertz" royal blue · "trip" vivid orange · lowercase, rounded (Nunito).
 * No icon, no tagline — used exactly as the brand mark.
 */
export function Logo({
  className,
  size = "md",
  href = "/",
  onDark = false,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  href?: string | null;
  onDark?: boolean;
}) {
  const sizes = {
    sm: "text-lg",
    md: "text-[1.4rem]",
    lg: "text-3xl",
  };
  const mark = (
    <span
      className={cn(
        "select-none font-extrabold lowercase tracking-tight leading-none",
        sizes[size],
        className,
      )}
    >
      <span className={onDark ? "text-white" : "text-blue"}>expertz</span>
      <span className="text-orange">trip</span>
    </span>
  );
  if (href === null) return mark;
  return (
    <Link href={href} aria-label="ExpertzTrip home" className="inline-flex items-center">
      {mark}
    </Link>
  );
}
