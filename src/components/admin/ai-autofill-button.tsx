"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, ChevronDown } from "lucide-react";
import { autofillPackageAction } from "@/app/admin/(panel)/packages/actions";

/** One-click "AI expert" that drafts the empty content fields of a package. */
export function AiAutofillButton({ versionId }: { versionId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const run = (mode: "blanks" | "all") => {
    setOpen(false);
    if (mode === "all" && !window.confirm("Rewrite ALL content fields with AI? This overwrites what's there (price is never touched).")) return;
    setMsg(null);
    start(async () => {
      const r = await autofillPackageAction(versionId, mode);
      if (r.ok) { setMsg({ ok: true, text: `AI filled ${r.filled.length} field${r.filled.length === 1 ? "" : "s"} — review before publishing.` }); router.refresh(); }
      else setMsg({ ok: false, text: r.error });
    });
  };

  return (
    <div className="relative">
      <div className="flex items-stretch overflow-hidden rounded-xl bg-brand-blue text-white">
        <button type="button" onClick={() => run("blanks")} disabled={pending} className="inline-flex h-10 items-center gap-2 px-4 text-sm font-bold hover:bg-brand-blueDark disabled:opacity-60">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} AI autofill
        </button>
        <button type="button" onClick={() => setOpen((o) => !o)} disabled={pending} aria-label="More AI options" className="grid w-8 place-items-center border-l border-white/20 hover:bg-brand-blueDark disabled:opacity-60">
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-56 overflow-hidden rounded-xl border border-surface-border bg-white shadow-cardHover">
          <button type="button" onClick={() => run("blanks")} className="block w-full px-4 py-2.5 text-left text-sm text-ink hover:bg-surface-muted">Fill empty fields only</button>
          <button type="button" onClick={() => run("all")} className="block w-full border-t border-surface-border px-4 py-2.5 text-left text-sm text-ink hover:bg-surface-muted">Regenerate all content</button>
        </div>
      )}
      {msg && <p className={`absolute right-0 top-full mt-1 w-64 text-right text-xs font-medium ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
    </div>
  );
}
