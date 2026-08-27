"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileCheck2, Trash2, Loader2, Eye, ImageIcon, ShieldCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

type Existing = { id: string; filename: string; status: string } | null;

const STATUS_TONE: Record<string, string> = {
  PENDING: "text-warning", VERIFIED: "text-success", REJECTED: "text-danger",
};

async function uploadFile(kind: string, file: File): Promise<{ ok: boolean; error?: string }> {
  const fd = new FormData();
  fd.append("kind", kind);
  fd.append("file", file);
  const res = await fetch("/api/agent/kyc/upload", { method: "POST", body: fd });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok && json.ok, error: json.error };
}

export function KycUploadRow({ kind, label, hint, required, existing }: {
  kind: string; label: string; hint: string; required: boolean; existing: Existing;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file?: File) {
    if (!file) return;
    setBusy(true); setError(null);
    const r = await uploadFile(kind, file);
    setBusy(false);
    if (!r.ok) { setError(r.error ?? "Upload failed."); return; }
    router.refresh();
  }

  async function remove() {
    if (!existing) return;
    setBusy(true); setError(null);
    await fetch(`/api/agent/kyc/${existing.id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-bold text-brand-navy">
          {label}
          {required && <span className="rounded bg-brand-orangeLight px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-orange">Required</span>}
        </p>
        <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>
        {existing && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs">
            <FileCheck2 className="h-3.5 w-3.5 text-success" />
            <span className="max-w-[180px] truncate font-medium text-brand-navy">{existing.filename}</span>
            <span className={`font-semibold uppercase ${STATUS_TONE[existing.status] ?? "text-ink-faint"}`}>· {existing.status}</span>
          </p>
        )}
        {error && <p className="mt-1 text-xs font-medium text-danger">{error}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <input ref={inputRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])} />
        {existing ? (
          <>
            <a href={`/api/agent/kyc/${existing.id}`} target="_blank" rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-surface-border px-3 text-sm font-semibold text-ink hover:border-brand-blue hover:text-brand-blue">
              <Eye className="h-4 w-4" /> View
            </a>
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} loading={busy}>Replace</Button>
            <button onClick={remove} disabled={busy} aria-label="Remove" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-surface-border text-ink-muted hover:border-danger hover:text-danger">
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        ) : (
          <Button variant="primary" size="sm" onClick={() => inputRef.current?.click()} loading={busy}>
            {busy ? <>Uploading <Loader2 className="h-4 w-4 animate-spin" /></> : <><UploadCloud className="h-4 w-4" /> Upload</>}
          </Button>
        )}
      </div>
    </div>
  );
}

export function LogoUpload({ logoId }: { logoId: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file?: File) {
    if (!file) return;
    setBusy(true); setError(null);
    const r = await uploadFile("LOGO", file);
    setBusy(false);
    if (!r.ok) { setError(r.error ?? "Upload failed."); return; }
    router.refresh();
  }
  async function remove() {
    if (!logoId) return;
    setBusy(true);
    await fetch(`/api/agent/kyc/${logoId}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-surface-border bg-white p-4">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-surface-border bg-surface-muted">
        {logoId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/agent/kyc/${logoId}`} alt="Agency logo" className="h-full w-full object-contain" />
        ) : (
          <ImageIcon className="h-6 w-6 text-ink-faint" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-brand-navy">Agency logo</p>
        <p className="mt-0.5 text-xs text-ink-muted">PNG, JPG or WEBP. Shown in your Partner Portal.</p>
        {error && <p className="mt-1 text-xs font-medium text-danger">{error}</p>}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <div className="flex shrink-0 gap-2">
        <Button variant={logoId ? "outline" : "primary"} size="sm" onClick={() => inputRef.current?.click()} loading={busy}>
          {logoId ? "Replace" : "Upload"}
        </Button>
        {logoId && (
          <button onClick={remove} disabled={busy} aria-label="Remove logo" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-surface-border text-ink-muted hover:border-danger hover:text-danger">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function SubmitKyc({ complete }: { complete: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setBusy(true); setError(null);
    const res = await fetch("/api/agent/kyc/submit", { method: "POST" });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok || !json.ok) { setError(json.error ?? "Could not submit."); return; }
    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm font-medium text-success">
        <Check className="h-4 w-4" /> Submitted for verification. We&apos;ll email you once your agency is reviewed.
      </div>
    );
  }

  return (
    <div>
      <Button variant="orange" onClick={submit} loading={busy} disabled={!complete}>
        <ShieldCheck className="h-4 w-4" /> Submit for verification
      </Button>
      {!complete && <p className="mt-2 text-xs text-ink-muted">Upload all required documents to submit.</p>}
      {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
