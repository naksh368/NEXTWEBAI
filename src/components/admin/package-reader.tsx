"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2, Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
import { readPackageDetails, saveReadPackage, type ReadResult } from "@/app/admin/(panel)/import/read-actions";
import { autoName, isAutoName, TIERS, type Tier } from "@/lib/package-deduce";

const inp = "w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15";

const EXAMPLE = `ANDAMAN 5N/6D – 3 STAR
Port Blair (2N) – Havelock (2N) – Neil (1N)
Rs. 22,600/- per person (Min 4 Pax)

Inclusions:
• Hotel stay on twin sharing with breakfast
• All transfers by AC vehicle
• Private ferry tickets

Exclusions:
• Airfare
• Water sports

Day 1: Arrival at Port Blair
Airport pick-up, Cellular Jail and the Light & Sound Show.
Day 2: Ross Island & North Bay
…`;

type Pkg = ReadResult["pkg"];

/** Lines of a textarea ↔ a list. */
const toLines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

export function PackageReader() {
  const [text, setText] = useState("");
  const [reading, startRead] = useTransition();
  const [saving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [aiUsed, setAiUsed] = useState(false);
  const [pkg, setPkg] = useState<Pkg | null>(null);
  const [lists, setLists] = useState({ inclusions: "", exclusions: "" });
  const [saved, setSaved] = useState<{ packageId: string; slug: string } | null>(null);

  const read = () => {
    setError(null);
    setSaved(null);
    startRead(async () => {
      const res = await readPackageDetails(text);
      if (!res.ok) return setError(res.error);
      setPkg(res.pkg);
      setAiUsed(res.aiUsed);
      setLists({ inclusions: res.pkg.inclusions.join("\n"), exclusions: res.pkg.exclusions.join("\n") });
    });
  };

  const update = <K extends keyof Pkg>(key: K, value: Pkg[K]) => setPkg((p) => (p ? { ...p, [key]: value } : p));

  const setTier = (theme: Tier) => {
    // Keep a custom name; only rename while it is still the automatic one.
    setPkg((p) => (p ? { ...p, theme, name: isAutoName(p.name) ? autoName(theme, p.nights) : p.name } : p));
  };

  const save = () => {
    if (!pkg) return;
    setError(null);
    startSave(async () => {
      const res = await saveReadPackage({
        name: pkg.name,
        theme: pkg.theme,
        nights: pkg.nights,
        basePrice: pkg.basePrice ?? 0,
        minTravellers: pkg.minTravellers ?? 4,
        summary: pkg.summary,
        mealPlan: pkg.mealPlan,
        route: pkg.route.filter((r) => r.city.trim()),
        inclusions: toLines(lists.inclusions),
        exclusions: toLines(lists.exclusions),
        itinerary: pkg.itinerary.filter((d) => d.title.trim()),
      });
      if (!res.ok) return setError(res.error);
      setSaved(res);
    });
  };

  const routeNights = pkg?.route.reduce((n, r) => n + (Number(r.nights) || 0), 0) ?? 0;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-surface-border bg-white p-5">
        <h2 className="flex items-center gap-2 text-base font-extrabold text-brand-navy">
          <Wand2 className="h-5 w-5 text-brand-blue" /> Paste package details
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Paste a supplier message, a WhatsApp forward or your own notes. The hotel tier, nights, route, price, group size,
          inclusions and day-by-day plan are worked out for you to check. Nothing is published until you publish it.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          className={`${inp} mt-4 font-mono text-[13px]`}
          placeholder={EXAMPLE}
          aria-label="Package details"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={read}
            disabled={reading || text.trim().length < 20}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {reading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {reading ? "Reading…" : "Read details"}
          </button>
          <button type="button" onClick={() => setText(EXAMPLE.replace("…", "Boat trip to Ross Island and North Bay."))} className="text-sm font-semibold text-brand-blue hover:underline">
            Try an example
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      {saved && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-success/30 bg-success/5 p-4 text-sm">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <span className="font-semibold text-brand-navy">Saved as a draft. Add photos if you like, check it, then publish.</span>
          <Link href={`/admin/packages/${saved.packageId}/edit`} className="font-bold text-brand-blue hover:underline">
            Open the draft →
          </Link>
        </div>
      )}

      {pkg && !saved && (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5 rounded-2xl border border-surface-border bg-white p-5">
            <h3 className="text-base font-extrabold text-brand-navy">Check and adjust</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold sm:col-span-2">
                Package name
                <input className={`${inp} mt-1`} value={pkg.name} onChange={(e) => update("name", e.target.value)} />
              </label>
              <label className="block text-sm font-semibold">
                Hotel tier
                <select className={`${inp} mt-1`} value={pkg.theme} onChange={(e) => setTier(e.target.value as Tier)}>
                  {TIERS.map((t) => (
                    <option key={t.theme} value={t.theme}>{t.label} — {t.hotelCategory}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold">
                Nights
                <input type="number" min={1} max={20} className={`${inp} mt-1`} value={pkg.nights}
                  onChange={(e) => { const n = Number(e.target.value) || 1; setPkg((p) => (p ? { ...p, nights: n, days: n + 1, name: isAutoName(p.name) ? autoName(p.theme, n) : p.name } : p)); }} />
              </label>
              <label className="block text-sm font-semibold">
                Price per person (₹)
                <input type="number" min={0} className={`${inp} mt-1`} value={pkg.basePrice ?? ""} placeholder="Blank = price on request"
                  onChange={(e) => update("basePrice", e.target.value ? Number(e.target.value) : null)} />
              </label>
              <label className="block text-sm font-semibold">
                Minimum travellers
                <input type="number" min={1} max={50} className={`${inp} mt-1`} value={pkg.minTravellers ?? 4}
                  onChange={(e) => update("minTravellers", Number(e.target.value) || 1)} />
              </label>
              <label className="block text-sm font-semibold sm:col-span-2">
                Short summary <span className="font-normal text-ink-muted">(optional — one is written for you if blank)</span>
                <textarea rows={2} className={`${inp} mt-1`} value={pkg.summary ?? ""} onChange={(e) => update("summary", e.target.value || null)} />
              </label>
            </div>

            <fieldset>
              <legend className="text-sm font-semibold">
                Route <span className={routeNights && routeNights !== pkg.nights ? "font-bold text-warning" : "font-normal text-ink-muted"}>
                  ({routeNights} of {pkg.nights} nights)
                </span>
              </legend>
              <div className="mt-2 space-y-2">
                {pkg.route.map((r, i) => (
                  <div key={i} className="flex gap-2">
                    <input className={inp} value={r.city} aria-label="Place"
                      onChange={(e) => update("route", pkg.route.map((x, j) => (j === i ? { ...x, city: e.target.value } : x)))} />
                    <input type="number" min={0} className={`${inp} w-24`} value={r.nights} aria-label="Nights"
                      onChange={(e) => update("route", pkg.route.map((x, j) => (j === i ? { ...x, nights: Number(e.target.value) || 0 } : x)))} />
                    <button type="button" aria-label="Remove" onClick={() => update("route", pkg.route.filter((_, j) => j !== i))} className="px-2 text-ink-faint hover:text-danger">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => update("route", [...pkg.route, { city: "", nights: 1 }])} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue">
                  <Plus className="h-4 w-4" /> Add a place
                </button>
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                Inclusions <span className="font-normal text-ink-muted">(one per line)</span>
                <textarea rows={6} className={`${inp} mt-1`} value={lists.inclusions} onChange={(e) => setLists((l) => ({ ...l, inclusions: e.target.value }))} />
              </label>
              <label className="block text-sm font-semibold">
                Exclusions <span className="font-normal text-ink-muted">(one per line)</span>
                <textarea rows={6} className={`${inp} mt-1`} value={lists.exclusions} onChange={(e) => setLists((l) => ({ ...l, exclusions: e.target.value }))} />
              </label>
            </div>

            <fieldset>
              <legend className="text-sm font-semibold">Day-by-day plan ({pkg.itinerary.length} days)</legend>
              <div className="mt-2 space-y-3">
                {pkg.itinerary.map((d, i) => (
                  <div key={i} className="rounded-xl border border-surface-border p-3">
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 text-xs font-extrabold uppercase text-brand-blue">Day {d.day}</span>
                      <input className={inp} value={d.title} aria-label={`Day ${d.day} title`}
                        onChange={(e) => update("itinerary", pkg.itinerary.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                      <button type="button" aria-label="Remove day" onClick={() => update("itinerary", pkg.itinerary.filter((_, j) => j !== i).map((x, j) => ({ ...x, day: j + 1 })))} className="px-1 text-ink-faint hover:text-danger">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <textarea rows={2} className={`${inp} mt-2`} value={d.description} aria-label={`Day ${d.day} plan`}
                      onChange={(e) => update("itinerary", pkg.itinerary.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
                  </div>
                ))}
                <button type="button" onClick={() => update("itinerary", [...pkg.itinerary, { day: pkg.itinerary.length + 1, title: "", description: "" }])} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue">
                  <Plus className="h-4 w-4" /> Add a day
                </button>
              </div>
            </fieldset>

            <div className="flex flex-wrap items-center gap-3 border-t border-surface-border pt-4">
              <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-brand-orange px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save as draft
              </button>
              <span className="text-xs text-ink-muted">Photos and the cancellation policy are copied from your current {TIERS.find((t) => t.theme === pkg.theme)?.label} package, if there is one.</span>
            </div>
          </div>

          <aside className="space-y-4">
            {pkg.warnings.length > 0 && (
              <div className="rounded-2xl border border-warning/40 bg-warning/5 p-4">
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-brand-navy">
                  <AlertTriangle className="h-4 w-4 text-warning" /> Please check
                </h3>
                <ul className="mt-2 space-y-1.5 text-sm text-ink">
                  {pkg.warnings.map((w) => <li key={w}>{w}</li>)}
                </ul>
              </div>
            )}
            <div className="rounded-2xl border border-surface-border bg-white p-4">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-brand-navy">
                <Sparkles className="h-4 w-4 text-brand-blue" /> How it was worked out
              </h3>
              <p className="mt-1 text-xs text-ink-muted">{aiUsed ? "Built-in reader plus AI." : "Built-in reader (AI not used)."}</p>
              <ul className="mt-2 space-y-1.5 text-sm text-ink">
                {pkg.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
