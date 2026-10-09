import * as React from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-xl border border-surface-border bg-white px-3.5 text-[15px] text-ink placeholder:text-ink-faint " +
  "transition-colors focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10 " +
  "disabled:bg-surface-muted disabled:opacity-70";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(fieldBase, "h-11", invalid && "border-danger focus:border-danger focus:ring-danger/10", className)}
    aria-invalid={invalid || undefined}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(fieldBase, "min-h-[96px] py-2.5", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
        {label}
        {required && <span className="ml-0.5 text-brand-orange">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(({ className, invalid, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      fieldBase,
      "h-11 appearance-none bg-[length:16px] bg-[right_0.85rem_center] bg-no-repeat pr-10",
      // Inline chevron so the control matches Input without an extra wrapper.
      "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2363748A%22 stroke-width=%222.2%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>')]",
      invalid && "border-danger focus:border-danger focus:ring-danger/10",
      className
    )}
    aria-invalid={invalid || undefined}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
