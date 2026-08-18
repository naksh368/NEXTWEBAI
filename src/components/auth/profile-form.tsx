"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Check } from "lucide-react";

export function ProfileForm({ initial }: { initial: { fullName: string; email: string; mobile: string } }) {
  const router = useRouter();
  const { user } = useUser();
  const [fullName, setFullName] = useState(initial.fullName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const parts = fullName.trim().split(" ");
      const firstName = parts[0] ?? "";
      const lastName = parts.slice(1).join(" ");
      await user.update({ firstName, lastName });
      setSaved(true);
      router.refresh();
    } catch {
      setError("Could not save. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={save} className="max-w-md space-y-4">
      <Field label="Email address" htmlFor="p-email" hint="Managed by your Clerk account.">
        <Input id="p-email" value={initial.email} disabled />
      </Field>
      <Field label="Full name" htmlFor="p-name" required>
        <Input id="p-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </Field>
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" loading={loading}>Save changes</Button>
        {saved && <span className="inline-flex items-center gap-1 text-sm font-medium text-success"><Check className="h-4 w-4" /> Saved</span>}
      </div>
    </form>
  );
}
