"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PASSWORD_POLICY, passwordStrength } from "@/lib/agent-constants";

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const strength = useMemo(() => passwordStrength(password), [password]);

  async function submit() {
    setError(null);
    if (!PASSWORD_POLICY.regex.test(password)) return setError(PASSWORD_POLICY.hint);
    if (password !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    try {
      const res = await fetch("/api/agent/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      const j = await res.json();
      if (!res.ok) { setError(j.error || "Could not reset password."); return; }
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } finally { setBusy(false); }
  }

  if (done) return <p className="rounded-xl border border-success/20 bg-[#E7F6EC] px-4 py-3 text-sm font-medium text-success">Password updated. Redirecting to login…</p>;
  if (!token) return <p className="rounded-xl border border-danger/20 bg-[#FCE9E9] px-4 py-3 text-sm font-medium text-danger">This reset link is invalid. Please request a new one from the login page.</p>;

  return (
    <div className="space-y-4">
      {error && <div className="rounded-xl border border-danger/20 bg-[#FCE9E9] px-4 py-3 text-sm font-medium text-danger">{error}</div>}
      <Field label="New Password" required hint={PASSWORD_POLICY.hint}>
        <div className="relative">
          <Input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="pr-11" autoComplete="new-password" />
          <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint">{showPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>
      </Field>
      {password && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
            <div className={`h-full transition-all ${strength.score >= 4 ? "bg-success" : strength.score >= 3 ? "bg-warning" : "bg-danger"}`} style={{ width: `${(strength.score / 5) * 100}%` }} />
          </div>
          <span className="text-xs font-semibold text-ink-muted">{strength.label}</span>
        </div>
      )}
      <Field label="Confirm New Password" required>
        <Input type={showPw ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} invalid={Boolean(confirm) && confirm !== password} autoComplete="new-password" />
      </Field>
      <Button className="w-full" loading={busy} onClick={submit}>Update Password</Button>
    </div>
  );
}
