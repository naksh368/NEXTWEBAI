import { requireApprovedAgent } from "@/lib/agent-auth";
import { getWalletSummary } from "@/lib/services/wallet-service";
import { FlightSearch } from "@/components/b2b/flight-search";
import { formatINR } from "@/lib/utils";

export const metadata = { title: "Flights" };
export const dynamic = "force-dynamic";

export default async function FlightsPage() {
  const agent = await requireApprovedAgent();
  const wallet = await getWalletSummary(agent.id);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Search Flights</h1>
          <p className="text-sm text-ink-muted">Book from your prepaid balance</p>
        </div>
        <div className="rounded-xl border border-surface-border bg-white px-4 py-2 text-sm shadow-card">
          <span className="text-ink-muted">Available:</span> <span className="font-bold text-brand-blue">{formatINR(wallet.available)}</span>
        </div>
      </div>
      <FlightSearch />
    </div>
  );
}
