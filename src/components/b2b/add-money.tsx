"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/utils";

const PRESETS = [1000, 2500, 5000, 10000];

// Razorpay checkout is injected at runtime; access via a local any-cast to avoid
// clashing with other global Window.Razorpay declarations in the app.
const rzpGlobal = () => (window as any).Razorpay;

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (rzpGlobal()) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function AddMoney({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [amount, setAmount] = useState<number | "">(2500);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const value = custom ? Number(custom) : amount || 0;

  async function pay() {
    setError(null); setSuccess(null);
    if (!value || value < 100) return setError("Enter an amount of at least ₹100.");
    setBusy(true);
    try {
      const res = await fetch("/api/agent/wallet/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: value }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Could not start payment.");
      if (!j.keyId) throw new Error("Payments are not configured yet.");

      const ok = await loadRazorpay();
      if (!ok) throw new Error("Could not load the payment window. Check your connection.");

      const Razorpay = rzpGlobal();
      const rzp = new Razorpay({
        key: j.keyId,
        order_id: j.order.id,
        amount: j.order.amount,
        currency: j.order.currency,
        name: "ExpertzTrip",
        description: "Prepaid booking balance top-up",
        prefill: { name: j.agentName, email: j.agentEmail, contact: j.agentMobile },
        theme: { color: "#2340D9" },
        handler: async (r: any) => {
          setBusy(true);
          try {
            const vr = await fetch("/api/agent/wallet/verify", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ razorpay_order_id: r.razorpay_order_id, razorpay_payment_id: r.razorpay_payment_id, razorpay_signature: r.razorpay_signature }),
            });
            const vj = await vr.json();
            if (!vr.ok) throw new Error(vj.error || "Verification failed.");
            setSuccess(`Wallet credited. Available balance ${formatINR(vj.balance)}.`);
            router.refresh();
          } catch (e) { setError((e as Error).message); }
          finally { setBusy(false); }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on("payment.failed", (resp: any) => setError(resp?.error?.description || "Payment failed."));
      rzp.open();
    } catch (e) { setError((e as Error).message); setBusy(false); }
  }

  if (!configured) {
    return (
      <div className="rounded-xl border border-warning/20 bg-[#FDF2E3] px-4 py-3 text-sm text-warning">
        Online top-up isn&apos;t available yet — the payment gateway hasn&apos;t been configured for this environment. Please contact support to add balance.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <div className="rounded-xl border border-danger/20 bg-[#FCE9E9] px-4 py-3 text-sm font-medium text-danger">{error}</div>}
      {success && <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-[#E7F6EC] px-4 py-3 text-sm font-medium text-success"><CheckCircle2 size={16} /> {success}</div>}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PRESETS.map((p) => (
          <button key={p} onClick={() => { setAmount(p); setCustom(""); }} className={`rounded-xl border-2 py-3 text-sm font-bold transition-colors ${!custom && amount === p ? "border-brand-blue bg-brand-blueLight text-brand-blue" : "border-surface-border text-ink hover:border-brand-blue/40"}`}>
            {formatINR(p)}
          </button>
        ))}
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold">Custom amount</label>
        <Input value={custom} onChange={(e) => { setCustom(e.target.value.replace(/\D/g, "")); }} inputMode="numeric" placeholder="Enter amount (₹)" />
      </div>
      <Button className="w-full" variant="orange" loading={busy} onClick={pay}>
        {busy ? <Loader2 size={18} className="animate-spin" /> : null} Add {value ? formatINR(value) : "Money"}
      </Button>
      <p className="text-xs text-ink-faint">
        Your prepaid booking balance is credited only after the payment is verified on our server. This is a Prepaid Booking Balance for eligible bookings — not a bank deposit.
      </p>
    </div>
  );
}
