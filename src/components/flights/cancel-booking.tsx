"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";

export function CancelBooking({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  async function cancel() {
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/agent/flights/${id}/cancel`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) { setError(json.error ?? "Could not cancel."); setBusy(false); return; }
      setDone(json.refundAmount ?? 0);
      setBusy(false);
      router.refresh();
    } catch {
      setError("Network error. Please try again."); setBusy(false);
    }
  }

  if (done !== null) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm font-medium text-success">
        <Check className="h-4 w-4" /> Cancelled. {done > 0 ? `${formatINR(done)} refunded to your wallet.` : "No refund was due per policy."}
      </div>
    );
  }

  if (!confirming) {
    return <Button variant="outline" onClick={() => setConfirming(true)}><XCircle className="h-4 w-4" /> Cancel booking</Button>;
  }

  return (
    <div className="rounded-xl border border-danger/30 bg-danger/5 p-4">
      <p className="text-sm font-medium text-brand-navy">Cancel this booking? A cancellation fee may apply; the refundable amount returns to your wallet.</p>
      {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
      <div className="mt-3 flex gap-2">
        <Button variant="danger" size="sm" onClick={cancel} loading={busy}>
          {busy ? <>Cancelling <Loader2 className="h-4 w-4 animate-spin" /></> : "Yes, cancel"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={busy}>Keep booking</Button>
      </div>
    </div>
  );
}
