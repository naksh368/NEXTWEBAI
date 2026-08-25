"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { AuthAside } from "@/components/marketing/auth-aside";
import { Logo } from "@/components/ui/logo";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <AuthAside />
      <div className="flex flex-col justify-center px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <div className="lg:hidden">
            <Logo size="md" href="/" />
          </div>
          <h1 className="mt-8 text-2xl font-extrabold text-navy lg:mt-0">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Log in to your ExpertzTrip agent account.
          </p>

          <form
            className="mt-7 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              router.push("/dashboard");
            }}
          >
            <Field label="Business Email" required>
              <div className="relative">
                <Mail
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <Input
                  type="email"
                  required
                  defaultValue="rahul@skylinetravels.in"
                  className="pl-10"
                  placeholder="you@company.com"
                />
              </div>
            </Field>
            <Field label="Password" required>
              <div className="relative">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <Input
                  type="password"
                  required
                  defaultValue="password"
                  className="pl-10"
                  placeholder="••••••••"
                />
              </div>
            </Field>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-ink-muted">
                <input type="checkbox" className="accent-[#1455D9]" /> Remember me
              </label>
              <Link href="/login" className="text-sm font-bold text-blue hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full">
              Log in <ArrowRight size={18} />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            New to ExpertzTrip?{" "}
            <Link href="/register" className="font-bold text-orange hover:underline">
              Become an Agent
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
