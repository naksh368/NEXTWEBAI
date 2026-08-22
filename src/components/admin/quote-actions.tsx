"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, Check } from "lucide-react";
import { sendQuoteAction } from "@/app/admin/(panel)/quotes/actions";

export function SendQuoteButton({ quoteId, sent }: { quoteId: string; sent: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(sent);

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => { setError(null); start(async () => {
          const r = await sendQuoteAction(quoteId);
          if (!r.ok) setError(r.error); else { setDone(true); router.refresh(); }
        }); }}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-blue px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-blueDark disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : done ? <Check className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
        {done ? "Resend" : "Send"}
      </button>
      {error && <span className="max-w-[200px] text-[11px] font-medium text-danger">{error}</span>}
    </span>
  );
}
