import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Server-friendly pagination — renders links with query params so lists stay
 * server-rendered and shareable (Phase 3/32). `buildHref(page)` lets each page
 * preserve its own filters.
 */
export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "…")[] = [];
  const push = (p: number | "…") => pages.push(p);
  const window = 1;
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= page - window && p <= page + window)) {
      push(p);
    } else if (pages[pages.length - 1] !== "…") {
      push("…");
    }
  }

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
      <PageLink href={buildHref(page - 1)} disabled={page <= 1} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </PageLink>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-ink-faint">
            …
          </span>
        ) : (
          <PageLink key={p} href={buildHref(p)} active={p === page}>
            {p}
          </PageLink>
        )
      )}
      <PageLink href={buildHref(page + 1)} disabled={page >= totalPages} aria-label="Next page">
        <ChevronRight className="h-4 w-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  active,
  disabled,
  children,
  ...props
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  const cls = cn(
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors",
    active
      ? "border-brand-blue bg-brand-blue text-white"
      : "border-surface-border bg-white text-ink hover:border-brand-blue hover:text-brand-blue",
    disabled && "pointer-events-none opacity-40"
  );
  if (disabled) {
    return (
      <span className={cls} aria-disabled {...props}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={cls} {...props}>
      {children}
    </Link>
  );
}
