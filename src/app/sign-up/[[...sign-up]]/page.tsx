"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setNotice(null);
    try {
      const res = await fetch("/api/auth/signup/request-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), email: email.trim(), password }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error ?? "Could not send the code."); return; }
      setStep(2);
      setNotice(`We've emailed a 6-digit code to ${email.trim()}. It expires in 10 minutes.`);
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/auth/signup/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error ?? "Verification failed."); return; }
      router.push(data.redirect ?? "/account");
      router.refresh();
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-sm">
        {step === 1 ? (
          <form onSubmit={requestOtp} className="space-y-4">
            <div className="mb-2">
              <h1 className="text-xl font-bold text-brand-navy">Create your account</h1>
              <p className="mt-1 text-sm text-ink-muted">We&apos;ll email you a code to verify your address.</p>
            </div>
            <Field label="Full name" htmlFor="su-name" required>
              <Input id="su-name" autoComplete="name" placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
            </Field>
            <Field label="Email address" htmlFor="su-email" required>
              <Input id="su-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!error} />
            </Field>
            <Field label="Password" htmlFor="su-pw" required hint="Minimum 6 characters">
              <div className="relative">
                <Input id="su-pw" type={showPw ? "text" : "password"} autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} invalid={!!error} />
                <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted" onClick={() => setShowPw((v) => !v)}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <Button type="submit" className="w-full" size="lg" loading={loading}>Send verification code</Button>
            <p className="text-center text-sm text-ink-muted">
              Already have an account? <Link href="/sign-in" className="font-semibold text-brand-blue hover:underline">Sign in</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-4">
            <button type="button" onClick={() => { setStep(1); setError(null); setCode(""); }} className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue"><ShieldCheck className="h-5 w-5" /></span>
              <h1 className="mt-4 text-xl font-bold text-brand-navy">Verify your email</h1>
              {notice && <p className="mt-1 text-sm text-ink-muted">{notice}</p>}
            </div>
            <Field label="6-digit code" htmlFor="su-otp" required>
              <Input id="su-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} invalid={!!error} className="text-center text-2xl tracking-[0.5em]" autoFocus />
            </Field>
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <Button type="submit" className="w-full" size="lg" loading={loading} disabled={code.length !== 6}>Verify &amp; create account</Button>
            <button type="button" onClick={requestOtp} disabled={loading} className="flex w-full items-center justify-center gap-1.5 text-center text-sm font-semibold text-brand-blue hover:underline">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Resend code
            </button>
          </form>
        )}
      </div>
    </Container>
  );
}
