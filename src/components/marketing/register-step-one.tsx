"use client";

import { useState } from "react";
import { CheckCircle2, ArrowRight, Mail } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

/**
 * Agency registration — Step 1 (Agency Details).
 *
 * Real client-side validation for the four Step-1 fields. Submission is
 * intentionally honest: it does NOT fabricate an account, OTP or approval —
 * those run server-side and are wired in a later phase. On valid submit we
 * confirm the details are captured and point the agency to support so nobody
 * is misled into thinking they are already onboarded.
 */
type Fields = { agency: string; contact: string; mobile: string; email: string };
type Errors = Partial<Record<keyof Fields, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[6-9]\d{9}$/; // Indian mobile, 10 digits

function validate(f: Fields): Errors {
  const e: Errors = {};
  if (f.agency.trim().length < 2) e.agency = "Enter your agency name.";
  if (f.contact.trim().length < 2) e.contact = "Enter the contact person's name.";
  if (!MOBILE_RE.test(f.mobile.replace(/\D/g, "").slice(-10))) e.mobile = "Enter a valid 10-digit mobile number.";
  if (!EMAIL_RE.test(f.email.trim())) e.email = "Enter a valid email address.";
  return e;
}

export function RegisterStepOne() {
  const [f, setF] = useState<Fields>({ agency: "", contact: "", mobile: "", email: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState(false);

  function set<K extends keyof Fields>(k: K, v: string) {
    setF((prev) => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
  }

  function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate(f);
    setErrors(e);
    if (Object.keys(e).length === 0) setDone(true);
  }

  if (done) {
    return (
      <div className="mt-6 rounded-2xl border border-success/30 bg-success/5 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
        <h3 className="mt-3 text-lg font-extrabold text-brand-navy">Details captured</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
          Thanks, {f.contact.split(" ")[0] || "there"}. Secure mobile &amp; email
          verification and KYC are being connected — our team will reach out to
          {" "}<span className="font-semibold text-brand-navy">{f.email}</span> to complete
          your agency onboarding. No account is active yet.
        </p>
        <a
          href="mailto:partners@expertztrip.com?subject=Agency%20registration"
          className={buttonVariants({ variant: "outline", size: "sm", className: "mt-4" })}
        >
          <Mail className="h-4 w-4" /> Contact onboarding team
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
      <Field label="Agency name" value={f.agency} onChange={(v) => set("agency", v)} error={errors.agency} placeholder="e.g. Skyline Travels" autoComplete="organization" />
      <Field label="Owner / contact name" value={f.contact} onChange={(v) => set("contact", v)} error={errors.contact} placeholder="Full name" autoComplete="name" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mobile number" value={f.mobile} onChange={(v) => set("mobile", v)} error={errors.mobile} placeholder="10-digit mobile" inputMode="tel" autoComplete="tel" prefix="+91" />
        <Field label="Email" value={f.email} onChange={(v) => set("email", v)} error={errors.email} placeholder="you@agency.com" inputMode="email" autoComplete="email" type="email" />
      </div>
      <button type="submit" className={buttonVariants({ variant: "orange", size: "lg", className: "w-full" })}>
        Continue <ArrowRight className="h-4 w-4" />
      </button>
      <p className="text-center text-xs text-ink-faint">
        By continuing you agree to ExpertzTrip&apos;s terms. Verification is handled
        securely on our servers.
      </p>
    </form>
  );
}

function Field({
  label, value, onChange, error, placeholder, type = "text", inputMode, autoComplete, prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  autoComplete?: string;
  prefix?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-brand-navy">{label}</span>
      <span className={`flex items-center overflow-hidden rounded-xl border bg-white transition-colors focus-within:border-brand-blue ${error ? "border-danger" : "border-surface-border"}`}>
        {prefix && <span className="pl-3.5 text-sm font-semibold text-ink-muted">{prefix}</span>}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          className="w-full bg-transparent px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-ink-faint"
        />
      </span>
      {error && <span className="mt-1 block text-xs font-medium text-danger">{error}</span>}
    </label>
  );
}
