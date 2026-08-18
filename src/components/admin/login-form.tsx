"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";

export function AdminLoginForm() {
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
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error ?? "Invalid credentials."); return; }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-xl font-bold">Admin sign in</h1>
        <p className="mt-1 text-sm text-ink-muted">Enter your email or mobile number and password.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field label="Email or mobile" htmlFor="a-id" required>
          <Input
            id="a-id"
            type="text"
            autoComplete="username"
            placeholder="admin@expertztrip.com or 8700650467"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            invalid={!!error}
            autoFocus
          />
        </Field>

        <Field label="Password" htmlFor="a-pw" required>
          <div className="relative">
            <Input
              id="a-pw"
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

        <Button type="submit" className="w-full" size="lg" loading={loading}>Sign in to admin</Button>
      </form>
    </>
  );
}
