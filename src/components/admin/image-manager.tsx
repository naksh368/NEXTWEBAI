"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, Trash2, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaUploader } from "@/components/admin/media-library";
import { addImageAction, removeImageAction, setCoverImageAction } from "@/app/admin/(panel)/packages/actions";

type Img = { id: string; url: string; alt: string | null; isCover: boolean };

export function ImageManager({ versionId, images }: { versionId: string; images: Img[] }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => { const r = await fn(); if (!r.ok) setError(r.error ?? "Failed."); else { setError(null); router.refresh(); } });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((im) => (
          <div key={im.id} className="group overflow-hidden rounded-xl border border-surface-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={im.url} alt={im.alt ?? ""} className="aspect-[4/3] w-full object-cover" />
            <div className="flex items-center justify-between gap-1 p-2">
              <button onClick={() => run(() => setCoverImageAction(im.id))} disabled={pending || im.isCover}
                className={`inline-flex items-center gap-1 text-xs font-semibold ${im.isCover ? "text-brand-orange" : "text-ink-muted hover:text-brand-blue"}`}>
                <Star className={`h-3.5 w-3.5 ${im.isCover ? "fill-current" : ""}`} /> {im.isCover ? "Cover" : "Set cover"}
              </button>
              <button onClick={() => run(() => removeImageAction(im.id))} disabled={pending} className="text-ink-faint hover:text-danger" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {images.length === 0 && <p className="col-span-full text-sm text-ink-muted">No images yet — add at least 3 below.</p>}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste image URL (https://…)" className="h-10 flex-1 rounded-lg border border-surface-border px-3 text-sm" />
        <Button size="sm" onClick={() => { if (!url.trim()) return; run(async () => { const r = await addImageAction(versionId, url.trim()); if (r.ok) setUrl(""); return r; }); }} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Add image</>}
        </Button>
        <span className="text-xs font-medium text-ink-faint sm:px-1">or</span>
        {/* Upload straight to the self-hosted media store, then attach the new URL. */}
        <MediaUploader compact onUploaded={(newUrl) => run(() => addImageAction(versionId, newUrl))} />
      </div>
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}
