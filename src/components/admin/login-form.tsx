"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error); return; }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Work email" htmlFor="a-email" required>
        <Input id="a-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@expertztrip.com" autoFocus />
      </Field>
      <Field label="Password" htmlFor="a-pass" required error={error ?? undefined}>
        <Input id="a-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} invalid={!!error} placeholder="••••••••" />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={loading}>
        <LogIn className="h-4 w-4" /> Sign in to admin
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-ink-muted">
        <Lock className="h-3 w-3" /> Access is role-based and every action is audit-logged.
      </p>
    </form>
  );
}
