import Link from "next/link";
import {
  Building2, FileCheck2, ShieldCheck, FileText, Send,
  ArrowRight, Info, Lock,
} from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { RegisterStepOne } from "@/components/marketing/register-step-one";

export const metadata = {
  title: "Register Your Agency",
  description:
    "Register your travel agency on ExpertzTrip — agency details, business KYC, mobile & email verification, documents and review.",
};

const STEPS = [
  { icon: Building2, title: "Agency Details", body: "Agency name, contact person, mobile and email." },
  { icon: FileCheck2, title: "Business Details", body: "Business type, PAN, GSTIN and registered address." },
  { icon: ShieldCheck, title: "Verification", body: "Verify your mobile and email securely." },
  { icon: FileText, title: "Documents", body: "Upload required business / KYC documents." },
  { icon: Send, title: "Submit", body: "Review and submit for approval." },
];

export default function RegisterPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-surface-border">
        <div className="absolute inset-0 hero-wash" aria-hidden />
        <Container className="relative py-12 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-blueLight bg-brand-blueLight px-3.5 py-1.5 text-sm font-semibold text-brand-blue">
              <Building2 className="h-4 w-4" /> Agency registration
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-brand-navy sm:text-5xl">
              Register your agency
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-ink-muted">
              Join ExpertzTrip in five simple steps. Business-verified agencies get a
              prepaid wallet and access to competitive fares.
            </p>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          {/* Step map */}
          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-extrabold text-ink-faint">0{i + 1}</span>
                </div>
                <h3 className="mt-3 text-sm font-bold text-brand-navy">{s.title}</h3>
                <p className="mt-1 text-xs text-ink-muted">{s.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            {/* Step 1 form */}
            <div className="rounded-3xl border border-surface-border bg-white p-6 shadow-card sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-9 items-center rounded-full bg-brand-orangeLight px-3 text-sm font-bold text-brand-orangeDark">Step 1 of 5</span>
                <h2 className="text-lg font-extrabold text-brand-navy">Agency details</h2>
              </div>
              <RegisterStepOne />
            </div>

            {/* Status / what to expect */}
            <aside className="space-y-4">
              <div className="flex items-start gap-3 rounded-2xl border border-brand-blueLight bg-brand-blueLight/50 p-5">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />
                <div className="text-sm text-brand-navy">
                  <p className="font-bold">Secure verification is being activated</p>
                  <p className="mt-1 text-ink-muted">
                    Mobile / email OTP and KYC review run entirely on our servers — no
                    codes or credentials are ever exposed to the browser. While we
                    finish connecting verification, submit your details and our team
                    will complete your onboarding.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-surface-border bg-white p-5 shadow-card">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />
                <div className="text-sm">
                  <p className="font-bold text-brand-navy">Your data is protected</p>
                  <p className="mt-1 text-ink-muted">PAN, GSTIN and documents are collected in later steps and stored securely for KYC review.</p>
                </div>
              </div>
              <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
                <p className="text-sm font-bold text-brand-navy">Already registered?</p>
                <p className="mt-1 text-sm text-ink-muted">Access your dashboard from Partner Login.</p>
                <Link href="/partner-login" className={buttonVariants({ variant: "outline", size: "sm", className: "mt-3" })}>
                  Partner Login <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}
