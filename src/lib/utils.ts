import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className combiner used by every UI primitive. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * The site's public base URL, always a valid absolute URL. Tolerates a
 * NEXT_PUBLIC_SITE_URL set without a protocol (e.g. "expertztrip.com") by
 * adding https://, and strips any trailing slash — so the build never crashes
 * on `new URL(...)` from a domain typed without "https://".
 */
export function getSiteUrl(): string {
  // Prefer an explicit canonical URL, then the hosting platform's own URL so
  // server-generated links (emails!) never point at localhost in production.
  let u = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||                            // Netlify production URL
    process.env.DEPLOY_PRIME_URL ||               // Netlify branch/deploy URL
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||  // Vercel production domain
    process.env.VERCEL_URL ||                     // Vercel deployment URL
    ""
  ).trim() || "http://localhost:3000";
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  return u.replace(/\/+$/, "");
}

/** Format whole-rupee integers as INR. All money in this app is whole rupees. */
export function formatINR(amount: number, opts?: { compact?: boolean }): string {
  if (opts?.compact && Math.abs(amount) >= 100000) {
    const lakhs = amount / 100000;
    return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(2)} L`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Signed money, e.g. "+₹7,000" / "-₹4,000" — used in the price breakdown. */
export function formatDelta(amount: number): string {
  const sign = amount > 0 ? "+" : amount < 0 ? "-" : "";
  return `${sign}${formatINR(Math.abs(amount))}`;
}

export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  }).format(d);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Short, human-friendly booking reference, e.g. ETX-2K7QF3. */
export function makeReference(prefix = "ETX"): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${prefix}-${out}`;
}

export function pluralize(n: number, singular: string, plural?: string) {
  return `${n} ${n === 1 ? singular : plural ?? `${singular}s`}`;
}
