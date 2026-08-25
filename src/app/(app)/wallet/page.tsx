import { WalletView } from "@/components/app/wallet-view";
import { WALLET, WALLET_TRANSACTIONS } from "@/data/wallet";

export const metadata = { title: "Wallet" };

export default function WalletPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">ExpertzWallet</h1>
        <p className="mt-1 text-ink-muted">
          Your prepaid balance for flight bookings — top up, book and track every rupee.
        </p>
      </div>
      <WalletView
        balance={WALLET.availableBalance}
        todaysBookings={WALLET.todaysBookings}
        pendingRefunds={WALLET.pendingRefunds}
        transactions={WALLET_TRANSACTIONS}
      />
    </div>
  );
}
