"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Mail, ShieldCheck, User, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";

type Step = "email" | "otp" | "profile";

export function LoginFlow({ redirectTo = "/account" }: { redirectTo?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function post(url: string, body: unknown) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return { res, data: await res.json() };
    } catch {
      return { res: null, data: { ok: false, error: "Network error. Please try again." } };
    } finally {
      setLoading(false);
    }
  }

  async function requestOtp() {
    const { data } = await post("/api/auth/request-otp", { email });
    if (!data.ok) return setError(data.error);
    setStep("otp");
    setNotice(process.env.NODE_ENV === "production" ? "We've sent a code to your email." : "Dev mode: your code is printed to the server console.");
  }

  async function verifyOtp() {
    const { data } = await post("/api/auth/verify-otp", { email, code });
    if (!data.ok) return setError(data.error);
    if (data.profileComplete) {
      router.push(redirectTo);
      router.refresh();
    } else {
      setStep("profile");
    }
  }

  async function completeProfile() {
    const { data } = await post("/api/auth/complete-profile", { fullName, mobile });
    if (!data.ok) return setError(data.error);
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-card sm:p-8">
        {step === "email" && (
          <>
            <StepHeader icon={<Mail className="h-5 w-5" />} title="Sign in or create account" subtitle="We'll email you a one-time code — no password needed." />
            <form onSubmit={(e) => { e.preventDefault(); requestOtp(); }} className="mt-6 space-y-4">
              <Field label="Email address" htmlFor="email" required hint="Your tickets, invoices and travel documents are sent here.">
                <Input id="email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!error} autoFocus />
              </Field>
              {error && <p className="text-sm font-medium text-danger">{error}</p>}
              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Send OTP <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}

        {step === "otp" && (
          <>
            <button onClick={() => { setStep("email"); setError(null); setCode(""); }} className="mb-3 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
              <ArrowLeft className="h-4 w-4" /> Change email
            </button>
            <StepHeader icon={<ShieldCheck className="h-5 w-5" />} title="Enter the OTP sent on email" subtitle={`Sent to ${email}`} />
            {notice && <p className="mt-3 rounded-lg bg-brand-blueLight px-3 py-2 text-xs text-brand-blue">{notice}</p>}
            <form onSubmit={(e) => { e.preventDefault(); verifyOtp(); }} className="mt-6 space-y-4">
              <Field label="One-time code" htmlFor="otp" required>
                <Input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} invalid={!!error}
                  className="text-center text-2xl tracking-[0.5em]" autoFocus />
              </Field>
              {error && <p className="text-sm font-medium text-danger">{error}</p>}
              <Button type="submit" className="w-full" size="lg" loading={loading} disabled={code.length !== 6}>
                Verify & continue
              </Button>
              <button type="button" onClick={requestOtp} className="w-full text-center text-sm font-medium text-brand-blue hover:underline" disabled={loading}>
                Resend code
              </button>
            </form>
          </>
        )}

        {step === "profile" && (
          <>
            <StepHeader icon={<User className="h-5 w-5" />} title="Almost there" subtitle="Tell us your name so we can personalise your tickets and documents." />
            <form onSubmit={(e) => { e.preventDefault(); completeProfile(); }} className="mt-6 space-y-4">
              <Field label="Full name" htmlFor="name" required>
                <Input id="name" autoComplete="name" placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} invalid={!!error} autoFocus />
              </Field>
              <Field label="Mobile number" htmlFor="mobile" hint="Optional — for booking updates. You can add it later.">
                <Input id="mobile" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" value={mobile} onChange={(e) => setMobile(e.target.value)} />
              </Field>
              {error && <p className="text-sm font-medium text-danger">{error}</p>}
              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Create account
              </Button>
            </form>
          </>
        )}
      </div>
      <p className="mt-4 text-center text-xs text-ink-muted">
        By continuing you agree to our <Link href="/legal/terms" className="underline">Terms</Link> and <Link href="/legal/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </div>
  );
}

function StepHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue">{icon}</span>
      <h1 className="mt-4 text-xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
    </div>
  );
}
