import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "accent" | "outline" | "ghost" | "navy" | "subtle";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-bold transition-all duration-150 " +
  "focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap active:scale-[0.98]";

const variants: Record<Variant, string> = {
  // Blue is the primary UI color
  primary:
    "bg-blue text-white shadow-sm hover:bg-blue-600 hover:shadow-md",
  // Orange strictly for booking / financial / key CTAs
  accent:
    "bg-orange text-white shadow-sm hover:bg-orange-600 hover:shadow-md",
  navy: "bg-navy text-white hover:bg-blue-900",
  outline:
    "border border-surface-border bg-white text-navy hover:border-blue hover:text-blue",
  subtle: "bg-blue-50 text-blue hover:bg-blue-100",
  ghost: "text-ink-muted hover:bg-surface-muted hover:text-navy",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[0.82rem]",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[0.95rem]",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props} />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  href,
  children,
  ...props
}: CommonProps & { href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </Link>
  );
}
