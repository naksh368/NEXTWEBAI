"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Heart, Loader2, Scale, X } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PackageCard } from "@/components/package/package-card";
import { buttonVariants } from "@/components/ui/button";
import { useWishlist } from "@/lib/wishlist";
import { formatINR, cn } from "@/lib/utils";
import type { PackageListItem } from "@/lib/queries";

export default function SavedPage() {
  const saved = useWishlist();
  const [items, setItems] = useState<PackageListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [compare, setCompare] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    if (!saved.length) { setItems([]); setLoading(false); return; }
    setLoading(true);
    fetch(`/api/packages/cards?slugs=${encodeURIComponent(saved.join(","))}`)
      .then((r) => r.json())
      .then((d) => { if (alive && d.ok) setItems(d.items); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [saved]);

  // Drop compare selections that are no longer saved.
  useEffect(() => { setCompare((c) => c.filter((s) => saved.includes(s))); }, [saved]);

  const compareItems = useMemo(() => items.filter((i) => compare.includes(i.slug)), [items, compare]);
  function toggleCompare(slug: string) {
    setCompare((c) => c.includes(slug) ? c.filter((s) => s !== slug) : c.length >= 3 ? c : [...c, slug]);
  }

  return (
    <Container className="py-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">Saved holidays</h1>
        {items.length > 0 && <span className="rounded-full bg-brand-orangeLight px-2.5 py-0.5 text-sm font-bold text-brand-orangeDark">{items.length}</span>}
      </div>
      <p className="mt-1 text-ink-muted">Your shortlist lives on this device. Tick up to 3 to compare them side by side.</p>

      {loading ? (
        <div className="mt-10 flex items-center gap-2 text-ink-muted"><Loader2 className="h-5 w-5 animate-spin" /> Loading your saved holidays…</div>
      ) : items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-surface-border bg-white p-10 text-center">
          <Heart className="mx-auto h-8 w-8 text-brand-orange" />
          <h2 className="mt-3 text-lg font-bold">Nothing saved yet</h2>
          <p className="mt-1 text-ink-muted">Tap the heart on any holiday to add it here.</p>
          <Link href="/packages" className={buttonVariants({ variant: "orange", className: "mt-5" })}>Explore holidays</Link>
        </div>
      ) : (
        <>
          {compareItems.length >= 2 && <CompareTable items={compareItems} onRemove={toggleCompare} />}

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <div key={p.id} className="relative">
                <label className={cn(
                  "absolute left-3 top-3 z-10 inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur",
                  compare.includes(p.slug) ? "bg-brand-blue text-white" : "bg-white/90 text-ink-muted"
                )}>
                  <input type="checkbox" checked={compare.includes(p.slug)} onChange={() => toggleCompare(p.slug)} className="sr-only" />
                  <Scale className="h-3.5 w-3.5" /> Compare
                </label>
                <PackageCard pkg={p} />
              </div>
            ))}
          </div>
        </>
      )}
    </Container>
  );
}

function CompareTable({ items, onRemove }: { items: PackageListItem[]; onRemove: (slug: string) => void }) {
  const rows: { label: string; get: (p: PackageListItem) => string }[] = [
    { label: "Price / person", get: (p) => p.pricingStatus === "PRICE_REVIEW_REQUIRED" ? "On request" : formatINR(p.basePrice) },
    { label: "Duration", get: (p) => `${p.nights}N / ${p.days}D` },
    { label: "Destination", get: (p) => p.destination.name },
    { label: "Hotel", get: (p) => p.roomCategory || "—" },
    { label: "Flights", get: (p) => (p.flightSector ? "Included" : "—") },
    { label: "Meals", get: (p) => p.mealPlan || "—" },
  ];
  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-surface-border bg-white">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-surface-border">
            <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-ink-faint">Compare</th>
            {items.map((p) => (
              <th key={p.id} className="p-4 text-left align-top">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/packages/${p.slug}`} className="font-bold text-brand-navy hover:text-brand-blue">{p.name}</Link>
                  <button onClick={() => onRemove(p.slug)} aria-label="Remove from compare" className="text-ink-faint hover:text-danger"><X className="h-4 w-4" /></button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-surface-border/60">
              <td className="p-4 font-medium text-ink-muted">{r.label}</td>
              {items.map((p) => <td key={p.id} className="p-4 font-medium text-brand-navy">{r.get(p)}</td>)}
            </tr>
          ))}
          <tr>
            <td className="p-4" />
            {items.map((p) => (
              <td key={p.id} className="p-4">
                <Link href={`/packages/${p.slug}`} className={buttonVariants({ variant: "orange", size: "sm" })}>View holiday</Link>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
