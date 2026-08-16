"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Phone, ShieldCheck, Mail, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";

type Step = "mobile" | "otp" | "profile";

export function AdminLoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
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
    const data = await post("/api/admin/otp/request", { mobile });
    if (!data.ok) return setError(data.error);
    setStep("otp");
    setNotice(process.env.NODE_ENV === "production" ? "If this number has admin access, we've sent a code." : "Dev mode: your code is printed to the server console.");
  }
  async function verify() {
    const data = await post("/api/admin/otp/verify", { mobile, code });
    if (!data.ok) return setError(data.error);
    if (data.profileComplete) { router.push("/admin"); router.refresh(); }
    else setStep("profile");
  }
  async function completeProfile() {
    const data = await post("/api/admin/complete-profile", { fullName, email });
    if (!data.ok) return setError(data.error);
    router.push("/admin"); router.refresh();
  }

  return (
    <>
      {step === "mobile" && (
        <>
          <Head icon={<Phone className="h-5 w-5" />} title="Admin sign in" subtitle="Enter your admin mobile number to receive a one-time code." />
          <form onSubmit={(e) => { e.preventDefault(); requestOtp(); }} className="mt-6 space-y-4">
            <Field label="Admin mobile number" htmlFor="a-mobile" required hint="Indian numbers default to +91.">
              <Input id="a-mobile" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 79827 53767" value={mobile} onChange={(e) => setMobile(e.target.value)} invalid={!!error} autoFocus />
            </Field>
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <Button type="submit" className="w-full" size="lg" loading={loading}>Send OTP <ArrowRight className="h-4 w-4" /></Button>
          </form>
        </>
      )}

      {step === "otp" && (
        <>
          <button onClick={() => { setStep("mobile"); setError(null); setCode(""); }} className="mb-3 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Change number</button>
          <Head icon={<ShieldCheck className="h-5 w-5" />} title="Enter the 6-digit code" subtitle={`Sent to ${mobile}`} />
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
          <Head icon={<Mail className="h-5 w-5" />} title="Set up your admin profile" subtitle="Add your name and email to finish setting up your admin account." />
          <form onSubmit={(e) => { e.preventDefault(); completeProfile(); }} className="mt-6 space-y-4">
            <Field label="Full name" htmlFor="a-name" required>
              <Input id="a-name" autoComplete="name" placeholder="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
            </Field>
            <Field label="Email address" htmlFor="a-email" required error={error ?? undefined}>
              <Input id="a-email" type="email" autoComplete="email" placeholder="you@expertztrip.com" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!error} />
            </Field>
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
