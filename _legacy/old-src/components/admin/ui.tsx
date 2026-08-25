import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, tone = "blue" }: { label: string; value: React.ReactNode; hint?: string; tone?: "blue" | "orange" | "green" | "navy" }) {
  const toneCls = {
    blue: "text-brand-blue", orange: "text-brand-orange", green: "text-success", navy: "text-brand-navy",
  }[tone];
  return (
    <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</p>
      <p className={cn("mt-2 text-2xl font-bold tabular-nums", toneCls)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-surface-border bg-white shadow-card", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-3.5">
          {title && <h2 className="font-semibold text-brand-navy">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function Table({ head, children }: { head: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-surface-muted/70 text-left text-xs uppercase tracking-wide text-ink-faint">
          <tr>{head}</tr>
        </thead>
        <tbody className="divide-y divide-surface-border">{children}</tbody>
      </table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-3 font-semibold", className)}>{children}</th>;
}
export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>;
}

const PILL_TONES: Record<string, string> = {
  neutral: "bg-surface-muted text-ink-muted",
  info: "bg-brand-blueLight text-brand-blue",
  success: "bg-[#E7F6EC] text-success",
  warning: "bg-[#FDF2E3] text-warning",
  danger: "bg-[#FCE9E9] text-danger",
};
export function Pill({ tone = "neutral", children }: { tone?: keyof typeof PILL_TONES | string; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", PILL_TONES[tone] ?? PILL_TONES.neutral)}>{children}</span>;
}

export function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-ink-muted">{label}</td>
    </tr>
  );
}

/** Simple server-rendered pager for admin tables. */
export function AdminPager({ page, totalPages, base }: { page: number; totalPages: number; base: string }) {
  if (totalPages <= 1) return null;
  const mk = (p: number) => `${base}${base.includes("?") ? "&" : "?"}page=${p}`;
  return (
    <div className="flex items-center justify-between border-t border-surface-border px-5 py-3 text-sm">
      <span className="text-ink-muted">Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        <Link href={mk(Math.max(1, page - 1))} aria-disabled={page <= 1}
          className={cn("rounded-lg border border-surface-border px-3 py-1.5 font-medium", page <= 1 ? "pointer-events-none opacity-40" : "hover:border-brand-blue hover:text-brand-blue")}>
          Previous
        </Link>
        <Link href={mk(Math.min(totalPages, page + 1))} aria-disabled={page >= totalPages}
          className={cn("rounded-lg border border-surface-border px-3 py-1.5 font-medium", page >= totalPages ? "pointer-events-none opacity-40" : "hover:border-brand-blue hover:text-brand-blue")}>
          Next
        </Link>
      </div>
    </div>
  );
}
