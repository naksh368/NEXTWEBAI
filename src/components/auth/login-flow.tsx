"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";

export function LoginFlow({ redirectTo = "/account" }: { redirectTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email.trim(), password, redirect: redirectTo }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error ?? "Login failed. Please try again."); return; }
      router.push(data.redirect ?? redirectTo);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-1">
        <h1 className="text-2xl font-extrabold text-brand-navy">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-muted">Sign in to manage your trips and bookings.</p>
      </div>

      <Field label="Email address" htmlFor="lf-email" required>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input id="lf-email" type="email" autoComplete="email" placeholder="you@example.com" className="pl-9"
            value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!error} autoFocus />
        </div>
      </Field>

      <Field label="Password" htmlFor="lf-pw" required>
        <div className="relative">
          <Input id="lf-pw" type={showPw ? "text" : "password"} autoComplete="current-password" placeholder="••••••••"
            value={password} onChange={(e) => setPassword(e.target.value)} invalid={!!error} />
          <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"}>
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>

      {error && <p className="rounded-lg bg-[#FCE9E9] px-3 py-2 text-sm font-medium text-danger">{error}</p>}

      <Button type="submit" className="w-full" size="lg" loading={loading}>Sign in</Button>

      <p className="text-center text-sm text-ink-muted">
        New here?{" "}
        <Link href={`/sign-up?redirect_url=${encodeURIComponent(redirectTo)}`} className="font-semibold text-brand-blue hover:underline">
          Create account
        </Link>
      </p>
    </form>
  );
}
