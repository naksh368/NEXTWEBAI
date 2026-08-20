"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AiAvatar } from "@/components/ui/ai-avatar";

/**
 * Floating ExpertzTrip AI button.
 * Only shown on the homepage — on package/checkout/enquiry pages it competes
 * with the primary travel-conversion CTAs (Book/Enquire), so it's hidden there.
 */
export function AiFab() {
  const pathname = usePathname();
  if (pathname !== "/") return null;

  return (
    <Link
      href="/ai"
      aria-label="Ask ExpertzTrip AI"
      className="group fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-surface-border bg-white shadow-cardHover transition-all hover:scale-105 print:hidden"
    >
      <AiAvatar size={34} />
      <span className="pointer-events-none absolute right-16 whitespace-nowrap rounded-lg bg-brand-navy px-3 py-1.5 text-sm font-medium text-white opacity-0 shadow-card transition-opacity group-hover:opacity-100">
        Ask ExpertzTrip AI
      </span>
    </Link>
  );
}
