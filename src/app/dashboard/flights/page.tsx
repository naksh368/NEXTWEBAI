import { redirect } from "next/navigation";
import { Plane } from "lucide-react";
import { Container } from "@/components/ui/container";
import { getCurrentCustomer } from "@/lib/auth";
import { getWalletSummary } from "@/lib/services/wallet-service";
import { isMockSupplier } from "@/lib/services/flight-supplier";
import { FlightSearch } from "@/components/flights/flight-search";

export const metadata = { title: "Search Flights" };
export const dynamic = "force-dynamic";

export default async function FlightsPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login");

  let available = 0;
  try { available = (await getWalletSummary(customer.id)).available; } catch { /* not migrated */ }

  return (
    <Container className="py-8 sm:py-10">
      <div className="flex items-center gap-2">
        <Plane className="h-6 w-6 text-brand-blue" />
        <h1 className="text-2xl font-extrabold text-brand-navy sm:text-3xl">Search flights</h1>
      </div>
      <p className="mt-1.5 text-ink-muted">Find and book flights, paid from your prepaid wallet balance.</p>

      {isMockSupplier() && (
        <p className="mt-4 rounded-xl border border-brand-blue/20 bg-brand-blueLight/50 px-4 py-3 text-sm text-ink">
          A demo supplier is active — fares are <b>illustrative</b> and the full flow (hold → book → ticket → wallet debit) runs end to end. Connect a real supplier to sell live fares.
        </p>
      )}

      <div className="mt-6">
        <FlightSearch walletAvailable={available} />
      </div>
    </Container>
  );
}
