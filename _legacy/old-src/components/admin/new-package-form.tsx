"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createPackageAction } from "@/app/admin/(panel)/packages/actions";

const inp = "h-10 w-full rounded-lg border border-surface-border bg-white px-3 text-sm focus:border-brand-blue focus:outline-none";

export function NewPackageForm({ destinations }: { destinations: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({ name: "", code: "", destinationId: destinations[0]?.id ?? "", category: "SIGNATURE", bestFor: "", nights: 5, basePrice: 0 });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); setError(null); start(async () => {
        const r = await createPackageAction({ ...f, nights: Number(f.nights), basePrice: Number(f.basePrice) });
        if (!r.ok) setError(r.error); else router.push(`/admin/packages/${r.packageId}/edit`);
      }); }}
      className="max-w-xl space-y-4"
    >
      <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-faint">Package name</span>
        <input className={inp} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Dubai Signature" autoFocus /></label>
      <div className="grid grid-cols-2 gap-4">
        <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-faint">Package code</span>
          <input className={inp} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="ETX-…" /></label>
        <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-faint">Destination</span>
          <select className={inp} value={f.destinationId} onChange={(e) => setF({ ...f, destinationId: e.target.value })}>{destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
        <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-faint">Category</span>
          <input className={inp} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="SIGNATURE / HONEYMOON…" /></label>
        <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-faint">Recommended for</span>
          <input className={inp} value={f.bestFor} onChange={(e) => setF({ ...f, bestFor: e.target.value })} placeholder="Couples, families…" /></label>
        <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-faint">Nights</span>
          <input type="number" className={inp} value={f.nights} onChange={(e) => setF({ ...f, nights: Number(e.target.value) })} /></label>
        <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-faint">Base price ₹ / person</span>
          <input type="number" className={inp} value={f.basePrice} onChange={(e) => setF({ ...f, basePrice: Number(e.target.value) })} /></label>
      </div>
      {error && <p className="rounded-lg bg-[#FCE9E9] px-3 py-2 text-sm font-medium text-danger">{error}</p>}
      <Button type="submit" loading={pending}>Create &amp; continue editing</Button>
      <p className="text-xs text-ink-muted">The package is created as a Draft. You&apos;ll add images, itinerary and options on the next screen, then publish.</p>
    </form>
  );
}
