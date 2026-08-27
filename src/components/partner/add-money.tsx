"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Info, CheckCircle2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const PRESETS = [1000, 2500, 5000, 10000];

type RzpConstructor = new (opts: Record<string, unknown>) => { open: () => void };
const getRzp = (): RzpConstructor | undefined =>
  (window as unknown as { Razorpay?: RzpConstructor }).Razorpay;

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (getRzp()) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function AddMoney({ approved }: { approved: boolean }) {
  const router = useRouter();
  const [amount, setAmount] = useState(2500);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "info" | "success" | "error"; text: string } | null>(null);

  const effective = custom ? Number(custom.replace(/\D/g, "")) : amount;

  async function addMoney() {
    setMsg(null);
    if (!approved) { setMsg({ kind: "info", text: "Your agency must be approved before you can add funds." }); return; }
    if (!Number.isFinite(effective) || effective < 100) { setMsg({ kind: "error", text: "Enter an amount of at least ₹100." }); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/agent/wallet/order", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amountRupees: effective }),
      });
      const data = await res.json();
      if (data.configured === false) { setMsg({ kind: "info", text: "Online top-up is not enabled in this environment yet. Add Razorpay keys to activate it." }); setBusy(false); return; }
      if (!res.ok) { setMsg({ kind: "error", text: data.error || "Could not start payment." }); setBusy(false); return; }

      const loaded = await loadRazorpay();
      const Rzp = getRzp();
      if (!loaded || !Rzp) { setMsg({ kind: "error", text: "Could not load the payment window. Check your connection." }); setBusy(false); return; }

      const rzp = new Rzp({
        key: data.keyId,
        order_id: data.orderId,
        amount: data.amount,
        currency: data.currency,
        name: "ExpertzTrip",
        description: "Wallet top-up",
        prefill: data.prefill,
        theme: { color: "#2340d9" },
        handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const v = await fetch("/api/agent/wallet/verify", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }),
          });
          const vd = await v.json();
          if (v.ok) { setMsg({ kind: "success", text: "Payment received — your wallet has been credited." }); router.refresh(); }
          else setMsg({ kind: "error", text: vd.error || "We couldn't confirm the payment yet. It will be credited once verified." });
        },
        modal: { ondismiss: () => setMsg({ kind: "info", text: "Payment cancelled." }) },
      });
      rzp.open();
    } catch {
      setMsg({ kind: "error", text: "Something went wrong. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
      <h2 className="font-bold text-brand-navy">Add money</h2>
      <p className="mt-1 text-sm text-ink-muted">Top up securely through the payment gateway. Funds are credited only after the payment is verified.</p>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PRESETS.map((p) => (
          <button key={p} onClick={() => { setAmount(p); setCustom(""); }}
            className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors ${!custom && amount === p ? "border-brand-blue bg-brand-blueLight text-brand-blue" : "border-surface-border text-ink hover:border-brand-blue"}`}>
            ₹{p.toLocaleString("en-IN")}
          </button>
        ))}
      </div>

      <label className="mt-3 block">
        <span className="mb-1.5 block text-sm font-semibold text-brand-navy">Or enter a custom amount</span>
        <span className="flex items-center overflow-hidden rounded-xl border border-surface-border bg-white focus-within:border-brand-blue">
          <span className="pl-3.5 font-semibold text-ink-muted">₹</span>
          <input value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Amount in rupees"
            className="w-full bg-transparent px-3 py-2.5 text-[15px] outline-none" />
        </span>
      </label>

      {msg && (
        <div className={`mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm ${msg.kind === "success" ? "border-success/30 bg-success/5 text-success" : msg.kind === "error" ? "border-danger/30 bg-danger/5 text-danger" : "border-brand-blueLight bg-brand-blueLight/50 text-brand-navy"}`}>
          {msg.kind === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <Info className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      <button onClick={addMoney} disabled={busy} className={buttonVariants({ variant: "orange", size: "lg", className: "mt-4 w-full" })}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Add {effective >= 100 ? `₹${effective.toLocaleString("en-IN")}` : "money"}</>}
      </button>
    </div>
  );
}
