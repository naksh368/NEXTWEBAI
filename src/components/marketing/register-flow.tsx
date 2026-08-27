"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

type Step = "details" | "otp" | "business" | "done";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[6-9]\d{9}$/;

async function postJSON(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { res, data } as { res: Response; data: any };
}

export function RegisterFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");

  return (
    <div>
      <StepBadge step={step} />
      {step === "details" && <DetailsStep onDone={() => setStep("otp")} />}
      {step === "otp" && <OtpStep onDone={() => setStep("business")} />}
      {step === "business" && <BusinessStep onDone={() => setStep("done")} />}
      {step === "done" && (
        <div className="mt-6 rounded-2xl border border-success/30 bg-success/5 p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
          <h3 className="mt-3 text-lg font-extrabold text-brand-navy">Application submitted</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
            Your agency is now <span className="font-semibold text-brand-navy">under review</span>. Our team
            verifies your KYC and activates your wallet once approved. You can track status from your dashboard.
          </p>
          <button onClick={() => router.push("/partner")} className={buttonVariants({ variant: "orange", className: "mt-4" })}>
            Go to dashboard <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function StepBadge({ step }: { step: Step }) {
  const n = { details: 1, otp: 3, business: 2, done: 5 }[step];
  const label = { details: "Agency details", otp: "Verify mobile", business: "Business details", done: "Submitted" }[step];
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 items-center rounded-full bg-brand-orangeLight px-3 text-sm font-bold text-brand-orangeDark">Step {n} of 5</span>
      <h2 className="text-lg font-extrabold text-brand-navy">{label}</h2>
    </div>
  );
}

function DetailsStep({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ agencyName: "", ownerName: "", email: "", mobile: "", password: "" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (f.agencyName.trim().length < 2 || f.ownerName.trim().length < 2) return setErr("Enter your agency and contact name.");
    if (!MOBILE_RE.test(f.mobile.replace(/\D/g, "").slice(-10))) return setErr("Enter a valid 10-digit mobile number.");
    if (!EMAIL_RE.test(f.email.trim())) return setErr("Enter a valid email address.");
    if (f.password.length < 8) return setErr("Password must be at least 8 characters.");
    setBusy(true);
    const { res, data } = await postJSON("/api/agent/register", { ...f, mobile: f.mobile.replace(/\D/g, "").slice(-10) });
    setBusy(false);
    if (!res.ok) return setErr(data.error || "Could not register. Please try again.");
    onDone();
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
      <Field label="Agency name" value={f.agencyName} onChange={(v) => set("agencyName", v)} placeholder="e.g. Skyline Travels" />
      <Field label="Owner / contact name" value={f.ownerName} onChange={(v) => set("ownerName", v)} placeholder="Full name" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mobile number" value={f.mobile} onChange={(v) => set("mobile", v)} placeholder="10-digit mobile" prefix="+91" inputMode="tel" />
        <Field label="Email" value={f.email} onChange={(v) => set("email", v)} placeholder="you@agency.com" type="email" inputMode="email" />
      </div>
      <Field label="Create a password" value={f.password} onChange={(v) => set("password", v)} placeholder="At least 8 characters" type="password" />
      {err && <p className="text-sm font-medium text-danger">{err}</p>}
      <button type="submit" disabled={busy} className={buttonVariants({ variant: "orange", size: "lg", className: "w-full" })}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send OTP &amp; continue <ArrowRight className="h-4 w-4" /></>}
      </button>
      <p className="text-center text-xs text-ink-faint">A one-time code is sent to your mobile to verify it. Verification runs securely on our servers.</p>
    </form>
  );
}

function OtpStep({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState<string | null>(null);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!/^\d{6}$/.test(code)) return setErr("Enter the 6-digit code.");
    setBusy(true);
    const { res, data } = await postJSON("/api/agent/otp/verify", { code });
    setBusy(false);
    if (!res.ok) return setErr(data.error || "Incorrect code.");
    onDone();
  }
  async function resend() {
    setErr(null); setResent(null);
    const { res, data } = await postJSON("/api/agent/otp/request", {});
    if (res.ok) setResent("A new code has been sent.");
    else setErr(data.error || "Please wait before requesting another code.");
  }

  return (
    <form onSubmit={verify} className="mt-6 space-y-4" noValidate>
      <p className="text-sm text-ink-muted">We sent a 6-digit code to your mobile. Enter it below to verify.</p>
      <input
        value={code}
        onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setErr(null); }}
        inputMode="numeric"
        placeholder="••••••"
        className="w-full rounded-xl border border-surface-border bg-white px-4 py-3 text-center text-2xl font-extrabold tracking-[0.4em] text-brand-navy outline-none focus:border-brand-blue"
      />
      {err && <p className="text-sm font-medium text-danger">{err}</p>}
      {resent && <p className="text-sm font-medium text-success">{resent}</p>}
      <button type="submit" disabled={busy} className={buttonVariants({ variant: "orange", size: "lg", className: "w-full" })}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Verify <ShieldCheck className="h-4 w-4" /></>}
      </button>
      <button type="button" onClick={resend} className="w-full text-center text-sm font-semibold text-brand-blue hover:underline">Resend code</button>
    </form>
  );
}

function BusinessStep({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ businessType: "PROPRIETORSHIP", pan: "", gstin: "", addressLine: "", city: "", state: "", pincode: "" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    const { res, data } = await postJSON("/api/agent/business", f);
    setBusy(false);
    if (!res.ok) return setErr(data.error || "Please check the form.");
    onDone();
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-brand-navy">Business type</span>
        <select value={f.businessType} onChange={(e) => set("businessType", e.target.value)} className="w-full rounded-xl border border-surface-border bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-brand-blue">
          <option value="PROPRIETORSHIP">Proprietorship</option>
          <option value="PARTNERSHIP">Partnership</option>
          <option value="PVT_LTD">Private Limited</option>
          <option value="LLP">LLP</option>
          <option value="OTHER">Other</option>
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="PAN" value={f.pan} onChange={(v) => set("pan", v.toUpperCase())} placeholder="ABCDE1234F" />
        <Field label="GSTIN (optional)" value={f.gstin} onChange={(v) => set("gstin", v.toUpperCase())} placeholder="22ABCDE1234F1Z5" />
      </div>
      <Field label="Business address" value={f.addressLine} onChange={(v) => set("addressLine", v)} placeholder="Street, area" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="City" value={f.city} onChange={(v) => set("city", v)} placeholder="City" />
        <Field label="State" value={f.state} onChange={(v) => set("state", v)} placeholder="State" />
        <Field label="PIN code" value={f.pincode} onChange={(v) => set("pincode", v.replace(/\D/g, "").slice(0, 6))} placeholder="560001" inputMode="numeric" />
      </div>
      {err && <p className="text-sm font-medium text-danger">{err}</p>}
      <button type="submit" disabled={busy} className={buttonVariants({ variant: "orange", size: "lg", className: "w-full" })}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Submit for review <ArrowRight className="h-4 w-4" /></>}
      </button>
    </form>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", inputMode, prefix }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; inputMode?: "text" | "tel" | "email" | "numeric"; prefix?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-brand-navy">{label}</span>
      <span className="flex items-center overflow-hidden rounded-xl border border-surface-border bg-white transition-colors focus-within:border-brand-blue">
        {prefix && <span className="pl-3.5 text-sm font-semibold text-ink-muted">{prefix}</span>}
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} inputMode={inputMode}
          className="w-full bg-transparent px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-ink-faint" />
      </span>
    </label>
  );
}
