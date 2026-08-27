"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, X } from "lucide-react";
import { isChromelessRoute } from "./hide-on-admin";

/**
 * Site-wide announcement bar. Hidden on admin + standalone auth routes.
 * Dismissible per-session. Honest value message only — no invented stats.
 */
export function PromoBar() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);

  if (hidden || isChromelessRoute(pathname)) return null;

  return (
    <div className="relative bg-gradient-to-r from-brand-blue to-brand-blueDark text-white print:hidden">
      <div className="mx-auto flex max-w-[1200px] items-center justify-center gap-2 px-10 py-2 text-center text-xs font-semibold sm:text-sm">
        <Sparkles className="hidden h-4 w-4 text-brand-orange sm:block" />
        <span>
          Secure prepaid balance &middot; Verified payments &middot; Dedicated agent support —{" "}
          <Link href="/register" className="underline underline-offset-2 hover:text-brand-orangeLight">Register your agency</Link>
        </span>
        <button
          onClick={() => setHidden(true)}
          aria-label="Dismiss announcement"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
