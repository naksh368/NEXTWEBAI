"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";

export function ProfileForm({ initial }: { initial: { fullName: string; email: string; mobile: string } }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initial.fullName);
  const [email, setEmail] = useState(initial.email);
  const [mobile, setMobile] = useState(initial.mobile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), email: email.trim() || null, mobile: mobile.trim() || null }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error ?? "Could not save. Please try again."); return; }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={save} className="max-w-md space-y-4">
      <Field label="Full name" htmlFor="p-name">
        <Input id="p-name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
      </Field>
      <Field label="Email address" htmlFor="p-email">
        <Input id="p-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" />
      </Field>
      <Field label="Mobile number" htmlFor="p-mobile">
        <Input id="p-mobile" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} autoComplete="tel" placeholder="9876543210" />
      </Field>
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" loading={loading}>Save changes</Button>
        {saved && <span className="inline-flex items-center gap-1 text-sm font-medium text-success"><Check className="h-4 w-4" /> Saved</span>}
      </div>
    </form>
  );
}
