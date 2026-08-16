"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Download, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABEL } from "@/lib/constants";
import { deleteBookingDocumentAction } from "@/app/admin/(panel)/actions";
import { formatDate } from "@/lib/utils";

type Doc = { id: string; type: string; title: string; createdAt: string | Date };

export function DocumentManager({ bookingId, initial }: { bookingId: string; initial: Doc[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState("E_TICKET");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return setError("Choose a file to upload.");
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", type);
      fd.append("title", title || file.name);
      const res = await fetch(`/api/admin/bookings/${bookingId}/documents`, { method: "POST", body: fd });
      const data = await res.json();
      if (!data.ok) { setError(data.error ?? "Upload failed."); return; }
      setTitle("");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-5">
      {initial.length > 0 ? (
        <ul className="mb-4 divide-y divide-surface-border">
          {initial.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-brand-blue" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{d.title}</span>
                  <span className="text-xs text-ink-muted">{DOCUMENT_TYPE_LABEL[d.type] ?? d.type} · {formatDate(d.createdAt)}</span>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <a href={`/api/documents/${d.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-blue hover:underline"><Download className="h-4 w-4" /> Open</a>
                <button onClick={() => start(async () => { const r = await deleteBookingDocumentAction(d.id); if (r.ok) router.refresh(); })} disabled={pending} className="text-ink-faint hover:text-danger" aria-label="Delete document"><Trash2 className="h-4 w-4" /></button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-sm text-ink-muted">No documents uploaded yet.</p>
      )}

      <form onSubmit={upload} className="space-y-2 rounded-xl border border-dashed border-surface-border p-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <select value={type} onChange={(e) => setType(e.target.value)} className="h-10 rounded-lg border border-surface-border bg-white px-2 text-sm">
            {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{DOCUMENT_TYPE_LABEL[t]}</option>)}
          </select>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" className="h-10 rounded-lg border border-surface-border px-3 text-sm" />
        </div>
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="block w-full text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-blueLight file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-blue" />
        {error && <p className="text-sm font-medium text-danger">{error}</p>}
        <Button type="submit" size="sm" loading={loading}>
          {loading ? "Uploading…" : <><Upload className="h-4 w-4" /> Upload document</>}
        </Button>
        <p className="text-xs text-ink-faint">PDF, JPG, PNG or WEBP · up to 10 MB. Only the customer and admins can access it.</p>
      </form>
    </div>
  );
}
