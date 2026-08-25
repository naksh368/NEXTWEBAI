import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an integer amount of rupees using the Indian numbering system. */
export function inr(amount: number, opts: { decimals?: boolean } = {}) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: opts.decimals ? 2 : 0,
    minimumFractionDigits: opts.decimals ? 2 : 0,
  }).format(amount);
}

/** Plain grouped number, no currency symbol. */
export function inrNumber(amount: number) {
  return new Intl.NumberFormat("en-IN").format(amount);
}

/** Convert minutes to "2h 40m". */
export function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h${m ? ` ${m}m` : ""}`;
}

/** Format an ISO time (HH:MM) or a Date to a short clock, e.g. "09:40". */
export function clock(value: string) {
  return value;
}

export function formatDate(
  value: string | Date,
  opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" },
) {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-IN", opts).format(d);
}
