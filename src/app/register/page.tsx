"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { AuthAside } from "@/components/marketing/auth-aside";
import { Logo } from "@/components/ui/logo";
import { Field, Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <AuthAside />
      <div className="flex flex-col justify-center px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <div className="lg:hidden">
            <Logo size="md" href="/" />
          </div>

          {submitted ? (
            <div className="mt-8 rounded-2xl border border-surface-border bg-white p-8 text-center shadow-card lg:mt-0">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/15 text-success">
                <CheckCircle2 size={28} />
              </span>
              <h1 className="mt-4 text-xl font-extrabold text-navy">
                Application received
              </h1>
              <p className="mt-2 text-sm text-ink-muted">
                Thanks for registering. Our team will verify your business KYC and
                activate your ExpertzTrip agent account. You&apos;ll be notified by email.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Button variant="primary" size="lg" onClick={() => router.push("/dashboard")}>
                  Preview Agent Dashboard <ArrowRight size={18} />
                </Button>
                <Link
                  href="/"
                  className="text-sm font-bold text-ink-muted hover:text-navy"
                >
                  Back to home
                </Link>
              </div>
            </div>
          ) : (
            <>
              <h1 className="mt-8 text-2xl font-extrabold text-navy lg:mt-0">
                Become an Agent
              </h1>
              <p className="mt-1 text-sm text-ink-muted">
                Register your travel business. KYC verification keeps the network trusted.
              </p>

              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
              >
                <Field label="Company Name" required>
                  <Input required placeholder="Skyline Travels Pvt Ltd" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Agent Name" required>
                    <Input required placeholder="Rahul Sharma" />
                  </Field>
                  <Field label="City" required>
                    <Input required placeholder="New Delhi" />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Business Email" required>
                    <Input type="email" required placeholder="you@company.com" />
                  </Field>
                  <Field label="Phone" required>
                    <Input required placeholder="+91 98xxx xxxxx" />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="GST Number" hint="For GST-ready invoicing">
                    <Input placeholder="07AABCS1429L1Z5" />
                  </Field>
                  <Field label="PAN" required>
                    <Input required placeholder="AABCS1429L" />
                  </Field>
                </div>
                <Field label="Business Type" required>
                  <Select required defaultValue="">
                    <option value="" disabled>
                      Select business type
                    </option>
                    <option>Travel Agency</option>
                    <option>Tour Operator</option>
                    <option>Corporate Travel Desk</option>
                    <option>Sub-agent</option>
                  </Select>
                </Field>

                <label className="flex items-start gap-2 text-xs font-semibold text-ink-muted">
                  <input type="checkbox" required className="mt-0.5 accent-[#1455D9]" />
                  I confirm the details are accurate and agree to the ExpertzTrip Agent
                  Agreement and Terms of Use.
                </label>

                <Button type="submit" variant="accent" size="lg" className="w-full">
                  Submit Application <ArrowRight size={18} />
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-ink-muted">
                Already an agent?{" "}
                <Link href="/login" className="font-bold text-blue hover:underline">
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
