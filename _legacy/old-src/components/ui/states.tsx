import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

/** Empty state — used when a query legitimately returns nothing (Phase 4). */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-border bg-surface-muted/50 px-6 py-14 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-blueLight text-brand-blue">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-ink-muted">{description}</p>
      )}
      {action && (
        <Link href={action.href} className={buttonVariants({ className: "mt-5" })}>
          {action.label}
        </Link>
      )}
    </div>
  );
}

/** Error state with retry affordance (Phase 35). */
export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this right now. Please try again.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-surface-border bg-white px-6 py-12 text-center",
        className
      )}
      role="alert"
    >
      <h3 className="text-lg font-semibold text-danger">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-muted">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className={buttonVariants({ variant: "outline", size: "sm", className: "mt-5" })}
        >
          Try again
        </button>
      )}
    </div>
  );
}
