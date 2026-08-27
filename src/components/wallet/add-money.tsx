"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, Loader2, X, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const QUICK = [1000, 2500, 5000, 10000];
const RZP_SRC = "https://checkout.razorpay.com/v1/checkout.js";

declare global {
  interface Window { Razorpay?: new (opts: unknown) => { open: () => void }; }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = RZP_SRC;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function AddMoney({ agentName }: { agentName?: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const reset = () => { setAmount(""); setError(null); setNotice(null); setDone(null); setBusy(false); };

  const start = useCallback(async () => {
    const rupees = Math.round(Number(amount));
    if (!Number.isFinite(rupees) || rupees < 100) { setError("Enter an amount of at least ₹100."); return; }
    if (rupees > 200000) { setError("Maximum top-up is ₹2,00,000."); return; }
    setBusy(true); setError(null); setNotice(null);
    try {
      const res = await fetch("/api/agent/wallet/topup/order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: rupees }),
      });
      const json = await res.json().catch(() => ({}));
      if (json.configured === false) { setNotice(json.error ?? "Online top-up isn't enabled yet."); setBusy(false); return; }
      if (!res.ok || !json.ok) { setError(json.error ?? "Could not start the top-up."); setBusy(false); return; }

      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) { setError("Couldn't load the secure payment window. Check your connection."); setBusy(false); return; }

      const rzp = new window.Razorpay({
        key: json.keyId,
        amount: json.amount,
        currency: json.currency || "INR",
        name: "ExpertzTrip",
        description: "ExpertzWallet top-up",
        order_id: json.orderId,
        prefill: agentName ? { name: agentName } : undefined,
        theme: { color: "#2340D9" },
        modal: { ondismiss: () => setBusy(false) },
        handler: async (resp: Record<string, string>) => {
          setBusy(true);
          try {
            const v = await fetch("/api/agent/wallet/topup/verify", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
              }),
            });
            const vj = await v.json().catch(() => ({}));
            if (!v.ok || !vj.ok) { setError(vj.error ?? "We couldn't confirm your payment. If money was debited it will reflect shortly."); setBusy(false); return; }
            setDone(`₹${rupees.toLocaleString("en-IN")} added to your wallet.`);
            setBusy(false);
            router.refresh();
          } catch {
            setError("Payment confirmation failed. If money was debited it will reflect shortly.");
            setBusy(false);
          }
        },
      });
      rzp.open();
    } catch {
      setError("Something went wrong starting the top-up.");
      setBusy(false);
    }
  }, [amount, agentName, router]);

  return (
    <>
      <Button variant="orange" onClick={() => { reset(); setOpen(true); }}>
        <Plus className="h-4 w-4" /> Add Money
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-brand-navy/40 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />
          <div className="relative w-full max-w-md rounded-2xl border border-surface-border bg-white p-6 shadow-cardHover">
            <button onClick={() => setOpen(false)} aria-label="Close" className="absolute right-4 top-4 rounded-lg p-1 text-ink-muted hover:bg-surface-muted">
              <X className="h-5 w-5" />
            </button>

            {done ? (
              <div className="py-4 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success"><Check className="h-7 w-7" /></span>
                <h3 className="mt-4 text-xl font-extrabold text-brand-navy">Top-up successful</h3>
                <p className="mt-1.5 text-ink-muted">{done}</p>
                <Button variant="primary" className="mt-6 w-full" onClick={() => setOpen(false)}>Done</Button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-extrabold text-brand-navy">Add money to your wallet</h3>
                <p className="mt-1 text-sm text-ink-muted">Secure payment via Razorpay. Credited after server-side verification.</p>

                {error && <div className="mt-4 rounded-xl border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm font-medium text-danger">{error}</div>}
                {notice && <div className="mt-4 rounded-xl border border-warning/30 bg-warning/5 px-3.5 py-2.5 text-sm font-medium text-warning">{notice}</div>}

                <div className="mt-5">
                  <label htmlFor="wal-amt" className="block text-sm font-semibold text-ink">Amount (₹)</label>
                  <div className="relative mt-1.5">
                    <IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                    <Input id="wal-amt" inputMode="numeric" value={amount}
                      onChange={(e) => { setAmount(e.target.value.replace(/[^\d]/g, "")); setError(null); }}
                      placeholder="Enter amount" className="pl-9" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {QUICK.map((q) => (
                      <button key={q} type="button" onClick={() => { setAmount(String(q)); setError(null); }}
                        className="rounded-full border border-surface-border px-3 py-1 text-sm font-semibold text-ink transition-colors hover:border-brand-blue hover:text-brand-blue">
                        +₹{q.toLocaleString("en-IN")}
                      </button>
                    ))}
                  </div>
                </div>

                <Button variant="orange" className="mt-6 w-full" onClick={start} loading={busy}>
                  {busy ? <>Processing <Loader2 className="h-4 w-4 animate-spin" /></> : <>Proceed to pay</>}
                </Button>
                <p className="mt-3 text-center text-xs text-ink-faint">Min ₹100 · Max ₹2,00,000 · You&apos;ll pay on Razorpay&apos;s secure window.</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
