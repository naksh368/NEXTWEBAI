"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, Loader2 } from "lucide-react";
import { runDuePublishAction } from "@/app/admin/(panel)/actions";

/** Manually flip any packages whose scheduled publish time has passed. */
export function RunDuePublish() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-2">
      {msg && <span className="text-xs font-medium text-ink-muted">{msg}</span>}
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => {
          setMsg(null);
          const r = await runDuePublishAction();
          if (r.ok) { setMsg(r.published ? `Published ${r.published}` : "Nothing due"); router.refresh(); }
          else setMsg(r.error);
        })}
        className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-surface-border bg-white px-3 text-sm font-semibold text-brand-navy hover:border-brand-blue"
        title="Publish packages whose scheduled time has passed"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />} Publish due
      </button>
    </div>
  );
}
