"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Check } from "lucide-react";

export function ProfileForm({ initial }: { initial: { fullName: string; email: string; mobile: string } }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initial.fullName);
  const [email, setEmail] = useState(initial.email);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/auth/complete-profile", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error); return; }
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
      <Field label="Mobile number" htmlFor="p-mobile" hint="Your mobile is your login and can't be changed here.">
        <Input id="p-mobile" value={initial.mobile} disabled />
      </Field>
      <Field label="Full name" htmlFor="p-name" required>
        <Input id="p-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </Field>
      <Field label="Email address" htmlFor="p-email" required hint="Used for e-tickets, invoices and booking documents." error={error ?? undefined}>
        <Input id="p-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!error} />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={loading}>Save changes</Button>
        {saved && <span className="inline-flex items-center gap-1 text-sm font-medium text-success"><Check className="h-4 w-4" /> Saved</span>}
      </div>
    </form>
  );
}
