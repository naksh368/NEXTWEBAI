import * as React from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  required,
  className,
  children,
}: {
  label?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      {label && (
        <span className="mb-1.5 flex items-center gap-1 text-[0.72rem] font-extrabold uppercase tracking-wide text-ink-muted">
          {label}
          {required && <span className="text-orange">*</span>}
        </span>
      )}
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-lg border border-surface-border bg-white px-3.5 text-sm font-semibold text-ink",
        "placeholder:font-normal placeholder:text-ink-faint outline-none transition",
        "focus:border-blue focus:ring-4 focus:ring-blue/10",
        className,
      )}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "h-11 w-full appearance-none rounded-lg border border-surface-border bg-white px-3.5 pr-9 text-sm font-semibold text-ink outline-none transition",
        "focus:border-blue focus:ring-4 focus:ring-blue/10",
        "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%235A6480%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
