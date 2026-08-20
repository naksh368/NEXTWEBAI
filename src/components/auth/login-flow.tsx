"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";

export function LoginFlow({ redirectTo = "/account" }: { redirectTo?: string }) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
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
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error ?? "Login failed. Please try again."); return; }
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-sm space-y-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-brand-navy">Sign in to your account</h2>
        <p className="mt-1 text-sm text-ink-muted">Use your email address or mobile number.</p>
      </div>

      <Field label="Email or mobile" htmlFor="lf-id" required>
        <Input
          id="lf-id"
          type="text"
          autoComplete="username"
          placeholder="email@example.com or 9876543210"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          invalid={!!error}
          autoFocus
        />
      </Field>

      <Field label="Password" htmlFor="lf-pw" required>
        <div className="relative">
          <Input
            id="lf-pw"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            invalid={!!error}
          />
          <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted" onClick={() => setShowPw((v) => !v)}>
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>

      {error && <p className="text-sm font-medium text-danger">{error}</p>}

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
