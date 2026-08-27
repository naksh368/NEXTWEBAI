"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Eye, EyeOff, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

/** Real partner (agent) login — authenticates server-side, then redirects. */
export function PartnerLoginForm() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (id.trim().length < 3 || pw.length < 1) {
      setError("Enter your email / agent ID and password.");
      return;
    }
    setError(null);
    setBusy(true);
    const res = await fetch("/api/agent/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: id.trim(), password: pw }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(data.error || "Login failed."); return; }
    router.push("/partner");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-brand-navy">Email or Agent ID</span>
        <input
          value={id}
          onChange={(e) => { setId(e.target.value); setError(null); }}
          placeholder="you@agency.com"
          autoComplete="username"
          className="w-full rounded-xl border border-surface-border bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition-colors focus:border-brand-blue"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-semibold text-brand-navy">Password</span>
          <Link href="/forgot-password" className="text-xs font-semibold text-brand-blue hover:underline">Forgot password?</Link>
        </span>
        <span className="flex items-center overflow-hidden rounded-xl border border-surface-border bg-white transition-colors focus-within:border-brand-blue">
          <input
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(null); }}
            type={show ? "text" : "password"}
            placeholder="Your password"
            autoComplete="current-password"
            className="w-full bg-transparent px-3.5 py-2.5 text-[15px] text-ink outline-none"
          />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="px-3 text-ink-faint hover:text-brand-navy">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </span>
      </label>

      {error && <p className="text-sm font-medium text-danger">{error}</p>}

      <button type="submit" disabled={busy} className={buttonVariants({ variant: "primary", size: "lg", className: "w-full" })}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><LogIn className="h-4 w-4" /> Login</>}
      </button>

      <p className="pt-1 text-center text-sm text-ink-muted">
        New agency?{" "}
        <Link href="/register" className="font-semibold text-brand-orange hover:underline">Register your agency</Link>
      </p>
    </form>
  );
}
