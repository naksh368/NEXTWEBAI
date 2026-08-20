"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), identifier: identifier.trim(), password }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error ?? "Registration failed. Please try again."); return; }
      router.push("/account");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-12">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-brand-navy">Create your account</h1>
          <p className="mt-1 text-sm text-ink-muted">Join ExpertzTrip to manage your bookings and trips.</p>
        </div>

        <Field label="Full name" htmlFor="su-name" required>
          <Input id="su-name" type="text" autoComplete="name" placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
        </Field>

        <Field label="Email or mobile" htmlFor="su-id" required>
          <Input id="su-id" type="text" autoComplete="username" placeholder="email@example.com or 9876543210" value={identifier} onChange={(e) => setIdentifier(e.target.value)} invalid={!!error} />
        </Field>

        <Field label="Password" htmlFor="su-pw" required hint="Minimum 6 characters">
          <div className="relative">
            <Input id="su-pw" type={showPw ? "text" : "password"} autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} invalid={!!error} />
            <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted" onClick={() => setShowPw((v) => !v)}>
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        <Button type="submit" className="w-full" size="lg" loading={loading}>Create account</Button>

        <p className="text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-semibold text-brand-blue hover:underline">Sign in</Link>
        </p>
      </form>
    </Container>
  );
}
