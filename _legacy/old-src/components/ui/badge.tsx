import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "brand";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-muted text-ink-muted",
  info: "bg-brand-blueLight text-brand-blue",
  success: "bg-[#E7F6EC] text-success",
  warning: "bg-[#FDF2E3] text-warning",
  danger: "bg-[#FCE9E9] text-danger",
  brand: "bg-brand-orangeLight text-brand-orange",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
