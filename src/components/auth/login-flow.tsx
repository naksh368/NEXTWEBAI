"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, ShieldCheck, ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";

export function LoginFlow({ redirectTo = "/account" }: { redirectTo?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noAccount, setNoAccount] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function submitCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setNoAccount(false); setNotice(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email.trim(), password, redirect: redirectTo }),
      });
      const data = await res.json();
      if (data.ok && data.step === "done") { router.push(data.redirect ?? redirectTo); router.refresh(); return; } // admin
      if (data.ok && data.step === "otp") { setStep("otp"); setNotice(`We've emailed a 6-digit login code to ${email.trim()}.`); return; }
      if (data.code === "NO_ACCOUNT") { setNoAccount(true); return; }
      setError(data.error ?? "Sign in failed. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/auth/login/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code, redirect: redirectTo }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error ?? "Verification failed."); return; }
      router.push(data.redirect ?? redirectTo);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "otp") {
    return (
      <form onSubmit={verify} className="space-y-4">
        <button type="button" onClick={() => { setStep("credentials"); setError(null); setCode(""); }} className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue"><ShieldCheck className="h-5 w-5" /></span>
          <h1 className="mt-4 text-2xl font-extrabold text-brand-navy">Enter your login code</h1>
          {notice && <p className="mt-1 text-sm text-ink-muted">{notice}</p>}
        </div>
        <Field label="6-digit code" htmlFor="lf-otp" required>
          <Input id="lf-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} invalid={!!error} className="text-center text-2xl tracking-[0.5em]" autoFocus />
        </Field>
        {error && <p className="rounded-lg bg-[#FCE9E9] px-3 py-2 text-sm font-medium text-danger">{error}</p>}
        <Button type="submit" className="w-full" size="lg" loading={loading} disabled={code.length !== 6}>Verify &amp; sign in</Button>
        <button type="button" onClick={submitCredentials} disabled={loading} className="flex w-full items-center justify-center gap-1.5 text-center text-sm font-semibold text-brand-blue hover:underline">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Resend code
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={submitCredentials} className="space-y-4">
      <div className="mb-1">
        <h1 className="text-2xl font-extrabold text-brand-navy">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-muted">Sign in to manage your trips and bookings.</p>
      </div>

      <Field label="Email address" htmlFor="lf-email" required>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input id="lf-email" type="email" autoComplete="email" placeholder="you@example.com" className="pl-9"
            value={email} onChange={(e) => { setEmail(e.target.value); setNoAccount(false); }} invalid={!!error} autoFocus />
        </div>
      </Field>

      <Field label="Password" htmlFor="lf-pw" required>
        <div className="relative">
          <Input id="lf-pw" type={showPw ? "text" : "password"} autoComplete="current-password" placeholder="••••••••"
            value={password} onChange={(e) => setPassword(e.target.value)} invalid={!!error} />
          <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"}>
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>

      {noAccount && (
        <div className="rounded-xl border border-brand-blue/20 bg-brand-blueLight/60 p-3.5 text-sm text-brand-blue">
          <p className="font-semibold">You don&apos;t have an account yet.</p>
          <p className="mt-0.5 text-brand-blue/80">Create one in a few seconds — it&apos;s free.</p>
          <Link href={`/sign-up?redirect_url=${encodeURIComponent(redirectTo)}`} className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-blue px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-blueDark">
            <UserPlus className="h-3.5 w-3.5" /> Create account
          </Link>
        </div>
      )}
      {error && !noAccount && <p className="rounded-lg bg-[#FCE9E9] px-3 py-2 text-sm font-medium text-danger">{error}</p>}

      <div className="flex justify-end -mt-1">
        <Link href="/forgot-password" className="text-sm font-semibold text-brand-blue hover:underline">Forgot password?</Link>
      </div>

      <Button type="submit" className="w-full" size="lg" loading={loading}>Continue</Button>

      <p className="text-center text-sm text-ink-muted">
        New here?{" "}
        <Link href={`/sign-up?redirect_url=${encodeURIComponent(redirectTo)}`} className="font-semibold text-brand-blue hover:underline">
          Create account
        </Link>
      </p>
    </form>
  );
}
