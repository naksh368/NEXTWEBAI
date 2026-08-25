"use client";

import { useState } from "react";
import { Check } from "lucide-react";

/** Newsletter opt-in. Stores nothing without a backend — a demo of the flow. */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="overflow-hidden rounded-3xl bg-brand-navy px-6 py-10 sm:px-12 sm:py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">Get trip inspiration & offers</h2>
        <p className="mt-2 text-white/70">
          Join our newsletter for handpicked holidays and seasonal deals. No spam, unsubscribe anytime.
        </p>
        {done ? (
          <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-white">
            <Check className="h-5 w-5 text-brand-orange" /> You&apos;re on the list — see you soon!
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (valid) setDone(true);
            }}
            className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Email address"
              className="h-12 flex-1 rounded-xl border border-white/15 bg-white/10 px-4 text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!valid}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-brand-orange px-6 font-semibold text-white transition-colors hover:bg-brand-orangeDark disabled:opacity-50"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
