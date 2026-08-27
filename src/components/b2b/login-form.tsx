"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginForm({ redirectUrl }: { redirectUrl?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function login() {
    setError(null); setBusy(true);
    try {
      const res = await fetch("/api/agent/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier, password }) });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || "Login failed.");
        if (j.redirect) setTimeout(() => router.push(j.redirect), 900);
        return;
      }
      router.push(redirectUrl || j.redirect || "/agent");
      router.refresh();
    } catch { setError("Something went wrong. Please try again."); }
    finally { setBusy(false); }
  }

  async function forgot() {
    setBusy(true); setError(null);
    try {
      await fetch("/api/agent/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      setSent(true);
    } finally { setBusy(false); }
  }

  if (mode === "forgot") {
    return (
      <div className="space-y-4">
        <button onClick={() => setMode("login")} className="flex items-center gap-1 text-sm font-semibold text-ink-muted"><ArrowLeft size={15} /> Back to login</button>
        {sent ? (
          <p className="rounded-xl border border-brand-blue/15 bg-brand-blueLight px-4 py-3 text-sm text-brand-blue">
            If an account exists for <b>{email}</b>, we&apos;ve sent a reset link. It expires in 30 minutes.
          </p>
        ) : (
          <>
            <p className="text-sm text-ink-muted">Enter your account email and we&apos;ll send you a reset link.</p>
            <Field label="Email Address" required><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@agency.com" /></Field>
            <Button className="w-full" loading={busy} onClick={forgot} disabled={!email}>Send Reset Link</Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <div className="rounded-xl border border-danger/20 bg-[#FCE9E9] px-4 py-3 text-sm font-medium text-danger">{error}</div>}
      <Field label="Mobile / Email / Agent ID" required htmlFor="identifier">
        <Input id="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="you@agency.com" autoComplete="username"
          onKeyDown={(e) => e.key === "Enter" && password && login()} />
      </Field>
      <Field label="Password" required htmlFor="password">
        <div className="relative">
          <Input id="password" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="pr-11" autoComplete="current-password"
            onKeyDown={(e) => e.key === "Enter" && identifier && login()} />
          <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-label={showPw ? "Hide password" : "Show password"}>
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </Field>
      <div className="flex justify-end">
        <button onClick={() => setMode("forgot")} className="text-sm font-semibold text-brand-blue">Forgot Password?</button>
      </div>
      <Button className="w-full" loading={busy} onClick={login} disabled={!identifier || !password}>Login</Button>
    </div>
  );
}
