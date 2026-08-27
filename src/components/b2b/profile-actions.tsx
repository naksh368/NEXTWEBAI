"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { AgencyLogo } from "@/components/b2b/agency-logo";
import { PASSWORD_POLICY } from "@/lib/agent-constants";

export function LogoManager({ logoDocumentId, agencyName }: { logoDocumentId: string | null; agencyName: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Cache-bust the preview after replacing.
  const [v, setV] = useState(0);

  async function upload(file: File) {
    setError(null); setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file); fd.append("type", "LOGO"); fd.append("title", "Agency Logo");
      const res = await fetch("/api/agent/register/documents", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setV((x) => x + 1);
      router.refresh();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <div className="flex items-center gap-4">
      <div key={v}>
        <AgencyLogo logoDocumentId={logoDocumentId} agencyName={agencyName} size={64} />
      </div>
      <div>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
        <Button variant="outline" size="sm" loading={busy} onClick={() => inputRef.current?.click()}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} {logoDocumentId ? "Replace Logo" : "Upload Logo"}
        </Button>
        <p className="mt-1 text-xs text-ink-faint">PNG, JPG or WEBP · transparent PNG preferred</p>
        {error && <p className="mt-1 text-xs font-medium text-danger">{error}</p>}
      </div>
    </div>
  );
}

export function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit() {
    setError(null); setOk(false);
    if (!PASSWORD_POLICY.regex.test(next)) return setError(PASSWORD_POLICY.hint);
    if (next !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    try {
      const res = await fetch("/api/agent/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: current, newPassword: next }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setOk(true); setCurrent(""); setNext(""); setConfirm("");
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-3">
      {ok && <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-[#E7F6EC] px-4 py-3 text-sm font-medium text-success"><CheckCircle2 size={16} /> Password updated.</div>}
      {error && <div className="rounded-xl border border-danger/20 bg-[#FCE9E9] px-4 py-3 text-sm font-medium text-danger">{error}</div>}
      <Field label="Current Password" required><Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" /></Field>
      <Field label="New Password" required hint={PASSWORD_POLICY.hint}><Input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" /></Field>
      <Field label="Confirm New Password" required><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} invalid={Boolean(confirm) && confirm !== next} autoComplete="new-password" /></Field>
      <Button loading={busy} onClick={submit} disabled={!current || !next}>Change Password</Button>
    </div>
  );
}
