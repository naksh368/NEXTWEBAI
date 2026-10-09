"use client";

import { Printer } from "lucide-react";

/**
 * Opens the browser print dialog for the on-screen document.
 *
 * This is the fallback: the primary download is a real, server-generated
 * .pdf file at /packages/[slug]/itinerary.pdf.
 */
export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-surface-border bg-white px-4 text-sm font-bold text-ink transition-colors hover:border-brand-blue hover:text-brand-blue print:hidden"
    >
      <Printer className="h-4 w-4" /> {label}
    </button>
  );
}
