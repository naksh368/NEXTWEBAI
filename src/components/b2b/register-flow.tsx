"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, Upload, X, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BUSINESS_TYPES, PASSWORD_POLICY, passwordStrength,
  requiredDocsFor, GST_DOC, OTHER_DOC, LOGO_DOC, businessTypeLabel, maskPan,
} from "@/lib/agent-constants";

type DocMeta = { id: string; type: string; title: string; filename: string; status: string };

export type RegisterInitial = {
  email: string;
  isEmailVerified: boolean;
  status: string;
  applicationId: string | null;
  agency: {
    agencyName: string; businessType: string; officeAddress: string; country: string;
    state: string; city: string; pinCode: string; pan: string; gstin: string; udyam: string; otherRegistration: string;
  } | null;
  documents: DocMeta[];
  fullName: string;
  mobile: string;
};

const STEPS = ["Account", "Verify", "Agency", "Business", "Documents", "Review"];

export function RegisterFlow({ initial }: { initial: RegisterInitial }) {
  const router = useRouter();
  // Resume at the furthest completed point.
  const startStep = !initial.email ? 0 : !initial.isEmailVerified ? 1 : !initial.agency ? 2 : 4;
  const [step, setStep] = useState(startStep);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [fullName, setFullName] = useState(initial.fullName);
  const [mobile, setMobile] = useState(initial.mobile);
  const [email, setEmail] = useState(initial.email);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const strength = useMemo(() => passwordStrength(password), [password]);

  // Step 2
  const [code, setCode] = useState("");

  // Step 3+4
  const a = initial.agency;
  const [agencyName, setAgencyName] = useState(a?.agencyName ?? "");
  const [businessType, setBusinessType] = useState(a?.businessType ?? "PROPRIETORSHIP");
  const [officeAddress, setOfficeAddress] = useState(a?.officeAddress ?? "");
  const [country, setCountry] = useState(a?.country ?? "India");
  const [stateName, setStateName] = useState(a?.state ?? "");
  const [city, setCity] = useState(a?.city ?? "");
  const [pinCode, setPinCode] = useState(a?.pinCode ?? "");
  const [pan, setPan] = useState(a?.pan ?? "");
  const [gstin, setGstin] = useState(a?.gstin ?? "");
  const [udyam, setUdyam] = useState(a?.udyam ?? "");
  const [otherReg, setOtherReg] = useState(a?.otherRegistration ?? "");

  // Step 5
  const [docs, setDocs] = useState<DocMeta[]>(initial.documents);

  const docSlots = useMemo(() => {
    const list = [...requiredDocsFor(businessType).map((d) => ({ ...d, required: true }))];
    if (gstin.trim()) list.push({ ...GST_DOC, required: false });
    list.push({ ...LOGO_DOC, required: false });
    list.push({ ...OTHER_DOC, required: false });
    return list;
  }, [businessType, gstin]);

  const docByType = (type: string) => docs.find((d) => d.type === type);
  const missingRequired = docSlots.filter((s) => s.required && !docByType(s.type));

  async function post(url: string, body: unknown) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || "Something went wrong.");
    return json;
  }

  async function submitAccount() {
    setError(null);
    if (!PASSWORD_POLICY.regex.test(password)) return setError(PASSWORD_POLICY.hint);
    if (password !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    try {
      await post("/api/agent/register/account", { fullName, mobile, email, password, confirmPassword: confirm });
      setStep(1);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function verifyOtp() {
    setError(null); setBusy(true);
    try {
      await post("/api/agent/register/verify-otp", { code });
      setStep(2);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function resendOtp() {
    setError(null);
    try {
      const res = await fetch("/api/agent/register/verify-otp", { method: "PUT" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) setError(j.error || "Could not resend.");
    } catch { setError("Could not resend."); }
  }

  async function saveAgency() {
    setError(null); setBusy(true);
    try {
      await post("/api/agent/register/agency", {
        agencyName, businessType, officeAddress, country, state: stateName, city, pinCode,
        pan, gstin: gstin || undefined, udyam: udyam || undefined, otherRegistration: otherReg || undefined,
      });
      setStep(4);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function submitApplication() {
    setError(null); setBusy(true);
    try {
      const res = await post("/api/agent/register/submit", {});
      router.push(`/application?submitted=${res.applicationId}`);
    } catch (e) { setError((e as Error).message); setBusy(false); }
  }

  return (
    <div>
      <Stepper step={step} />
      {error && <div className="mt-4 rounded-xl border border-danger/20 bg-[#FCE9E9] px-4 py-3 text-sm font-medium text-danger">{error}</div>}

      <div className="mt-6">
        {step === 0 && (
          <div className="space-y-4">
            <Field label="Full Name" required htmlFor="fullName">
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" autoComplete="name" />
            </Field>
            <Field label="Mobile Number" required htmlFor="mobile">
              <Input id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="9876543210" inputMode="tel" autoComplete="tel" />
            </Field>
            <Field label="Email Address" required htmlFor="email">
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@agency.com" autoComplete="email" />
            </Field>
            <Field label="Password" required htmlFor="password" hint={PASSWORD_POLICY.hint}>
              <div className="relative">
                <Input id="password" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="pr-11" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-label={showPw ? "Hide password" : "Show password"}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>
            {password && (
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                  <div className={`h-full transition-all ${strength.score >= 4 ? "bg-success" : strength.score >= 3 ? "bg-warning" : "bg-danger"}`} style={{ width: `${(strength.score / 5) * 100}%` }} />
                </div>
                <span className="text-xs font-semibold text-ink-muted">{strength.label}</span>
              </div>
            )}
            <Field label="Confirm Password" required htmlFor="confirm">
              <Input id="confirm" type={showPw ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} invalid={Boolean(confirm) && confirm !== password} autoComplete="new-password" />
            </Field>
            <Button className="w-full" loading={busy} onClick={submitAccount}>Create Account <ArrowRight size={18} /></Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-ink-muted">We sent a 6-digit code to <b className="text-ink">{email}</b>. Enter it below to verify your account.</p>
            <Field label="Verification Code" required htmlFor="otp">
              <Input id="otp" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="123456" className="text-center text-2xl tracking-[0.5em]" />
            </Field>
            <Button className="w-full" loading={busy} onClick={verifyOtp} disabled={code.length !== 6}>Verify Email</Button>
            <button type="button" onClick={resendOtp} className="w-full text-sm font-semibold text-brand-blue">Resend code</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Field label="Agency Name" required><Input value={agencyName} onChange={(e) => setAgencyName(e.target.value)} placeholder="ABC Travels" /></Field>
            <Field label="Business Type" required>
              <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} className="h-11 w-full rounded-xl border border-surface-border bg-white px-3.5 text-[15px]">
                {BUSINESS_TYPES.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
              </select>
            </Field>
            <Field label="Office Address" required><Input value={officeAddress} onChange={(e) => setOfficeAddress(e.target.value)} placeholder="Street, area" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Country" required><Input value={country} onChange={(e) => setCountry(e.target.value)} /></Field>
              <Field label="State" required><Input value={stateName} onChange={(e) => setStateName(e.target.value)} /></Field>
              <Field label="City" required><Input value={city} onChange={(e) => setCity(e.target.value)} /></Field>
              <Field label="PIN Code" required><Input value={pinCode} onChange={(e) => setPinCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" /></Field>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft size={18} /> Back</Button>
              <Button className="flex-1" onClick={() => { if (!agencyName || !officeAddress || !stateName || !city || pinCode.length !== 6) { setError("Please complete all agency fields."); return; } setError(null); setStep(3); }}>Continue <ArrowRight size={18} /></Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Field label="PAN" required hint="Format: ABCDE1234F"><Input value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} /></Field>
            <Field label="GSTIN" hint="Optional — only if GST-registered"><Input value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} placeholder="22ABCDE1234F1Z5" maxLength={15} /></Field>
            <Field label="Udyam Registration" hint="Optional"><Input value={udyam} onChange={(e) => setUdyam(e.target.value)} /></Field>
            <Field label="Other Applicable Registration" hint="Optional"><Input value={otherReg} onChange={(e) => setOtherReg(e.target.value)} /></Field>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft size={18} /> Back</Button>
              <Button className="flex-1" loading={busy} onClick={saveAgency}>Save & Continue <ArrowRight size={18} /></Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-ink-muted">Upload the documents for a <b className="text-ink">{businessTypeLabel(businessType)}</b>. Accepted: PDF, JPG, PNG, WEBP.</p>
            <div className="space-y-3">
              {docSlots.map((slot) => (
                <DocRow key={slot.type} slot={slot} doc={docByType(slot.type)} onUploaded={(d) => setDocs((prev) => [...prev.filter((x) => x.type !== d.type), d])} onRemoved={(type) => setDocs((prev) => prev.filter((x) => x.type !== type))} setError={setError} />
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(3)}><ArrowLeft size={18} /> Back</Button>
              <Button className="flex-1" onClick={() => { if (missingRequired.length) { setError(`Please upload: ${missingRequired.map((m) => m.label).join(", ")}.`); return; } setError(null); setStep(5); }}>Review <ArrowRight size={18} /></Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <Review
            data={{ fullName, mobile, email, agencyName, businessType, officeAddress, country, state: stateName, city, pinCode, pan, gstin }}
            docs={docs} docSlots={docSlots} busy={busy} onBack={() => setStep(4)} onSubmit={submitApplication}
          />
        )}
      </div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-1.5">
      {STEPS.map((label, i) => (
        <li key={label} className="flex flex-1 flex-col items-center gap-1.5">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i < step ? "bg-brand-blue text-white" : i === step ? "bg-brand-orange text-white" : "bg-surface-muted text-ink-faint"}`}>
            {i < step ? <Check size={14} /> : i + 1}
          </div>
          <span className={`hidden text-[11px] font-semibold sm:block ${i === step ? "text-ink" : "text-ink-faint"}`}>{label}</span>
        </li>
      ))}
    </ol>
  );
}

function DocRow({ slot, doc, onUploaded, onRemoved, setError }: {
  slot: { type: string; label: string; hint?: string; required: boolean };
  doc?: DocMeta;
  onUploaded: (d: DocMeta) => void;
  onRemoved: (type: string) => void;
  setError: (e: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handle(file: File) {
    setError(null); setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", slot.type);
      fd.append("title", slot.label);
      const res = await fetch("/api/agent/register/documents", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      onUploaded(j.document);
    } catch (e) { setError((e as Error).message); }
    finally { setUploading(false); }
  }

  async function remove() {
    if (!doc) return;
    await fetch(`/api/agent/documents/${doc.id}`, { method: "DELETE" });
    onRemoved(slot.type);
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-surface-border bg-white p-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-ink">{slot.label}</p>
          {slot.required ? <span className="text-brand-orange">*</span> : <Badge tone="neutral">Optional</Badge>}
        </div>
        {doc ? (
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-success"><Check size={12} /> {doc.filename}</p>
        ) : slot.hint ? <p className="mt-0.5 truncate text-xs text-ink-faint">{slot.hint}</p> : null}
      </div>
      <div className="shrink-0">
        <input ref={inputRef} type="file" className="hidden" accept={slot.type === "LOGO" ? "image/png,image/jpeg,image/webp" : "application/pdf,image/png,image/jpeg,image/webp"} onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ""; }} />
        {doc ? (
          <button onClick={remove} className="inline-flex items-center gap-1 rounded-lg border border-surface-border px-3 py-1.5 text-xs font-semibold text-ink-muted hover:text-danger"><X size={13} /> Replace</button>
        ) : (
          <button onClick={() => inputRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-blueLight px-3 py-1.5 text-xs font-bold text-brand-blue">
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Upload
          </button>
        )}
      </div>
    </div>
  );
}

function Review({ data, docs, docSlots, busy, onBack, onSubmit }: {
  data: Record<string, string>;
  docs: DocMeta[];
  docSlots: { type: string; label: string; required: boolean }[];
  busy: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const requiredCount = docSlots.filter((s) => s.required).length;
  const haveRequired = docSlots.filter((s) => s.required && docs.some((d) => d.type === s.type)).length;
  return (
    <div className="space-y-5">
      <ReviewGroup title="Personal Information" rows={[["Full Name", data.fullName], ["Mobile", data.mobile], ["Email", data.email]]} />
      <ReviewGroup title="Agency Information" rows={[["Agency", data.agencyName], ["Business Type", businessTypeLabel(data.businessType)], ["Address", `${data.officeAddress}, ${data.city}, ${data.state} ${data.pinCode}, ${data.country}`]]} />
      <ReviewGroup title="Business Information" rows={[["PAN", maskPan(data.pan)], ["GSTIN", data.gstin || "Not provided"]]} />
      <div className="rounded-xl border border-surface-border p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">Verification</p>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          <Badge tone="success"><Check size={12} /> Email Verified</Badge>
          <Badge tone="success"><Check size={12} /> Mobile Added</Badge>
          <Badge tone={data.pan ? "success" : "warning"}>PAN {data.pan ? "✓" : "Pending"}</Badge>
          <Badge tone={data.gstin ? "success" : "neutral"}>GST {data.gstin ? "✓" : "Not Provided"}</Badge>
          <Badge tone={haveRequired === requiredCount ? "success" : "warning"}>Documents {haveRequired}/{requiredCount} complete</Badge>
        </div>
      </div>
      <label className="flex items-start gap-2.5 rounded-xl bg-surface-muted/60 p-3.5 text-sm">
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 h-4 w-4" />
        <span>I confirm that all information submitted is accurate.</span>
      </label>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}><ArrowLeft size={18} /> Back</Button>
        <Button className="flex-1" variant="orange" loading={busy} disabled={!confirmed} onClick={onSubmit}>Submit for Verification</Button>
      </div>
    </div>
  );
}

function ReviewGroup({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-xl border border-surface-border p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">{title}</p>
      <dl className="mt-2 space-y-1.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 text-sm">
            <dt className="text-ink-muted">{k}</dt>
            <dd className="text-right font-semibold text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
