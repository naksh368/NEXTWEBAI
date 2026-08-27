"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { SUPPORT_CATEGORIES } from "@/lib/agent-constants";

const LABELS: Record<string, string> = {
  BOOKING: "Booking", TICKET: "Ticket", CANCELLATION: "Cancellation", REISSUE: "Reissue",
  REFUND: "Refund", PAYMENT: "Payment", WALLET: "Wallet", KYC: "KYC", ACCOUNT: "Account", TECHNICAL: "Technical",
};

export function SupportForm() {
  const router = useRouter();
  const [category, setCategory] = useState("BOOKING");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ref, setRef] = useState<string | null>(null);

  async function submit() {
    setError(null); setBusy(true);
    try {
      const res = await fetch("/api/agent/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category, subject, message }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setRef(j.reference);
      setSubject(""); setMessage("");
      router.refresh();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      {ref && <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-[#E7F6EC] px-4 py-3 text-sm font-medium text-success"><CheckCircle2 size={16} /> Ticket {ref} created. We&apos;ll get back to you.</div>}
      {error && <div className="rounded-xl border border-danger/20 bg-[#FCE9E9] px-4 py-3 text-sm font-medium text-danger">{error}</div>}
      <Field label="Category" required>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-11 w-full rounded-xl border border-surface-border bg-white px-3.5 text-[15px]">
          {SUPPORT_CATEGORIES.map((c) => <option key={c} value={c}>{LABELS[c]}</option>)}
        </select>
      </Field>
      <Field label="Subject" required><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary" /></Field>
      <Field label="Describe your issue" required><Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us what's happening…" /></Field>
      <Button className="w-full" loading={busy} onClick={submit} disabled={!subject || !message}>Create Ticket</Button>
    </div>
  );
}
