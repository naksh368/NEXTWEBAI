"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mail, Phone, ShieldCheck, User, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Step = "method" | "email" | "mobile" | "otp" | "profile";
type Method = "email" | "mobile";

export function AdminLoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("method");
  const [method, setMethod] = useState<Method>("email");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function post(url: string, body: unknown) {
    setLoading(true); setError(null);
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return await res.json();
    } catch {
      return { ok: false, error: "Network error. Please try again." };
    } finally { setLoading(false); }
  }

  async function requestOtp() {
    if (method === "email") {
      const data = await post("/api/admin/otp/request", { email });
      if (!data.ok) return setError(data.error);
      setStep("otp");
      setNotice(process.env.NODE_ENV === "production" ? "If this email has admin access, we've sent a code." : "Dev mode: your code is printed to the server console.");
    } else {
      const data = await post("/api/admin/otp/request-mobile", { mobile });
      if (!data.ok) return setError(data.error);
      setStep("otp");
      setNotice(process.env.NODE_ENV === "production" ? "If this mobile has admin access, we've sent a code via SMS." : "Dev mode: your code is printed to the server console.");
    }
  }
  async function verify() {
    const data = await post("/api/admin/otp/verify", method === "email" ? { email, code } : { mobile, code });
    if (!data.ok) return setError(data.error);
    if (data.profileComplete) { router.push("/admin"); router.refresh(); }
    else setStep("profile");
  }
  async function completeProfile() {
    const data = await post("/api/admin/complete-profile", { fullName });
    if (!data.ok) return setError(data.error);
    router.push("/admin"); router.refresh();
  }

  return (
    <>
      {step === "method" && (
        <>
          <Head icon={<ShieldCheck className="h-5 w-5" />} title="Admin sign in" subtitle="Choose how you'd like to sign in." />
          <div className="mt-6 space-y-3">
            <button
              onClick={() => { setMethod("email"); setStep("email"); setError(null); }}
              className={cn(
                "w-full rounded-lg border-2 p-4 text-left transition-colors",
                method === "email" ? "border-brand-blue bg-brand-blueLight" : "border-surface-border hover:border-brand-blue"
              )}
            >
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-brand-blue" />
                <div>
                  <div className="font-semibold">Email OTP</div>
                  <div className="text-xs text-ink-muted">Sign in with your admin email</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => { setMethod("mobile"); setStep("mobile"); setError(null); }}
              className={cn(
                "w-full rounded-lg border-2 p-4 text-left transition-colors",
                method === "mobile" ? "border-brand-blue bg-brand-blueLight" : "border-surface-border hover:border-brand-blue"
              )}
            >
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-brand-blue" />
                <div>
                  <div className="font-semibold">Mobile OTP</div>
                  <div className="text-xs text-ink-muted">Sign in with your admin phone number</div>
                </div>
              </div>
            </button>
          </div>
        </>
      )}

      {step === "email" && (
        <>
          <Head icon={<Mail className="h-5 w-5" />} title="Admin sign in" subtitle="Enter your admin email to receive a one-time code." />
          <form onSubmit={(e) => { e.preventDefault(); requestOtp(); }} className="mt-6 space-y-4">
            <Field label="Admin email" htmlFor="a-email" required>
              <Input id="a-email" type="email" inputMode="email" autoComplete="email" placeholder="you@expertztrip.com" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!error} autoFocus />
            </Field>
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <Button type="submit" className="w-full" size="lg" loading={loading}>Send OTP <ArrowRight className="h-4 w-4" /></Button>
            <button type="button" onClick={() => { setStep("method"); setError(null); setEmail(""); }} className="w-full text-center text-sm text-ink-muted hover:text-ink"><ArrowLeft className="h-3 w-3 inline mr-1" /> Back</button>
          </form>
        </>
      )}

      {step === "mobile" && (
        <>
          <Head icon={<Phone className="h-5 w-5" />} title="Admin sign in" subtitle="Enter your admin phone number to receive a one-time code." />
          <form onSubmit={(e) => { e.preventDefault(); requestOtp(); }} className="mt-6 space-y-4">
            <Field label="Admin phone" htmlFor="a-mobile" required>
              <Input id="a-mobile" type="tel" inputMode="tel" autoComplete="tel" placeholder="+918700650467" value={mobile} onChange={(e) => setMobile(e.target.value)} invalid={!!error} autoFocus />
            </Field>
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <Button type="submit" className="w-full" size="lg" loading={loading}>Send OTP <ArrowRight className="h-4 w-4" /></Button>
            <button type="button" onClick={() => { setStep("method"); setError(null); setMobile(""); }} className="w-full text-center text-sm text-ink-muted hover:text-ink"><ArrowLeft className="h-3 w-3 inline mr-1" /> Back</button>
          </form>
        </>
      )}

      {step === "otp" && (
        <>
          <button onClick={() => { setStep(method === "email" ? "email" : "mobile"); setError(null); setCode(""); }} className="mb-3 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Change {method}</button>
          <Head icon={<ShieldCheck className="h-5 w-5" />} title="Enter the OTP sent" subtitle={`Sent to ${method === "email" ? email : mobile}`} />
          {notice && <p className="mt-3 rounded-lg bg-brand-blueLight px-3 py-2 text-xs text-brand-blue">{notice}</p>}
          <form onSubmit={(e) => { e.preventDefault(); verify(); }} className="mt-6 space-y-4">
            <Field label="One-time code" htmlFor="a-otp" required>
              <Input id="a-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} invalid={!!error} className="text-center text-2xl tracking-[0.5em]" autoFocus />
            </Field>
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <Button type="submit" className="w-full" size="lg" loading={loading} disabled={code.length !== 6}>Verify &amp; open admin</Button>
            <button type="button" onClick={requestOtp} className="w-full text-center text-sm font-semibold text-brand-blue hover:underline" disabled={loading}>Resend code</button>
          </form>
        </>
      )}

      {step === "profile" && (
        <>
          <Head icon={<User className="h-5 w-5" />} title="Set up your admin profile" subtitle="Add your name to finish setting up your admin account." />
          <form onSubmit={(e) => { e.preventDefault(); completeProfile(); }} className="mt-6 space-y-4">
            <Field label="Full name" htmlFor="a-name" required>
              <Input id="a-name" autoComplete="name" placeholder="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} invalid={!!error} autoFocus />
            </Field>
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <Button type="submit" className="w-full" size="lg" loading={loading}>Save &amp; continue</Button>
          </form>
        </>
      )}
    </>
  );
}

function Head({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue">{icon}</span>
      <h1 className="mt-4 text-xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
    </div>
  );
}
