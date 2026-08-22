"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, AlertTriangle, ExternalLink, ShieldCheck, Sparkles, CheckCircle2, ImageIcon, ListChecks } from "lucide-react";
import { scanSource, scanListing, batchImport, createDraftFromImport, buildPackage, type AiPackage } from "@/app/admin/(panel)/import/actions";

type Destination = { id: string; name: string; country: string };
const CATEGORIES = ["", "FIRST_ESCAPE", "SIGNATURE", "HONEYMOON", "FAMILY", "LUXURY", "PREMIUM"];
const inp = "w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15";

export function PackageImporter({ destinations }: { destinations: Destination[] }) {
  const [mode, setMode] = useState<"single" | "batch" | "build">("single");
  return (
    <div className="space-y-5">
      <div className="inline-flex flex-wrap rounded-xl border border-surface-border bg-white p-1">
        <button onClick={() => setMode("single")} className={tab(mode === "single")}>Single package</button>
        <button onClick={() => setMode("batch")} className={tab(mode === "batch")}>Import whole site</button>
        <button onClick={() => setMode("build")} className={tab(mode === "build")}>Build with AI</button>
      </div>
      {mode === "single" ? <SingleImport destinations={destinations} />
        : mode === "batch" ? <BatchImport destinations={destinations} />
        : <BuildWithAI destinations={destinations} />}
    </div>
  );
}

function tab(active: boolean) {
  return `rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${active ? "bg-brand-blue text-white" : "text-ink-muted hover:text-brand-navy"}`;
}

function matchDestination(name: string | null, destinations: Destination[]): string {
  if (!name) return "";
  const n = name.toLowerCase();
  const hit = destinations.find((d) => n.includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(n));
  return hit?.id ?? "";
}

// ── SINGLE ─────────────────────────────────────────────────
function SingleImport({ destinations }: { destinations: Destination[] }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [scanning, startScan] = useTransition();
  const [saving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [source, setSource] = useState<{ host: string; sourceUrl: string } | null>(null);
  const [ai, setAi] = useState<AiPackage | null>(null);
  const [verbatim, setVerbatim] = useState(false);

  // editable fields
  const [f, setF] = useState({
    name: "", destinationId: "", nights: "", basePrice: "", category: "", bestFor: "",
    summary: "", overview: "", roomCategory: "", mealPlan: "", flightSector: "", baggage: "", travelWindows: "",
    highlights: "", inclusions: "", exclusions: "", cancellationPolicy: "", importantInfo: "",
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [itinerary, setItinerary] = useState<{ day: number; title: string; description: string; items?: { timeslot: string; kind: string; title: string; description: string }[] }[]>([]);
  const [images, setImages] = useState<{ url: string; use: boolean }[]>([]);

  function onScan() {
    setError(null); setNotice(null);
    startScan(async () => {
      const res = await scanSource(url, verbatim);
      if (!res.ok) { setError(res.error); return; }
      setSource({ host: res.host, sourceUrl: res.sourceUrl });
      setAi(res.ai);
      setImages(res.imageUrls.map((u) => ({ url: u, use: true })));
      const a = res.ai;
      setF({
        name: a?.name ?? res.facts.name ?? "",
        destinationId: matchDestination(a?.destinationName ?? res.facts.name, destinations),
        nights: String(a?.durationNights ?? res.facts.durationNights ?? ""),
        basePrice: String(a?.startingPrice ?? res.facts.priceCandidates[0] ?? ""),
        category: a?.category ?? "", bestFor: a?.bestFor ?? "",
        // In verbatim mode the AI returns the source's own wording; otherwise it's
        // AI-rewritten original copy. Fall back to the raw page summary either way.
        summary: a?.summary ?? res.facts.summary ?? "",
        overview: a?.overview ?? (verbatim ? (res.facts.summary ?? "") : ""),
        roomCategory: a?.roomCategory ?? "", mealPlan: a?.mealPlan ?? "",
        flightSector: a?.flightSector ?? "", baggage: a?.baggage ?? "", travelWindows: a?.travelWindow ?? "",
        highlights: (a?.highlights ?? res.facts.headings.slice(0, 6)).join("\n"),
        inclusions: (a?.inclusions ?? []).join("\n"), exclusions: (a?.exclusions ?? []).join("\n"),
        cancellationPolicy: a?.cancellationPolicy ?? "", importantInfo: a?.importantTerms ?? "",
      });
      setItinerary(a?.itinerary ?? []);
      setNotice(res.aiConfigured
        ? (verbatim
            ? "Copied the source's details verbatim — review every field before saving."
            : "AI extracted & rewrote the details — review every field before saving.")
        : "AI is not configured (add AI_API_KEY). Filled basic facts only; complete the rest manually.");
    });
  }

  function onSave() {
    setError(null);
    startSave(async () => {
      const res = await createDraftFromImport({
        name: f.name, destinationId: f.destinationId, nights: f.nights, basePrice: f.basePrice,
        category: f.category || null, bestFor: f.bestFor || null, summary: f.summary || null, overview: f.overview || null,
        roomCategory: f.roomCategory || null, mealPlan: f.mealPlan || null, flightSector: f.flightSector || null,
        baggage: f.baggage || null, travelWindows: f.travelWindows || null,
        cancellationPolicy: f.cancellationPolicy || null, importantInfo: f.importantInfo || null,
        highlights: lines(f.highlights), inclusions: lines(f.inclusions), exclusions: lines(f.exclusions),
        itinerary: itinerary.map((d, i) => ({ day: d.day || i + 1, title: d.title, description: d.description, items: d.items ?? [] })),
        imageUrls: images.filter((im) => im.use).map((im) => im.url),
        sourceUrl: source?.sourceUrl ?? null, sourceName: source?.host ?? null,
      });
      if (!res.ok) { setError(res.error); return; }
      router.push(`/admin/packages/${res.packageId}/edit`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <ScanBar url={url} setUrl={setUrl} onScan={onScan} scanning={scanning} placeholder="https://supplier.com/andaman-5-nights-6-days" />
      <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-surface-border bg-white p-3">
        <input type="checkbox" checked={verbatim} onChange={(e) => setVerbatim(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-brand-blue" />
        <span className="text-sm">
          <span className="font-semibold text-brand-navy">Keep source copy verbatim</span>
          <span className="mt-0.5 block text-xs text-warning">Uses the source&apos;s own wording &amp; images instead of AI-rewritten copy. Only enable if you have the rights to reproduce that content — you are responsible for licensing. Set this before scanning.</span>
        </span>
      </label>
      <Alerts error={error} notice={notice} />

      {source && (
        <>
          <SourceBar host={source.host} sourceUrl={source.sourceUrl} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Field label="Package name *"><input value={f.name} onChange={(e) => set("name", e.target.value)} className={inp} /></Field>
            <Field label="Destination *">
              <select value={f.destinationId} onChange={(e) => set("destinationId", e.target.value)} className={inp}>
                <option value="">Select…</option>
                {destinations.map((d) => <option key={d.id} value={d.id}>{d.name} · {d.country}</option>)}
              </select>
            </Field>
            <Field label="Nights *"><input type="number" value={f.nights} onChange={(e) => set("nights", e.target.value)} className={inp} /></Field>
            <Field label="Base price / person (₹)"><input type="number" value={f.basePrice} onChange={(e) => set("basePrice", e.target.value)} className={inp} placeholder="0 = price on request" /></Field>
            <Field label="Category">
              <select value={f.category} onChange={(e) => set("category", e.target.value)} className={inp}>{CATEGORIES.map((c) => <option key={c} value={c}>{c || "—"}</option>)}</select>
            </Field>
            <Field label="Best for"><input value={f.bestFor} onChange={(e) => set("bestFor", e.target.value)} className={inp} placeholder="Couples, Families" /></Field>
            <Field label="Room category"><input value={f.roomCategory} onChange={(e) => set("roomCategory", e.target.value)} className={inp} /></Field>
            <Field label="Meal plan"><input value={f.mealPlan} onChange={(e) => set("mealPlan", e.target.value)} className={inp} /></Field>
            <Field label="Flight sector"><input value={f.flightSector} onChange={(e) => set("flightSector", e.target.value)} className={inp} /></Field>
            <Field label="Baggage"><input value={f.baggage} onChange={(e) => set("baggage", e.target.value)} className={inp} /></Field>
          </div>

          <div className="flex items-center gap-2 text-sm font-semibold text-brand-navy"><Sparkles className="h-4 w-4 text-brand-orange" /> Original ExpertzTrip copy</div>
          <Field label="Summary"><textarea value={f.summary} onChange={(e) => set("summary", e.target.value)} rows={2} className={inp} /></Field>
          <Field label="Overview"><textarea value={f.overview} onChange={(e) => set("overview", e.target.value)} rows={4} className={inp} /></Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Highlights (1 / line)"><textarea value={f.highlights} onChange={(e) => set("highlights", e.target.value)} rows={4} className={inp} /></Field>
            <Field label="Inclusions (1 / line)"><textarea value={f.inclusions} onChange={(e) => set("inclusions", e.target.value)} rows={4} className={inp} /></Field>
            <Field label="Exclusions (1 / line)"><textarea value={f.exclusions} onChange={(e) => set("exclusions", e.target.value)} rows={4} className={inp} /></Field>
          </div>

          {itinerary.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-navy"><ListChecks className="h-4 w-4 text-brand-blue" /> Day-by-day itinerary ({itinerary.length} days)</p>
              <div className="space-y-2">
                {itinerary.map((d, i) => (
                  <div key={i} className="rounded-lg border border-surface-border p-3">
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 rounded bg-brand-blueLight px-2 py-0.5 text-xs font-bold text-brand-blue">Day {d.day || i + 1}</span>
                      <input value={d.title} onChange={(e) => setItinerary((prev) => prev.map((x, xi) => xi === i ? { ...x, title: e.target.value } : x))} className={inp} />
                    </div>
                    <textarea value={d.description} onChange={(e) => setItinerary((prev) => prev.map((x, xi) => xi === i ? { ...x, description: e.target.value } : x))} rows={2} className={`${inp} mt-2`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Cancellation policy"><textarea value={f.cancellationPolicy} onChange={(e) => set("cancellationPolicy", e.target.value)} rows={2} className={inp} /></Field>
            <Field label="Important terms"><textarea value={f.importantInfo} onChange={(e) => set("importantInfo", e.target.value)} rows={2} className={inp} /></Field>
          </div>

          {images.length > 0 && (
            <div>
              <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-brand-navy"><ImageIcon className="h-4 w-4 text-brand-blue" /> Source images ({images.length})</p>
              <p className="mb-2 flex items-center gap-1.5 rounded-lg bg-[#FDF7EC] px-3 py-1.5 text-xs text-warning"><AlertTriangle className="h-3.5 w-3.5" /> Only import images you have the right to use. You are responsible for licensing supplier imagery.</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {images.map((im, i) => (
                  <label key={i} className={`relative block cursor-pointer overflow-hidden rounded-lg border-2 ${im.use ? "border-brand-blue" : "border-surface-border opacity-50"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={im.url} alt="" className="aspect-square w-full object-cover" />
                    <input type="checkbox" checked={im.use} onChange={() => setImages((prev) => prev.map((x, xi) => xi === i ? { ...x, use: !x.use } : x))} className="absolute right-1 top-1 h-4 w-4 accent-brand-blue" />
                  </label>
                ))}
              </div>
            </div>
          )}

          <SaveBar saving={saving} onSave={onSave} />
        </>
      )}
    </div>
  );
}

// ── BATCH ──────────────────────────────────────────────────
function BatchImport({ destinations }: { destinations: Destination[] }) {
  const [url, setUrl] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [scanning, startScan] = useTransition();
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verbatim, setVerbatim] = useState(false);
  const [links, setLinks] = useState<{ url: string; use: boolean }[]>([]);
  const [result, setResult] = useState<{ created: { name: string; slug: string }[]; failed: { url: string; error: string }[] } | null>(null);

  function onScanListing() {
    setError(null); setResult(null); setProgress(null);
    startScan(async () => {
      const res = await scanListing(url);
      if (!res.ok) { setError(res.error); return; }
      setLinks(res.links.map((u) => ({ url: u, use: true })));
    });
  }

  // Import the whole listing in small sequential chunks so no single serverless
  // request runs too long, with live progress + results.
  async function onImport() {
    setError(null);
    const chosen = links.filter((l) => l.use).map((l) => l.url);
    if (!chosen.length) { setError("Select at least one package link."); return; }
    if (!destinationId) { setError("Choose a destination for the drafts."); return; }

    setImporting(true);
    setProgress({ done: 0, total: chosen.length });
    const created: { name: string; slug: string }[] = [];
    const failed: { url: string; error: string }[] = [];
    const CHUNK = 3;
    try {
      for (let i = 0; i < chosen.length; i += CHUNK) {
        const slice = chosen.slice(i, i + CHUNK);
        const res = await batchImport(slice, destinationId, verbatim);
        if (res.ok) {
          created.push(...res.created.map((c) => ({ name: c.name, slug: c.slug })));
          failed.push(...res.failed);
        } else {
          failed.push(...slice.map((u) => ({ url: u, error: res.error })));
        }
        setProgress({ done: Math.min(i + CHUNK, chosen.length), total: chosen.length });
        setResult({ created: [...created], failed: [...failed] });
      }
    } catch {
      setError("Import was interrupted — some drafts may still have been created. Check Packages.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-warning/30 bg-[#FDF7EC] px-4 py-3 text-sm text-warning">
        Paste a supplier <strong>listing / category</strong> page. We find the <strong>holiday-package</strong> links only — flights, hotel-only, visa &amp; other non-package pages are skipped — then extract each into a <strong>draft</strong> (never published). The whole listing imports in small batches, so it won&apos;t time out. Review every draft before publishing.
      </div>
      <ScanBar url={url} setUrl={setUrl} onScan={onScanListing} scanning={scanning} placeholder="https://supplier.com/andaman-packages" label="Find packages" />
      <Alerts error={error} notice={null} />

      {links.length > 0 && (!result || importing) && (
        <div className="rounded-2xl border border-surface-border bg-white p-4">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-brand-navy">{links.length} package links found</p>
              <p className="text-xs text-ink-muted">Uncheck any you don&apos;t want.</p>
              <label className="mt-2 flex cursor-pointer items-start gap-2">
                <input type="checkbox" checked={verbatim} onChange={(e) => setVerbatim(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-brand-blue" />
                <span className="text-xs">
                  <span className="font-semibold text-brand-navy">Copy source copy exactly (verbatim)</span>
                  <span className="mt-0.5 block text-ink-muted">Keeps each page&apos;s own wording instead of AI-rewriting it. Only enable if you have the rights to reproduce that content.</span>
                </span>
              </label>
            </div>
            <div className="flex items-end gap-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-muted">Destination for drafts *</label>
                <select value={destinationId} onChange={(e) => setDestinationId(e.target.value)} className={inp}>
                  <option value="">Select…</option>
                  {destinations.map((d) => <option key={d.id} value={d.id}>{d.name} · {d.country}</option>)}
                </select>
              </div>
              <button onClick={onImport} disabled={importing} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 font-semibold text-white hover:bg-brand-blueDark disabled:opacity-60">
                {importing ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing {progress ? `${progress.done}/${progress.total}` : ""}…</> : "Import selected as drafts"}
              </button>
            </div>
          </div>
          {importing && progress && (
            <div className="mb-3">
              <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                <div className="h-full rounded-full bg-brand-blue transition-all" style={{ width: `${Math.round((progress.done / Math.max(1, progress.total)) * 100)}%` }} />
              </div>
              <p className="mt-1 text-xs text-ink-muted">Importing in batches — you can leave this open. {progress.done} of {progress.total} processed.</p>
            </div>
          )}
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {links.map((l, i) => (
              <label key={i} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-surface-muted/50">
                <input type="checkbox" checked={l.use} onChange={() => setLinks((prev) => prev.map((x, xi) => xi === i ? { ...x, use: !x.use } : x))} className="h-4 w-4 accent-brand-blue" />
                <span className="truncate text-ink-muted">{l.url}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {result && !importing && (
        <div className="rounded-2xl border border-surface-border bg-white p-4">
          <p className="flex items-center gap-2 font-semibold text-success"><CheckCircle2 className="h-5 w-5" /> {result.created.length} draft{result.created.length === 1 ? "" : "s"} created</p>
          <div className="mt-3 space-y-1">
            {result.created.map((c, i) => (
              <a key={i} href={`/admin/packages`} className="block text-sm text-brand-blue hover:underline">{c.name}</a>
            ))}
          </div>
          {result.failed.length > 0 && (
            <details className="mt-3 text-xs text-ink-muted">
              <summary className="cursor-pointer font-semibold">{result.failed.length} skipped</summary>
              <ul className="mt-1 space-y-0.5">{result.failed.map((x, i) => <li key={i} className="truncate">{x.url} — {x.error}</li>)}</ul>
            </details>
          )}
          <a href="/admin/packages" className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-brand-blue px-5 text-sm font-semibold text-white hover:bg-brand-blueDark">Open Packages to review &amp; publish</a>
        </div>
      )}
    </div>
  );
}

// ── BUILD WITH AI ──────────────────────────────────────────
function BuildWithAI({ destinations }: { destinations: Destination[] }) {
  const router = useRouter();
  const [building, startBuild] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({ destinationId: "", nights: "5", category: "", departureCity: "", style: "", basePrice: "" });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  function onBuild() {
    setError(null);
    if (!f.destinationId) { setError("Choose a destination."); return; }
    const dest = destinations.find((d) => d.id === f.destinationId);
    startBuild(async () => {
      const res = await buildPackage({
        destinationId: f.destinationId, destinationName: dest?.name ?? "", country: dest?.country ?? "",
        nights: f.nights, category: f.category || null, departureCity: f.departureCity, style: f.style, basePrice: f.basePrice || 0,
      });
      if (!res.ok) { setError(res.error); return; }
      router.push(`/admin/packages/${res.packageId}/edit`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-brand-blue/25 bg-brand-blueLight/40 px-4 py-3 text-sm text-brand-navy">
        Describe the trip and AI drafts a full package — summary, highlights, inclusions and a day-by-day itinerary. It saves as a <strong>DRAFT</strong> with <strong>price on request</strong> (no invented price). Review &amp; verify every detail before publishing.
      </div>
      <div className="space-y-4 rounded-2xl border border-surface-border bg-white p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Destination *">
            <select value={f.destinationId} onChange={(e) => set("destinationId", e.target.value)} className={inp}>
              <option value="">Select…</option>
              {destinations.map((d) => <option key={d.id} value={d.id}>{d.name} · {d.country}</option>)}
            </select>
          </Field>
          <Field label="Nights *"><input type="number" min={1} max={30} value={f.nights} onChange={(e) => set("nights", e.target.value)} className={inp} /></Field>
          <Field label="Category"><select value={f.category} onChange={(e) => set("category", e.target.value)} className={inp}>{CATEGORIES.map((c) => <option key={c} value={c}>{c || "—"}</option>)}</select></Field>
          <Field label="Departure city"><input value={f.departureCity} onChange={(e) => set("departureCity", e.target.value)} placeholder="e.g. New Delhi" className={inp} /></Field>
          <Field label="Starting price (₹/person, optional)"><input type="number" min={0} value={f.basePrice} onChange={(e) => set("basePrice", e.target.value)} placeholder="blank → price on request" className={inp} /></Field>
        </div>
        <Field label="Style & must-haves">
          <textarea value={f.style} onChange={(e) => set("style", e.target.value)} rows={3} placeholder="e.g. honeymoon, beachfront resort, private candlelight dinner, island-hopping, relaxed pace" className={inp} />
        </Field>
        <Alerts error={error} notice={null} />
        <button onClick={onBuild} disabled={building} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-orange px-6 font-semibold text-white hover:bg-brand-orangeDark disabled:opacity-60">
          {building ? <><Loader2 className="h-4 w-4 animate-spin" /> Building your draft…</> : <><Sparkles className="h-4 w-4" /> Generate draft package</>}
        </button>
        <p className="text-xs text-ink-muted">AI-generated content is a starting point — verify hotels, inclusions and facts, then set a confirmed price before publishing.</p>
      </div>
    </div>
  );
}

// ── shared bits ────────────────────────────────────────────
function ScanBar({ url, setUrl, onScan, scanning, placeholder, label = "Scan Package" }: { url: string; setUrl: (v: string) => void; onScan: () => void; scanning: boolean; placeholder: string; label?: string }) {
  return (
    <div className="rounded-2xl border border-surface-border bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={placeholder} className={`h-11 flex-1 rounded-xl border border-surface-border px-3.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10`} onKeyDown={(e) => { if (e.key === "Enter") onScan(); }} />
        <button onClick={onScan} disabled={scanning || !url} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 font-semibold text-white hover:bg-brand-blueDark disabled:opacity-60">
          {scanning ? <><Loader2 className="h-4 w-4 animate-spin" /> Scanning…</> : <><Search className="h-4 w-4" /> {label}</>}
        </button>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted"><ShieldCheck className="h-3.5 w-3.5 text-brand-blue" /> HTTPS only · private networks blocked · facts extracted &amp; rewritten — never copies branding.</p>
    </div>
  );
}
function Alerts({ error, notice }: { error: string | null; notice: string | null }) {
  return (
    <>
      {error && <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-[#FCE9E9] px-4 py-3 text-sm font-medium text-danger"><AlertTriangle className="h-4 w-4 shrink-0" /> {error}</div>}
      {notice && <div className="rounded-xl border border-warning/30 bg-[#FDF7EC] px-4 py-3 text-sm text-warning">{notice}</div>}
    </>
  );
}
function SourceBar({ host, sourceUrl }: { host: string; sourceUrl: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-surface-muted/60 px-4 py-2.5 text-xs text-ink-muted">
      <span>SOURCE: <a href={sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-blue hover:underline">{host} <ExternalLink className="h-3 w-3" /></a></span>
      <span>SCANNED: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
      <span className="font-semibold text-ink">Internal only — never shown to customers.</span>
    </div>
  );
}
function SaveBar({ saving, onSave }: { saving: boolean; onSave: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2 text-sm text-warning"><AlertTriangle className="h-4 w-4 shrink-0" /> Review details before publishing. This saves a <strong>draft only</strong>.</p>
      <button onClick={onSave} disabled={saving} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 font-semibold text-white hover:bg-brand-blueDark disabled:opacity-60">
        {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save Draft → open editor"}
      </button>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-xs font-semibold text-ink-muted">{label}</label>{children}</div>;
}
function lines(s: string): string[] {
  return s.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 40);
}
