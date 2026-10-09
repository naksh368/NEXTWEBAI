"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, StickyNote } from "lucide-react";
import { updateEnquiryStatus } from "@/app/admin/(panel)/enquiries/actions";
import { ENQUIRY_STATUS, ENQUIRY_STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-lg border border-surface-border bg-white px-2 py-1.5 text-xs focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10";

/**
 * Inline lead editor. Saves through the server action, which re-checks the
 * caller's permission before writing anything.
 */
export function EnquiryRowForm({
  id,
  status,
  assignedToId,
  followUpAt,
  internalNotes,
  staff,
}: {
  id: string;
  status: string;
  assignedToId: string | null;
  followUpAt: string;
  internalNotes: string;
  staff: { id: string; fullName: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showNotes, setShowNotes] = useState(Boolean(internalNotes));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A status that is not in the current vocabulary (a legacy row) is kept as an
  // extra option so saving the form never silently rewrites it.
  const options = ENQUIRY_STATUS.includes(status as never) ? ENQUIRY_STATUS : [status, ...ENQUIRY_STATUS];

  return (
    <form
      className="space-y-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("id", id);
        setError(null);
        startTransition(async () => {
          const res = await updateEnquiryStatus(fd);
          if (res.ok) {
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
            router.refresh();
          } else {
            setError(res.error);
          }
        });
      }}
    >
      <select name="status" defaultValue={status} aria-label="Enquiry status" className={field}>
        {options.map((s) => (
          <option key={s} value={s}>{ENQUIRY_STATUS_META[s]?.label ?? s}</option>
        ))}
      </select>

      <select name="assignedToId" defaultValue={assignedToId ?? ""} aria-label="Assigned to" className={field}>
        <option value="">Unassigned</option>
        {staff.map((s) => (
          <option key={s.id} value={s.id}>{s.fullName}</option>
        ))}
      </select>

      <div className="flex items-center gap-1.5">
        <input type="date" name="followUpAt" defaultValue={followUpAt} title="Follow up on" aria-label="Follow up on" className={cn(field, "flex-1")} />
        <button
          type="button"
          onClick={() => setShowNotes((v) => !v)}
          aria-expanded={showNotes}
          title="Internal notes"
          aria-label="Internal notes"
          className={cn(
            "flex h-[30px] w-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
            internalNotes ? "border-brand-blue text-brand-blue" : "border-surface-border text-ink-faint hover:text-brand-blue"
          )}
        >
          <StickyNote className="h-3.5 w-3.5" />
        </button>
      </div>

      <textarea
        name="internalNotes"
        defaultValue={internalNotes}
        rows={3}
        maxLength={5000}
        placeholder="Internal notes — staff only, never sent to the customer."
        aria-label="Internal notes"
        className={cn(field, "resize-y", !showNotes && "hidden")}
      />

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-[30px] w-full items-center justify-center gap-1.5 rounded-lg bg-brand-blue px-3 text-xs font-bold text-white transition-colors hover:bg-brand-blueDark disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : null}
        {pending ? "Saving" : saved ? "Saved" : "Save"}
      </button>

      {error && <p role="alert" className="text-[11px] font-semibold text-danger">{error}</p>}
    </form>
  );
}
