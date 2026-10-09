import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "orange" | "secondary" | "outline" | "ghost" | "danger" | "navy" | "onPhoto";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all duration-150 " +
  "focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none select-none " +
  "active:scale-[0.98] whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-blue text-white shadow-sm hover:bg-brand-blueDark hover:shadow-md",
  orange:
    "bg-brand-orange text-white shadow-sm hover:bg-brand-orangeDark hover:shadow-md",
  secondary: "bg-brand-blueLight text-brand-blueDark hover:bg-brand-turquoiseLight",
  outline:
    "border border-surface-border bg-white text-ink hover:border-brand-blue hover:text-brand-blue",
  ghost: "text-ink hover:bg-surface-muted",
  danger: "bg-danger text-white hover:brightness-95",
  navy: "bg-brand-navy text-white shadow-sm hover:bg-brand-navyDark hover:shadow-md",
  // Over photography: frosted glass that keeps contrast on any image.
  onPhoto:
    "border border-white/70 bg-white/15 text-white backdrop-blur-sm hover:bg-white hover:text-brand-navy",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-12 px-6 text-base",
};

export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (
          <span
            aria-hidden
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
