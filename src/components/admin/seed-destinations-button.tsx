"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Globe2, Check } from "lucide-react";
import { seedDestinationsAction } from "@/app/admin/(panel)/settings/actions";

export function SeedDestinationsButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      <button type="button" disabled={pending}
        onClick={() => { setMsg(null); start(async () => {
          const r = await seedDestinationsAction();
          if (!r.ok) setMsg(r.error); else { setMsg(`Added ${r.added}, updated ${r.updated}.`); router.refresh(); }
        }); }}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-blue px-3 text-sm font-semibold text-white hover:bg-brand-blueDark disabled:opacity-60">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : msg ? <Check className="h-4 w-4" /> : <Globe2 className="h-4 w-4" />}
        Add popular destinations
      </button>
      {msg && <span className="text-xs font-medium text-ink-muted">{msg}</span>}
    </div>
  );
}
