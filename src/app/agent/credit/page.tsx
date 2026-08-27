import { Clock, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "ExpertzCredit" };

export default function CreditPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-extrabold">ExpertzCredit</h1>
        <Badge tone="brand">SOON</Badge>
      </div>
      <div className="rounded-2xl border border-surface-border bg-white p-8 text-center shadow-card">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-orangeLight text-brand-orange"><TrendingUp size={26} /></span>
        <h2 className="mt-5 text-xl font-bold">Build your purchasing power</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
          Build your ExpertzTrip history for future purchasing-power eligibility. As you transact on the
          platform, you&apos;ll build a track record that counts toward future credit eligibility.
        </p>
        <div className="mx-auto mt-6 flex max-w-sm flex-col gap-2 rounded-xl bg-surface-muted/60 p-4 text-left text-sm text-ink-muted">
          <p className="flex items-center gap-2"><Clock size={15} className="text-ink-faint" /> No guaranteed limits</p>
          <p className="flex items-center gap-2"><Clock size={15} className="text-ink-faint" /> No guaranteed approval</p>
          <p className="flex items-center gap-2"><Clock size={15} className="text-ink-faint" /> Eligibility assessed when the feature launches</p>
        </div>
      </div>
    </div>
  );
}
