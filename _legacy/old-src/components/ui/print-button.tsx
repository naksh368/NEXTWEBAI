"use client";

import { Download } from "lucide-react";

/** Opens the browser print dialog → "Save as PDF" for a branded document. */
export function PrintButton({ label = "Download / Print" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-orange px-5 font-bold text-white transition-colors hover:bg-brand-orangeDark print:hidden"
    >
      <Download className="h-4 w-4" /> {label}
    </button>
  );
}
