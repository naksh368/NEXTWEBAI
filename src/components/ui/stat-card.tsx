import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  delta,
  accent = "blue",
  className,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  delta?: { value: string; positive?: boolean };
  accent?: "blue" | "orange" | "navy" | "success" | "danger";
  className?: string;
}) {
  const accents = {
    blue: "bg-blue-50 text-blue",
    orange: "bg-orange-50 text-orange",
    navy: "bg-blue-800/8 text-navy",
    success: "bg-[#E7F5EF] text-success",
    danger: "bg-[#FDECEA] text-danger",
  };
  return (
    <div
      className={cn(
        "rounded-xl border border-surface-border bg-white p-5 shadow-card",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[0.72rem] font-extrabold uppercase tracking-wide text-ink-muted">
            {label}
          </p>
          <p className="mt-2 text-2xl font-extrabold text-navy">{value}</p>
        </div>
        {icon && (
          <span
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
              accents[accent],
            )}
          >
            {icon}
          </span>
        )}
      </div>
      {delta && (
        <p
          className={cn(
            "mt-3 text-xs font-bold",
            delta.positive ? "text-success" : "text-ink-muted",
          )}
        >
          {delta.value}
        </p>
      )}
    </div>
  );
}
