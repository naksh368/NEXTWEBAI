import * as React from "react";
import { cn } from "@/lib/utils";

/** Centered max-width wrapper used across the site for consistent gutters. */
export function Container({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8", className)}
      {...props}
    />
  );
}

export function Section({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn("py-12 sm:py-16", className)} {...props} />;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        "mb-9 gap-5",
        centered ? "flex flex-col items-center text-center" : "flex items-end justify-between",
        className
      )}
    >
      <div className={cn("max-w-2xl", centered && "mx-auto")}>
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-turquoiseDark">
            {eyebrow}
          </p>
        )}
        <h2 className={cn("text-[1.75rem] leading-tight sm:text-4xl", eyebrow && "mt-2.5")}>{title}</h2>
        {description && <p className="mt-3 text-[15px] leading-relaxed text-ink-muted sm:text-base">{description}</p>}
      </div>
      {action && <div className={cn("shrink-0", centered ? "mt-1" : "hidden sm:block")}>{action}</div>}
    </div>
  );
}
