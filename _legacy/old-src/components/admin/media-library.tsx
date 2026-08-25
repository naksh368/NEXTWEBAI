"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, Copy, Check, Trash2, ImageIcon } from "lucide-react";
import { deleteMediaAction } from "@/app/admin/(panel)/media/actions";

export type MediaAsset = { id: string; filename: string; contentType: string; size: number; alt: string | null; createdAt: string | Date };

/** Uploads one or more images to the self-hosted media store; calls back with each new URL. */
export function MediaUploader({ onUploaded, compact }: { onUploaded?: (url: string, id: string) => void; compact?: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files || !files.length) return;
    setError(null);
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/media", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({ ok: false, error: "Upload failed." }));
        if (!data.ok) { setError(data.error ?? "Upload failed."); break; }
        onUploaded?.(data.url, data.id);
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    }
  }

  return (
    <div className={compact ? "" : "rounded-2xl border border-dashed border-surface-border bg-surface-muted/30 p-5 text-center"}>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={`inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 text-sm font-bold text-white transition-colors hover:bg-brand-blueDark disabled:opacity-50 ${compact ? "h-10" : "h-11"}`}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
        {busy ? "Uploading…" : compact ? "Upload image" : "Upload images"}
      </button>
      {!compact && <p className="mt-2 text-xs text-ink-muted">JPG, PNG, WebP, GIF or AVIF · up to 6 MB each · stored on your own server</p>}
      {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}

function CopyUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* clipboard blocked */ } }}
      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline"
    >
      {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy URL</>}
    </button>
  );
}

export function MediaLibrary({ assets, origin }: { assets: MediaAsset[]; origin: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="space-y-5">
      <MediaUploader />
      {assets.length === 0 ? (
        <div className="rounded-2xl border border-surface-border bg-white p-10 text-center">
          <ImageIcon className="mx-auto h-8 w-8 text-brand-blue" />
          <p className="mt-3 font-semibold text-brand-navy">No images yet</p>
          <p className="mt-1 text-sm text-ink-muted">Upload images above, then copy a URL to use anywhere — packages, offers, destinations.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map((a) => {
            const path = `/api/media/${a.id}`;
            return (
              <div key={a.id} className="overflow-hidden rounded-xl border border-surface-border bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={path} alt={a.alt ?? a.filename} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                <div className="space-y-1 p-2.5">
                  <p className="truncate text-xs font-medium text-ink" title={a.filename}>{a.filename}</p>
                  <p className="text-[11px] text-ink-faint">{(a.size / 1024).toFixed(0)} KB</p>
                  <div className="flex items-center justify-between pt-1">
                    <CopyUrl url={`${origin}${path}`} />
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => { if (!window.confirm("Delete this image? Anything using its URL will break.")) return; start(async () => { await deleteMediaAction(a.id); router.refresh(); }); }}
                      className="text-ink-faint hover:text-danger"
                      aria-label="Delete image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
