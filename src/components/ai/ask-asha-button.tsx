"use client";

import { openPlanner } from "./planner-events";
import { PlannerAvatar } from "./planner-avatar";
import { cn } from "@/lib/utils";

/** Opens the floating AI planner, optionally with a question already asked. */
export function AskAshaButton({ prompt, label = "Ask Asha, our AI planner", className }: { prompt?: string; label?: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => openPlanner(prompt)}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full bg-white py-1.5 pl-1.5 pr-4 text-sm font-bold text-brand-navy shadow-card ring-1 ring-surface-border transition-colors hover:text-brand-blue",
        className
      )}
    >
      <PlannerAvatar size={30} />
      {label}
    </button>
  );
}
