"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";

const REDIRECT = "/dashboard";

export function LoginForm() {
  const [stage, setStage] = useState<"credentials" | "otp">("credentials");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  function startCooldown(seconds = 30) {
    setResendIn(seconds);
    const t = setInterval(() => setResendIn((v) => (v <= 1 ? (clearInterval(t), 0) : v - 1)), 1000);
  }

  function go(url: string) {
    window.location.assign(url);
  }

  async function submitCredentials(e?: React.FormEvent) {
    e?.preventDefault();
    if (!identifier.trim() || !password) { setError("Enter your email and password."); return; }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password, redirect: REDIRECT }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Sign in failed. Please try again.");
        return;
      }
      if (json.step === "done") { go(json.redirect || REDIRECT); return; }
      // OTP step
      setOtpEmail(json.email ?? identifier.trim());
      setStage("otp");
      startCooldown();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verify(e?: React.FormEvent) {
    e?.preventDefault();
    if (!/^\d{6}$/.test(code)) { setError("Enter the 6-digit code we emailed you."); return; }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail, code, redirect: REDIRECT }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Verification failed. Please try again.");
        return;
      }
      go(json.redirect || REDIRECT);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-5 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-medium text-danger">
          {error}
        </div>
      )}

      {stage === "credentials" ? (
        <form onSubmit={submitCredentials} className="space-y-4">
          <Field label="Email address" htmlFor="identifier" hint="Your email is your sign-in ID.">
            <Input id="identifier" type="email" value={identifier} onChange={(e) => { setIdentifier(e.target.value); setError(null); }} placeholder="you@agency.com" autoComplete="email" />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input id="password" type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} placeholder="Your password" autoComplete="current-password" />
          </Field>
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm font-semibold text-brand-blue hover:underline">Forgot password?</Link>
          </div>
          <Button variant="primary" type="submit" loading={busy} className="w-full">
            Login <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4">
          <div className="rounded-xl border border-surface-border bg-surface-muted/50 px-4 py-3 text-sm">
            For your security, we&apos;ve emailed a 6-digit code to <span className="font-semibold text-brand-navy">{otpEmail}</span>.
          </div>
          <Field label="Verification code" htmlFor="code">
            <Input
              id="code" inputMode="numeric" maxLength={6}
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(null); }}
              placeholder="Enter 6-digit code"
              className="text-center text-lg font-bold tracking-[0.5em]"
            />
          </Field>
          <div className="flex items-center justify-between text-sm">
            <button type="button" disabled={resendIn > 0 || busy} onClick={() => submitCredentials()} className="font-semibold text-brand-blue disabled:text-ink-faint">
              {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
            </button>
            <button type="button" onClick={() => { setStage("credentials"); setCode(""); setError(null); }} className="text-ink-muted hover:text-brand-navy">
              Use a different account
            </button>
          </div>
          <Button variant="orange" type="submit" loading={busy} className="w-full">
            Verify &amp; sign in <Check className="h-4 w-4" />
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink-muted">
        New to ExpertzTrip?{" "}
        <Link href="/register" className="font-semibold text-brand-blue hover:underline">Register your agency</Link>
      </p>
    </div>
  );
}
