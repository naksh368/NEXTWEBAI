"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, Plus, Star, Trash2, Undo2, X } from "lucide-react";
import { Panel, Pill } from "@/components/admin/ui";
import {
  createTestimonialAction, deleteTestimonialAction, setTestimonialStatusAction, updateTestimonialAction,
} from "@/app/admin/(panel)/testimonials/actions";
import { cn, formatDate } from "@/lib/utils";

export type TestimonialRow = {
  id: string;
  displayName: string;
  location: string | null;
  body: string;
  rating: number | null;
  photoUrl: string | null;
  packageName: string | null;
  reviewDate: string | null;
  status: string;
  sortOrder: number;
};

const input =
  "h-10 w-full rounded-xl border border-surface-border bg-white px-3 text-sm text-ink " +
  "focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10";
const label = "mb-1 block text-xs font-bold uppercase tracking-wide text-ink-faint";

const STATUS_TONE: Record<string, string> = { PUBLISHED: "success", PENDING: "warning", REJECTED: "danger" };

export function TestimonialsManager({ items }: { items: TestimonialRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<TestimonialRow | "new" | null>(null);
  const [flash, setFlash] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) =>
    startTransition(async () => {
      const res = await fn();
      setFlash(res.ok ? { tone: "ok", text: res.message ?? "Saved." } : { tone: "err", text: res.error ?? "Something went wrong." });
      if (res.ok) setEditing(null);
      router.refresh();
      setTimeout(() => setFlash(null), 4000);
    });

  const published = items.filter((i) => i.status === "PUBLISHED").length;

  return (
    <div className="space-y-5">
      {flash && (
        <div
          role="status"
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold",
            flash.tone === "ok" ? "bg-[#E7F6EC] text-success" : "bg-[#FCE9E9] text-danger"
          )}
        >
          {flash.tone === "ok" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />} {flash.text}
        </div>
      )}

      <div className="rounded-xl border border-surface-border bg-surface-muted p-4 text-sm leading-relaxed text-ink-muted">
        <strong className="font-bold text-ink">Only publish testimonials you really received.</strong> Nothing here is
        seeded or generated. The homepage section stays hidden entirely while no testimonial is published
        {published > 0 ? ` — ${published} ${published === 1 ? "is" : "are"} live right now.` : "."}
      </div>

      {editing ? (
        <TestimonialForm
          key={editing === "new" ? "new" : editing.id}
          item={editing === "new" ? null : editing}
          pending={pending}
          onCancel={() => setEditing(null)}
          onSubmit={(fd) =>
            run(() => (editing === "new" ? createTestimonialAction(fd) : updateTestimonialAction(editing.id, fd)))
          }
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-blue px-5 text-sm font-bold text-white transition-colors hover:bg-brand-blueDark"
        >
          <Plus className="h-4 w-4" /> Add testimonial
        </button>
      )}

      <Panel title={`Testimonials (${items.length})`}>
        {items.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-ink-muted">
            No testimonials yet. The homepage section is hidden until you publish one.
          </p>
        ) : (
          <ul className="divide-y divide-surface-border">
            {items.map((t) => (
              <li key={t.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-brand-navy">{t.displayName}</span>
                  {t.location && <span className="text-sm text-ink-muted">· {t.location}</span>}
                  <Pill tone={STATUS_TONE[t.status] ?? "neutral"}>{t.status.toLowerCase()}</Pill>
                  {t.rating !== null && (
                    <span className="inline-flex items-center gap-0.5 text-brand-orange" aria-label={`${t.rating} out of 5`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={i < t.rating! ? "h-3.5 w-3.5 fill-current" : "h-3.5 w-3.5 text-surface-border"} />
                      ))}
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t.body}</p>

                <p className="mt-2 text-xs text-ink-faint">
                  {[t.packageName, t.reviewDate ? formatDate(t.reviewDate) : null].filter(Boolean).join(" · ") || "No package or date recorded"}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {t.status !== "PUBLISHED" && (
                    <SmallBtn tone="ok" disabled={pending} onClick={() => run(() => setTestimonialStatusAction(t.id, "PUBLISHED"))}>
                      <Check className="h-3.5 w-3.5" /> Publish
                    </SmallBtn>
                  )}
                  {t.status === "PUBLISHED" && (
                    <SmallBtn disabled={pending} onClick={() => run(() => setTestimonialStatusAction(t.id, "PENDING"))}>
                      <Undo2 className="h-3.5 w-3.5" /> Unpublish
                    </SmallBtn>
                  )}
                  {t.status !== "REJECTED" && (
                    <SmallBtn disabled={pending} onClick={() => run(() => setTestimonialStatusAction(t.id, "REJECTED"))}>
                      <X className="h-3.5 w-3.5" /> Reject
                    </SmallBtn>
                  )}
                  <SmallBtn disabled={pending} onClick={() => setEditing(t)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </SmallBtn>
                  <SmallBtn
                    tone="danger"
                    disabled={pending}
                    onClick={() => {
                      if (confirm(`Delete the testimonial from ${t.displayName}? This cannot be undone — to take it off the site, unpublish it instead.`)) {
                        run(() => deleteTestimonialAction(t.id));
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </SmallBtn>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function SmallBtn({
  children,
  onClick,
  disabled,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "ok" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition-colors disabled:opacity-40",
        tone === "ok"
          ? "border-success/30 text-success hover:bg-[#E7F6EC]"
          : tone === "danger"
            ? "border-danger/30 text-danger hover:bg-[#FCE9E9]"
            : "border-surface-border text-ink-muted hover:border-brand-blue hover:text-brand-blue"
      )}
    >
      {children}
    </button>
  );
}

function TestimonialForm({
  item,
  pending,
  onCancel,
  onSubmit,
}: {
  item: TestimonialRow | null;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (fd: FormData) => void;
}) {
  return (
    <Panel title={item ? "Edit testimonial" : "Add testimonial"}>
      <form
        className="space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(new FormData(e.currentTarget));
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="t-name">Display name</label>
            <input id="t-name" name="displayName" className={input} defaultValue={item?.displayName ?? ""} maxLength={120} required />
          </div>
          <div>
            <label className={label} htmlFor="t-location">Location <span className="font-normal normal-case text-ink-faint">(optional)</span></label>
            <input id="t-location" name="location" className={input} defaultValue={item?.location ?? ""} maxLength={120} placeholder="Chennai" />
          </div>
        </div>

        <div>
          <label className={label} htmlFor="t-body">Testimonial</label>
          <textarea
            id="t-body"
            name="body"
            rows={4}
            defaultValue={item?.body ?? ""}
            maxLength={2000}
            required
            className="w-full rounded-xl border border-surface-border bg-white px-3 py-2.5 text-sm text-ink focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10"
            placeholder="Paste exactly what the traveller wrote."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={label} htmlFor="t-rating">Rating <span className="font-normal normal-case text-ink-faint">(optional)</span></label>
            <select id="t-rating" name="rating" className={input} defaultValue={item?.rating?.toString() ?? ""}>
              <option value="">No rating given</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="t-package">Package <span className="font-normal normal-case text-ink-faint">(optional)</span></label>
            <input id="t-package" name="packageName" className={input} defaultValue={item?.packageName ?? ""} maxLength={200} />
          </div>
          <div>
            <label className={label} htmlFor="t-date">Review date <span className="font-normal normal-case text-ink-faint">(optional)</span></label>
            <input id="t-date" name="reviewDate" type="date" className={input} defaultValue={item?.reviewDate?.slice(0, 10) ?? ""} />
          </div>
          <div>
            <label className={label} htmlFor="t-order">Display order</label>
            <input id="t-order" name="sortOrder" type="number" min={0} max={9999} className={input} defaultValue={item?.sortOrder ?? 0} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="t-photo">Photo URL <span className="font-normal normal-case text-ink-faint">(optional)</span></label>
            <input id="t-photo" name="photoUrl" className={input} defaultValue={item?.photoUrl ?? ""} maxLength={2000} placeholder="/api/media/… or https://…" />
          </div>
          <div>
            <label className={label} htmlFor="t-status">Status</label>
            <select id="t-status" name="status" className={input} defaultValue={item?.status ?? "PENDING"}>
              <option value="PENDING">Pending — not shown publicly</option>
              <option value="PUBLISHED">Published — live on the homepage</option>
              <option value="REJECTED">Rejected — never shown</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 border-t border-surface-border pt-4">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-blue px-6 text-sm font-bold text-white transition-colors hover:bg-brand-blueDark disabled:opacity-50"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {item ? "Save changes" : "Add testimonial"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 items-center rounded-xl border border-surface-border px-5 text-sm font-bold text-ink hover:bg-surface-muted"
          >
            Cancel
          </button>
        </div>
      </form>
    </Panel>
  );
}
