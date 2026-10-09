"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowDown, ArrowUp, Check, Eye, EyeOff, Loader2, Pencil, Plus, Trash2, X,
} from "lucide-react";
import { MediaUploader } from "@/components/admin/media-library";
import { Panel } from "@/components/admin/ui";
import {
  createGalleryItemAction, deleteGalleryItemAction, reorderGalleryItemAction,
  toggleGalleryItemAction, updateGalleryItemAction,
} from "@/app/admin/(panel)/gallery/actions";
import { cn } from "@/lib/utils";

export type GalleryRow = {
  id: string;
  url: string;
  alt: string;
  caption: string | null;
  location: string | null;
  category: string;
  isPublished: boolean;
  sortOrder: number;
};

type Category = { key: string; label: string };

const input =
  "h-10 w-full rounded-xl border border-surface-border bg-white px-3 text-sm text-ink " +
  "focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10";
const label = "mb-1 block text-xs font-bold uppercase tracking-wide text-ink-faint";

export function GalleryManager({ items, categories }: { items: GalleryRow[]; categories: Category[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<GalleryRow | "new" | null>(null);
  const [flash, setFlash] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) =>
    startTransition(async () => {
      const res = await fn();
      setFlash(res.ok ? { tone: "ok", text: res.message ?? "Saved." } : { tone: "err", text: res.error ?? "Something went wrong." });
      if (res.ok) setEditing(null);
      router.refresh();
      setTimeout(() => setFlash(null), 4000);
    });

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

      {editing ? (
        <GalleryForm
          key={editing === "new" ? "new" : editing.id}
          item={editing === "new" ? null : editing}
          categories={categories}
          pending={pending}
          onCancel={() => setEditing(null)}
          onSubmit={(fd) =>
            run(() => (editing === "new" ? createGalleryItemAction(fd) : updateGalleryItemAction(editing.id, fd)))
          }
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-blue px-5 text-sm font-bold text-white transition-colors hover:bg-brand-blueDark"
        >
          <Plus className="h-4 w-4" /> Add photograph
        </button>
      )}

      <Panel title={`Gallery (${items.length})`}>
        {items.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-ink-muted">
            No photographs yet. Add one above — published photos appear on the public gallery page and the homepage.
          </p>
        ) : (
          <ul className="divide-y divide-surface-border">
            {items.map((item, i) => (
              <li key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                  <Image src={item.url} alt="" fill sizes="112px" className="object-cover" unoptimized />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-brand-blueLight px-2 py-0.5 text-[11px] font-bold text-brand-blue">
                      {categories.find((c) => c.key === item.category)?.label ?? item.category}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-bold",
                        item.isPublished ? "bg-[#E7F6EC] text-success" : "bg-surface-muted text-ink-muted"
                      )}
                    >
                      {item.isPublished ? "Published" : "Hidden"}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-brand-navy">{item.caption || item.alt}</p>
                  <p className="truncate text-xs text-ink-muted">
                    {item.location ? `${item.location} · ` : ""}
                    {item.alt}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <IconBtn label="Move up" disabled={i === 0 || pending} onClick={() => run(() => reorderGalleryItemAction(item.id, "up"))}>
                    <ArrowUp className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn label="Move down" disabled={i === items.length - 1 || pending} onClick={() => run(() => reorderGalleryItemAction(item.id, "down"))}>
                    <ArrowDown className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn
                    label={item.isPublished ? "Hide from the site" : "Publish"}
                    disabled={pending}
                    onClick={() => run(() => toggleGalleryItemAction(item.id))}
                  >
                    {item.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </IconBtn>
                  <IconBtn label="Edit" disabled={pending} onClick={() => setEditing(item)}>
                    <Pencil className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn
                    label="Delete"
                    danger
                    disabled={pending}
                    onClick={() => {
                      // Deleting a photo cannot be undone, so it is confirmed first.
                      if (confirm(`Remove this photograph from the gallery?\n\n"${item.caption || item.alt}"\n\nThis cannot be undone. To take it off the site temporarily, hide it instead.`)) {
                        run(() => deleteGalleryItemAction(item.id));
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconBtn>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function IconBtn({
  label: title,
  children,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border bg-white transition-colors disabled:opacity-35",
        danger ? "text-danger hover:border-danger hover:bg-[#FCE9E9]" : "text-ink-muted hover:border-brand-blue hover:text-brand-blue"
      )}
    >
      {children}
    </button>
  );
}

function GalleryForm({
  item,
  categories,
  pending,
  onCancel,
  onSubmit,
}: {
  item: GalleryRow | null;
  categories: Category[];
  pending: boolean;
  onCancel: () => void;
  onSubmit: (fd: FormData) => void;
}) {
  const [url, setUrl] = useState(item?.url ?? "");

  return (
    <Panel title={item ? "Edit photograph" : "Add photograph"}>
      <form
        className="space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          fd.set("url", url);
          onSubmit(fd);
        }}
      >
        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <div>
            <span className={label}>Image</span>
            <div className="relative mb-2 aspect-[4/3] overflow-hidden rounded-xl border border-surface-border bg-surface-muted">
              {url ? (
                <Image src={url} alt="" fill sizes="180px" className="object-cover" unoptimized />
              ) : (
                <span className="flex h-full items-center justify-center px-2 text-center text-xs text-ink-faint">
                  Upload or paste an image URL
                </span>
              )}
            </div>
            <MediaUploader compact onUploaded={(u) => setUrl(u)} />
          </div>

          <div className="space-y-4">
            <div>
              <label className={label} htmlFor="g-url">Image URL</label>
              <input
                id="g-url"
                className={input}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="/api/media/… or https://…"
                required
              />
            </div>

            <div>
              <label className={label} htmlFor="g-alt">
                Alt text <span className="font-normal normal-case text-ink-faint">— describe what the photo shows</span>
              </label>
              <input id="g-alt" name="alt" className={input} defaultValue={item?.alt ?? ""} maxLength={300} required placeholder="White sand and turquoise water at Radhanagar Beach" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="g-caption">Caption <span className="font-normal normal-case text-ink-faint">(optional)</span></label>
                <input id="g-caption" name="caption" className={input} defaultValue={item?.caption ?? ""} maxLength={300} />
              </div>
              <div>
                <label className={label} htmlFor="g-location">Location <span className="font-normal normal-case text-ink-faint">(optional)</span></label>
                <input id="g-location" name="location" className={input} defaultValue={item?.location ?? ""} maxLength={160} placeholder="Havelock Island" />
              </div>
              <div>
                <label className={label} htmlFor="g-category">Category</label>
                <select id="g-category" name="category" className={input} defaultValue={item?.category ?? categories[0]?.key}>
                  {categories.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label} htmlFor="g-order">Display order</label>
                <input id="g-order" name="sortOrder" type="number" min={0} max={9999} className={input} defaultValue={item?.sortOrder ?? 0} />
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-sm font-semibold text-ink">
              <input
                type="checkbox"
                name="isPublished"
                defaultChecked={item ? item.isPublished : true}
                className="h-4 w-4 rounded border-surface-border text-brand-blue focus:ring-brand-blue"
              />
              Published — visible on the public gallery
            </label>
          </div>
        </div>

        <div className="flex gap-3 border-t border-surface-border pt-4">
          <button
            type="submit"
            disabled={pending || !url}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-blue px-6 text-sm font-bold text-white transition-colors hover:bg-brand-blueDark disabled:opacity-50"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {item ? "Save changes" : "Add photograph"}
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
