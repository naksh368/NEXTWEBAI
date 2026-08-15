"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

/** Floating ExpertzTrip AI button, present on every page except /ai itself. */
export function AiFab() {
  const pathname = usePathname();
  if (pathname?.startsWith("/ai")) return null;

  return (
    <Link
      href="/ai"
      aria-label="Ask ExpertzTrip AI"
      className="group fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue text-white shadow-cardHover transition-all hover:scale-105 hover:bg-brand-blueDark"
    >
      <Sparkles className="h-6 w-6" />
      <span className="pointer-events-none absolute right-16 whitespace-nowrap rounded-lg bg-brand-navy px-3 py-1.5 text-sm font-medium text-white opacity-0 shadow-card transition-opacity group-hover:opacity-100">
        Ask ExpertzTrip AI
      </span>
    </Link>
  );
}
