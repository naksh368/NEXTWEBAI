"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User, Building2, FileCheck2, MailCheck, ArrowRight, ArrowLeft,
  Check, ShieldCheck, Loader2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/input";
import { BUSINESS_TYPES } from "@/lib/agency";
import { cn } from "@/lib/utils";

type Data = {
  fullName: string; email: string; mobile: string; password: string; confirm: string;
  agencyName: string; businessType: string; officeAddress: string;
  country: string; state: string; city: string; pincode: string;
  pan: string; gstin: string; udyam: string;
};

const EMPTY: Data = {
  fullName: "", email: "", mobile: "", password: "", confirm: "",
  agencyName: "", businessType: "", officeAddress: "",
  country: "India", state: "", city: "", pincode: "",
  pan: "", gstin: "", udyam: "",
};

const STEPS = [
  { n: 1, label: "Account", icon: User },
  { n: 2, label: "Agency", icon: Building2 },
  { n: 3, label: "Tax & KYC", icon: FileCheck2 },
  { n: 4, label: "Verify", icon: MailCheck },
];

const selectCls =
  "h-11 w-full rounded-xl border border-surface-border bg-white px-3.5 text-[15px] text-ink transition-colors focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10";

export function RegisterForm() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Data>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Data, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // OTP sub-state
  const [code, setCode] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [devHint, setDevHint] = useState<string | null>(null);

  // Success
  const [done, setDone] = useState<{ reference: string | null } | null>(null);

  const set = (k: keyof Data) => (v: string) => {
    setData((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
    setFormError(null);
  };

  function validateStep(s: number): boolean {
    const e: Partial<Record<keyof Data, string>> = {};
    if (s === 1) {
      if (data.fullName.trim().length < 2) e.fullName = "Enter your full name.";
      if (!/^\S+@\S+\.\S+$/.test(data.email.trim())) e.email = "Enter a valid email address.";
      if (data.mobile.replace(/\D/g, "").length < 10) e.mobile = "Enter a valid mobile number.";
      if (data.password.length < 8) e.password = "Use at least 8 characters.";
      if (data.confirm !== data.password) e.confirm = "Passwords do not match.";
    }
    if (s === 2) {
      if (data.agencyName.trim().length < 2) e.agencyName = "Enter your agency name.";
      if (!data.businessType) e.businessType = "Choose a business type.";
      if (!data.city.trim()) e.city = "Enter your city.";
    }
    if (s === 3) {
      if (data.pan && !/^[A-Za-z]{5}[0-9]{4}[A-Za-z]$/.test(data.pan.trim())) e.pan = "PAN looks invalid (e.g. ABCDE1234F).";
      if (data.gstin && data.gstin.trim().length !== 15) e.gstin = "GSTIN should be 15 characters.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    setFormError(null);
    if (validateStep(step)) setStep((s) => Math.min(4, s + 1));
  }
  function back() {
    setFormError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  function startResendCooldown(seconds = 30) {
    setResendIn(seconds);
    const t = setInterval(() => {
      setResendIn((v) => {
        if (v <= 1) { clearInterval(t); return 0; }
        return v - 1;
      });
    }, 1000);
  }

  async function requestOtp(): Promise<boolean> {
    setBusy(true);
    setFormError(null);
    setDevHint(null);
    try {
      const res = await fetch("/api/agent/register/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.fullName, email: data.email, mobile: data.mobile, password: data.password,
          agencyName: data.agencyName, businessType: data.businessType, officeAddress: data.officeAddress,
          country: data.country, state: data.state, city: data.city, pincode: data.pincode,
          pan: data.pan, gstin: data.gstin, udyam: data.udyam,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setFormError(json.error ?? "Something went wrong. Please try again.");
        return false;
      }
      if (json.devHint) setDevHint(json.devHint);
      startResendCooldown();
      return true;
    } catch {
      setFormError("Network error. Please check your connection and try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function submitDetails() {
    if (!validateStep(3)) return;
    const ok = await requestOtp();
    if (ok) setStep(4);
  }

  async function verify() {
    if (!/^\d{6}$/.test(code)) { setFormError("Enter the 6-digit code we emailed you."); return; }
    setBusy(true);
    setFormError(null);
    try {
      const res = await fetch("/api/agent/register/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, code }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setFormError(json.error ?? "Verification failed. Please try again.");
        return;
      }
      setDone({ reference: json.reference ?? null });
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // ── Success screen ──
  if (done) {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
          <Check className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-2xl font-extrabold text-brand-navy">Application received</h2>
        <p className="mt-2 text-ink-muted">
          Your email is verified and your agency application has been submitted. Our team will review it shortly — we&apos;ve emailed you a confirmation.
        </p>
        {done.reference && (
          <p className="mt-4 inline-block rounded-xl border border-surface-border bg-surface-muted/60 px-4 py-2 text-sm">
            Application reference <span className="font-bold text-brand-navy">{done.reference}</span>
          </p>
        )}
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/dashboard" className={buttonVariants({ variant: "primary" })}>
            Go to dashboard <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Stepper */}
      <ol className="mb-8 flex items-center">
        {STEPS.map((s, i) => {
          const active = step === s.n;
          const complete = step > s.n;
          return (
            <li key={s.n} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
              <div className="flex flex-col items-center">
                <span className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold transition-colors",
                  complete ? "border-brand-blue bg-brand-blue text-white"
                    : active ? "border-brand-blue bg-brand-blueLight text-brand-blue"
                    : "border-surface-border bg-white text-ink-faint",
                )}>
                  {complete ? <Check className="h-4 w-4" /> : s.n}
                </span>
                <span className={cn("mt-1.5 hidden text-[11px] font-semibold sm:block", active || complete ? "text-brand-navy" : "text-ink-faint")}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span className={cn("mx-2 mb-4 h-0.5 flex-1 rounded", step > s.n ? "bg-brand-blue" : "bg-surface-border")} />
              )}
            </li>
          );
        })}
      </ol>

      {formError && (
        <div className="mb-5 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-medium text-danger">
          {formError}
        </div>
      )}

      {/* Step 1 — Account */}
      {step === 1 && (
        <div className="space-y-4">
          <Field label="Full name" htmlFor="fullName" required error={errors.fullName}>
            <Input id="fullName" value={data.fullName} onChange={(e) => set("fullName")(e.target.value)} placeholder="e.g. Rahul Sharma" invalid={!!errors.fullName} autoComplete="name" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mobile number" htmlFor="mobile" required error={errors.mobile} hint="We'll use this to contact you.">
              <Input id="mobile" inputMode="numeric" value={data.mobile} onChange={(e) => set("mobile")(e.target.value)} placeholder="10-digit mobile" invalid={!!errors.mobile} autoComplete="tel" />
            </Field>
            <Field label="Email address" htmlFor="email" required error={errors.email} hint="Verified by OTP in the last step.">
              <Input id="email" type="email" value={data.email} onChange={(e) => set("email")(e.target.value)} placeholder="you@agency.com" invalid={!!errors.email} autoComplete="email" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Password" htmlFor="password" required error={errors.password} hint="At least 8 characters.">
              <Input id="password" type="password" value={data.password} onChange={(e) => set("password")(e.target.value)} placeholder="Create a password" invalid={!!errors.password} autoComplete="new-password" />
            </Field>
            <Field label="Confirm password" htmlFor="confirm" required error={errors.confirm}>
              <Input id="confirm" type="password" value={data.confirm} onChange={(e) => set("confirm")(e.target.value)} placeholder="Re-enter password" invalid={!!errors.confirm} autoComplete="new-password" />
            </Field>
          </div>
        </div>
      )}

      {/* Step 2 — Agency */}
      {step === 2 && (
        <div className="space-y-4">
          <Field label="Agency name" htmlFor="agencyName" required error={errors.agencyName}>
            <Input id="agencyName" value={data.agencyName} onChange={(e) => set("agencyName")(e.target.value)} placeholder="Your travel agency's name" invalid={!!errors.agencyName} />
          </Field>
          <Field label="Business type" htmlFor="businessType" required error={errors.businessType}>
            <select id="businessType" className={selectCls} value={data.businessType} onChange={(e) => set("businessType")(e.target.value)}>
              <option value="">Select business type…</option>
              {BUSINESS_TYPES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </Field>
          <Field label="Office address" htmlFor="officeAddress">
            <Textarea id="officeAddress" value={data.officeAddress} onChange={(e) => set("officeAddress")(e.target.value)} placeholder="Building, street, area" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Country" htmlFor="country">
              <Input id="country" value={data.country} onChange={(e) => set("country")(e.target.value)} />
            </Field>
            <Field label="State" htmlFor="state">
              <Input id="state" value={data.state} onChange={(e) => set("state")(e.target.value)} placeholder="e.g. Maharashtra" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City" htmlFor="city" required error={errors.city}>
              <Input id="city" value={data.city} onChange={(e) => set("city")(e.target.value)} placeholder="e.g. Mumbai" invalid={!!errors.city} />
            </Field>
            <Field label="PIN code" htmlFor="pincode">
              <Input id="pincode" inputMode="numeric" value={data.pincode} onChange={(e) => set("pincode")(e.target.value)} placeholder="6-digit PIN" />
            </Field>
          </div>
        </div>
      )}

      {/* Step 3 — Tax & KYC */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="rounded-xl bg-brand-blueLight/50 px-4 py-3 text-sm text-ink">
            These help us verify your agency faster. You can add or complete them later from your dashboard — only PAN format is checked here.
          </p>
          <Field label="PAN" htmlFor="pan" error={errors.pan} hint="Format: ABCDE1234F">
            <Input id="pan" value={data.pan} onChange={(e) => set("pan")(e.target.value.toUpperCase())} placeholder="Agency / proprietor PAN" invalid={!!errors.pan} maxLength={10} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="GSTIN" htmlFor="gstin" error={errors.gstin} hint="Where applicable.">
              <Input id="gstin" value={data.gstin} onChange={(e) => set("gstin")(e.target.value.toUpperCase())} placeholder="15-character GSTIN" invalid={!!errors.gstin} maxLength={15} />
            </Field>
            <Field label="Udyam registration" htmlFor="udyam" hint="Where applicable.">
              <Input id="udyam" value={data.udyam} onChange={(e) => set("udyam")(e.target.value.toUpperCase())} placeholder="UDYAM-XX-00-0000000" maxLength={19} />
            </Field>
          </div>
          <p className="flex items-start gap-2 text-xs text-ink-muted">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
            Document uploads (identity, PAN, GST certificate, business proof) are completed in your dashboard&apos;s guided KYC step after you verify your email.
          </p>
        </div>
      )}

      {/* Step 4 — Verify email OTP */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="rounded-xl border border-surface-border bg-surface-muted/50 px-4 py-3 text-sm">
            We&apos;ve emailed a 6-digit code to <span className="font-semibold text-brand-navy">{data.email}</span>. Enter it below to finish.
          </div>
          {devHint && <p className="text-xs font-medium text-warning">{devHint}</p>}
          <Field label="Verification code" htmlFor="code">
            <Input
              id="code" inputMode="numeric" maxLength={6}
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setFormError(null); }}
              placeholder="Enter 6-digit code"
              className="text-center text-lg font-bold tracking-[0.5em]"
            />
          </Field>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              disabled={resendIn > 0 || busy}
              onClick={() => requestOtp()}
              className="font-semibold text-brand-blue disabled:text-ink-faint"
            >
              {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
            </button>
            <button type="button" onClick={back} className="text-ink-muted hover:text-brand-navy">Edit details</button>
          </div>
        </div>
      )}

      {/* Nav buttons */}
      <div className="mt-8 flex items-center justify-between gap-3">
        {step > 1 && step < 4 ? (
          <Button variant="ghost" onClick={back} type="button"><ArrowLeft className="h-4 w-4" /> Back</Button>
        ) : <span />}

        {step < 3 && (
          <Button variant="primary" onClick={next} type="button" className="ml-auto">
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        )}
        {step === 3 && (
          <Button variant="orange" onClick={submitDetails} type="button" loading={busy} className="ml-auto">
            Send verification code <ArrowRight className="h-4 w-4" />
          </Button>
        )}
        {step === 4 && (
          <Button variant="orange" onClick={verify} type="button" loading={busy} className="ml-auto">
            {busy ? <>Verifying <Loader2 className="h-4 w-4 animate-spin" /></> : <>Verify & submit <Check className="h-4 w-4" /></>}
          </Button>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-brand-blue hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
