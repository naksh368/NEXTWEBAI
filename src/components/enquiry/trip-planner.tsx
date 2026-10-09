"use client";

import { useId, useState } from "react";
import { CalendarDays, Loader2, MapPin, Send, Users, CheckCircle2, Copy, Check } from "lucide-react";
import { Input, Select, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The hero trip-enquiry panel.
 *
 * This is an ENQUIRY form, not a booking engine: it creates a real lead in the
 * database and returns its reference. It never claims live availability,
 * because the agency confirms hotels and ferries by hand.
 */

export type PlannerPackage = { slug: string; name: string };

const TODAY = () => new Date().toISOString().slice(0, 10);

export function TripPlanner({
  destinations,
  packages,
  className,
  compact,
}: {
  destinations: string[];
  packages: PlannerPackage[];
  className?: string;
  compact?: boolean;
}) {
  const uid = useId();
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [reference, setReference] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    destination: destinations[0] ?? "Andaman Islands",
    startDate: "",
    endDate: "",
    travellers: "4",
    packageSlug: "",
    fullName: "",
    phone: "",
    email: "",
    consent: false,
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return; // guards a double submit
    setError(null);

    if (!form.fullName.trim()) return setError("Please tell us your name.");
    if (!/^[0-9+\-\s()]{6,20}$/.test(form.phone.trim())) return setError("Please enter a valid phone number.");
    if (!form.consent) return setError("Please accept the privacy notice so we can contact you.");
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      return setError("The return date cannot be before the travel date.");
    }

    setState("sending");
    const chosen = packages.find((p) => p.slug === form.packageSlug);
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          destination: form.destination,
          packageSlug: chosen?.slug,
          packageName: chosen?.name,
          travelDate: [form.startDate, form.endDate].filter(Boolean).join(" to ") || undefined,
          travellers: Number(form.travellers) || undefined,
          adults: Number(form.travellers) || undefined,
          consent: true,
          source: "WEBSITE",
          message: `Trip planner — ${form.destination}${form.startDate ? `, from ${form.startDate}` : ""}${form.endDate ? ` to ${form.endDate}` : ""}.`,
        }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; reference?: string; error?: string } | null;
      // Only ever report success when the server actually saved the enquiry.
      if (!res.ok || !data?.ok || !data.reference) {
        setState("idle");
        return setError(data?.error ?? "We could not send that just now. Please call or WhatsApp us instead.");
      }
      setReference(data.reference);
      setState("sent");
    } catch {
      setState("idle");
      setError("Network problem — please check your connection, or call us instead.");
    }
  }

  if (state === "sent" && reference) {
    return (
      <div className={cn("rounded-2xl border border-surface-border bg-white p-6 shadow-card sm:p-7", className)}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-success" />
          <div>
            <h3 className="text-lg font-extrabold text-brand-navy">Enquiry received</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              Thank you, {form.fullName.split(" ")[0]}. A travel specialist will review your request and get back to you
              on the number you gave us with a written itinerary and quotation.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-surface-muted p-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">Your reference</p>
            <p className="tabular text-xl font-extrabold text-brand-navy">{reference}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(reference).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }).catch(() => {});
            }}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-surface-border bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-brand-blue hover:text-brand-blue"
          >
            {copied ? <><Check className="h-4 w-4 text-success" /> Copied</> : <><Copy className="h-4 w-4" /> Copy</>}
          </button>
        </div>
        <Button
          variant="outline"
          className="mt-4 w-full"
          onClick={() => {
            setState("idle");
            setReference(null);
            setForm((f) => ({ ...f, packageSlug: "", startDate: "", endDate: "" }));
          }}
        >
          Send another enquiry
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className={cn("rounded-2xl border border-surface-border bg-white p-5 shadow-card sm:p-6", className)}
      aria-labelledby={`${uid}-title`}
    >
      <div className="mb-4">
        <h2 id={`${uid}-title`} className="text-lg font-extrabold text-brand-navy">Plan my trip</h2>
        <p className="mt-0.5 text-sm text-ink-muted">
          Tell us the basics and we will send you an itinerary and a written quotation.
        </p>
      </div>

      <div className={cn("grid gap-3.5", compact ? "sm:grid-cols-2" : "sm:grid-cols-2")}>
        <Field label="Destination" htmlFor={`${uid}-dest`}>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <Select id={`${uid}-dest`} className="pl-9" value={form.destination} onChange={(e) => set("destination", e.target.value)}>
              {destinations.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </div>
        </Field>

        <Field label="Preferred package" htmlFor={`${uid}-pkg`}>
          <Select id={`${uid}-pkg`} value={form.packageSlug} onChange={(e) => set("packageSlug", e.target.value)}>
            <option value="">Not sure yet</option>
            {packages.map((p) => (
              <option key={p.slug} value={p.slug}>{p.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="Travel start date" htmlFor={`${uid}-start`}>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <Input id={`${uid}-start`} type="date" className="pl-9" min={TODAY()} value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </div>
        </Field>

        <Field label="Travel end date" htmlFor={`${uid}-end`}>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <Input id={`${uid}-end`} type="date" className="pl-9" min={form.startDate || TODAY()} value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
          </div>
        </Field>

        <Field label="Travellers" htmlFor={`${uid}-pax`}>
          <div className="relative">
            <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <Select id={`${uid}-pax`} className="pl-9" value={form.travellers} onChange={(e) => set("travellers", e.target.value)}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? "traveller" : "travellers"}</option>
              ))}
            </Select>
          </div>
        </Field>

        <Field label="Your name" htmlFor={`${uid}-name`} required>
          <Input id={`${uid}-name`} autoComplete="name" placeholder="Full name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
        </Field>

        <Field label="Phone / WhatsApp" htmlFor={`${uid}-phone`} required>
          <Input id={`${uid}-phone`} type="tel" inputMode="tel" autoComplete="tel" placeholder="10-digit mobile number" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>

        <Field label="Email" htmlFor={`${uid}-email`} hint="Optional — we send the written quotation here.">
          <Input id={`${uid}-email`} type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm text-ink-muted">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => set("consent", e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-surface-border text-brand-blue focus:ring-brand-blue"
        />
        <span>
          I agree that {" "}
          <a href="/privacy-policy" className="font-semibold text-brand-blue underline-offset-2 hover:underline">
            JST Andaman Travels may contact me
          </a>{" "}
          about this enquiry.
        </span>
      </label>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-brand-orangeLight px-3 py-2 text-sm font-semibold text-brand-orangeDark">
          {error}
        </p>
      )}

      <Button type="submit" variant="orange" size="lg" className="mt-4 w-full" loading={state === "sending"}>
        {state === "sending" ? <>Sending<Loader2 className="h-4 w-4 animate-spin" /></> : <>Send enquiry <Send className="h-4 w-4" /></>}
      </Button>

      <p className="mt-2.5 text-center text-xs text-ink-muted">
        We reply with an itinerary and a written quotation. Sending an enquiry does not book or hold anything.
      </p>
    </form>
  );
}
