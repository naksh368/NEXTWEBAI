"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, ShieldCheck, ArrowLeft, Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";

export function ForgotPasswordFlow() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error ?? "Something went wrong."); return; }
      setStep("reset");
      setNotice(`If an account exists for ${email.trim()}, we've emailed a 6-digit reset code. Enter it below with your new password.`);
    } catch {
      setError("Network error. Please try again.");
    } finally { setLoading(false); }
  }

  async function reset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code, password }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error ?? "Could not reset password."); return; }
      router.push(data.redirect ?? "/account");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally { setLoading(false); }
  }

  if (step === "reset") {
    return (
      <form onSubmit={reset} className="space-y-4">
        <button type="button" onClick={() => { setStep("email"); setError(null); }} className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue"><KeyRound className="h-5 w-5" /></span>
          <h1 className="mt-4 text-2xl font-extrabold text-brand-navy">Set a new password</h1>
          {notice && <p className="mt-1 text-sm text-ink-muted">{notice}</p>}
        </div>
        <Field label="6-digit code" htmlFor="fp-code" required>
          <Input id="fp-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="text-center text-2xl tracking-[0.5em]" autoFocus />
        </Field>
        <Field label="New password" htmlFor="fp-pw" required hint="At least 8 characters">
          <div className="relative">
            <Input id="fp-pw" type={showPw ? "text" : "password"} autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"}>
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        {error && <p className="rounded-lg bg-[#FCE9E9] px-3 py-2 text-sm font-medium text-danger">{error}</p>}
        <Button type="submit" className="w-full" size="lg" loading={loading} disabled={code.length !== 6 || password.length < 8}>Reset password &amp; sign in</Button>
      </form>
    );
  }

  return (
    <form onSubmit={requestCode} className="space-y-4">
      <div className="mb-1">
        <h1 className="text-2xl font-extrabold text-brand-navy">Forgot your password?</h1>
        <p className="mt-1 text-sm text-ink-muted">Enter your email and we&apos;ll send a reset code.</p>
      </div>
      <Field label="Email address" htmlFor="fp-email" required>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input id="fp-email" type="email" autoComplete="email" placeholder="you@example.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
        </div>
      </Field>
      {error && <p className="rounded-lg bg-[#FCE9E9] px-3 py-2 text-sm font-medium text-danger">{error}</p>}
      <Button type="submit" className="w-full" size="lg" loading={loading}>Send reset code</Button>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-ink-muted">
        <ShieldCheck className="h-3.5 w-3.5 text-brand-blue" /> For your security we never reveal whether an email is registered.
      </p>
      <p className="text-center text-sm text-ink-muted">
        Remembered it?{" "}
        <Link href="/sign-in" className="font-semibold text-brand-blue hover:underline">Back to sign in</Link>
      </p>
    </form>
  );
}
