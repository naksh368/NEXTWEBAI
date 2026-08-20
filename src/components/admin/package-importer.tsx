"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Sparkles, AlertTriangle, Plus, ExternalLink, ShieldCheck } from "lucide-react";
import { scanSource, rewriteForExpertzTrip, createDraftFromImport } from "@/app/admin/(panel)/import/actions";
import type { ExtractedFacts } from "@/lib/services/importer";

type Destination = { id: string; name: string; country: string };

const CATEGORIES = ["", "FIRST_ESCAPE", "SIGNATURE", "HONEYMOON", "FAMILY", "LUXURY", "PREMIUM"];

export function PackageImporter({ destinations }: { destinations: Destination[] }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [scanning, startScan] = useTransition();
  const [rewriting, startRewrite] = useTransition();
  const [saving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [facts, setFacts] = useState<ExtractedFacts | null>(null);
  const [source, setSource] = useState<{ host: string; sourceUrl: string } | null>(null);

  // ExpertzTrip editable fields
  const [name, setName] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [nights, setNights] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [category, setCategory] = useState("");
  const [bestFor, setBestFor] = useState("");
  const [summary, setSummary] = useState("");
  const [overview, setOverview] = useState("");
  const [inclusions, setInclusions] = useState("");
  const [exclusions, setExclusions] = useState("");
  const [highlights, setHighlights] = useState("");

  function onScan() {
    setError(null); setNotice(null);
    startScan(async () => {
      const res = await scanSource(url);
      if (!res.ok) { setError(res.error); return; }
      setFacts(res.facts);
      setSource({ host: res.host, sourceUrl: res.sourceUrl });
      // Prefill ExpertzTrip fields from facts (admin edits before saving)
      setName(res.facts.name ?? "");
      if (res.facts.durationNights) setNights(String(res.facts.durationNights));
      if (res.facts.priceCandidates[0]) setBasePrice(String(res.facts.priceCandidates[0]));
      setSummary(res.facts.summary ?? "");
      setHighlights(res.facts.headings.slice(0, 6).join("\n"));
      if (res.facts.note) setNotice(res.facts.note);
    });
  }

  function onRewrite() {
    setError(null);
    const factsText = [
      name && `Name: ${name}`,
      nights && `Duration: ${nights} nights`,
      summary && `Source summary: ${summary}`,
      inclusions && `Inclusions: ${inclusions}`,
      highlights && `Highlights: ${highlights}`,
    ].filter(Boolean).join("\n");
    startRewrite(async () => {
      const res = await rewriteForExpertzTrip({ name: name || "Holiday package", facts: factsText });
      if (!res.ok) { setError(res.error); return; }
      setSummary(res.summary);
      setOverview(res.overview);
      setNotice("AI rewrite applied — review before saving.");
    });
  }

  function onSaveDraft() {
    setError(null);
    startSave(async () => {
      const res = await createDraftFromImport({
        name, destinationId, nights, basePrice,
        category: category || null, bestFor: bestFor || null,
        summary: summary || null, overview: overview || null,
        highlights: splitLines(highlights), inclusions: splitLines(inclusions), exclusions: splitLines(exclusions),
        sourceUrl: source?.sourceUrl ?? null, sourceName: source?.host ?? null,
      });
      if (!res.ok) { setError(res.error); return; }
      router.push(`/admin/packages/${res.packageId}/edit`);
      router.refresh();
    });
  }

  const addToInclusions = (item: string) =>
    setInclusions((prev) => (prev ? `${prev}\n${item}` : item));

  return (
    <div className="space-y-5">
      {/* URL scan bar */}
      <div className="rounded-2xl border border-surface-border bg-white p-4">
        <label className="mb-2 block text-sm font-semibold text-brand-navy">Supplier / public package URL</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://supplier.com/andaman-package"
            className="h-11 flex-1 rounded-xl border border-surface-border px-3.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10"
            onKeyDown={(e) => { if (e.key === "Enter") onScan(); }}
          />
          <button
            onClick={onScan}
            disabled={scanning || !url}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 font-semibold text-white transition-colors hover:bg-brand-blueDark disabled:opacity-60"
          >
            {scanning ? <><Loader2 className="h-4 w-4 animate-spin" /> Scanning…</> : <><Search className="h-4 w-4" /> Scan Package</>}
          </button>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-blue" /> HTTPS only · private networks blocked · facts only — never copies branding, images or marketing copy.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-[#FCE9E9] px-4 py-3 text-sm font-medium text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-warning/30 bg-[#FDF7EC] px-4 py-3 text-sm text-warning">{notice}</div>
      )}

      {facts && (
        <>
          {/* Source tracking */}
          {source && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-surface-muted/60 px-4 py-2.5 text-xs text-ink-muted">
              <span>SOURCE: <a href={source.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-blue hover:underline">{source.host} <ExternalLink className="h-3 w-3" /></a></span>
              <span>SCANNED: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              <span className="font-semibold text-ink">Internal only — never shown to customers.</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* LEFT — extracted source facts */}
            <div className="rounded-2xl border border-surface-border bg-surface-muted/30 p-5">
              <h3 className="text-sm font-bold uppercase tracking-wide text-ink-faint">Extracted source facts</h3>

              <Fact label="Name">{facts.name ?? em()}</Fact>
              <Fact label="Duration">{facts.durationNights ? `${facts.durationNights}N / ${facts.durationDays}D` : em()}</Fact>
              <Fact label="Price candidates">
                {facts.priceCandidates.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {facts.priceCandidates.map((p, i) => (
                      <button key={i} onClick={() => setBasePrice(String(p))} className="rounded-full border border-surface-border bg-white px-2.5 py-1 text-xs font-semibold text-brand-navy hover:border-brand-blue" title="Use as base price">
                        ₹{p.toLocaleString("en-IN")}
                      </button>
                    ))}
                  </div>
                ) : em()}
              </Fact>
              <Fact label="Summary">{facts.summary ?? em()}</Fact>

              {facts.listItems.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-ink-faint">Detected list items — click + to add to inclusions</p>
                  <div className="mt-2 max-h-56 space-y-1 overflow-y-auto pr-1">
                    {facts.listItems.map((it, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-lg bg-white px-2.5 py-1.5 text-xs text-ink">
                        <button onClick={() => addToInclusions(it)} className="mt-0.5 shrink-0 text-brand-blue hover:text-brand-blueDark" title="Add to inclusions"><Plus className="h-3.5 w-3.5" /></button>
                        <span>{it}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {facts.imageUrls.length > 0 && (
                <div className="mt-4 rounded-lg border border-warning/30 bg-[#FDF7EC] p-3 text-xs text-warning">
                  {facts.imageUrls.length} source image{facts.imageUrls.length > 1 ? "s" : ""} detected. Do <strong>not</strong> auto-publish supplier images — upload a licensed / ExpertzTrip-owned image in the package editor.
                </div>
              )}
            </div>

            {/* RIGHT — ExpertzTrip editable fields */}
            <div className="rounded-2xl border border-brand-blue/20 bg-white p-5">
              <h3 className="text-sm font-bold uppercase tracking-wide text-brand-blue">ExpertzTrip package (draft)</h3>

              <div className="mt-3 space-y-3">
                <Field label="Package name *">
                  <input value={name} onChange={(e) => setName(e.target.value)} className={inp} placeholder="e.g. Andaman Escape" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Destination *">
                    <select value={destinationId} onChange={(e) => setDestinationId(e.target.value)} className={inp}>
                      <option value="">Select…</option>
                      {destinations.map((d) => <option key={d.id} value={d.id}>{d.name} · {d.country}</option>)}
                    </select>
                  </Field>
                  <Field label="Nights *">
                    <input type="number" min={1} max={30} value={nights} onChange={(e) => setNights(e.target.value)} className={inp} placeholder="5" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Base price / person (₹)">
                    <input type="number" min={0} value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className={inp} placeholder="0 = price on request" />
                  </Field>
                  <Field label="Category">
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className={inp}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c || "—"}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Best for">
                  <input value={bestFor} onChange={(e) => setBestFor(e.target.value)} className={inp} placeholder="Couples, Families, Friends" />
                </Field>

                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-ink-muted">Summary &amp; overview</label>
                  <button onClick={onRewrite} disabled={rewriting} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-orangeLight px-2.5 py-1 text-xs font-semibold text-brand-orangeDark hover:bg-brand-orange/20 disabled:opacity-60">
                    {rewriting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Rewrite for ExpertzTrip
                  </button>
                </div>
                <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} className={inp} placeholder="Short original summary" />
                <textarea value={overview} onChange={(e) => setOverview(e.target.value)} rows={4} className={inp} placeholder="Original overview (do not copy supplier text)" />

                <Field label="Highlights (one per line)"><textarea value={highlights} onChange={(e) => setHighlights(e.target.value)} rows={3} className={inp} /></Field>
                <Field label="Inclusions (one per line)"><textarea value={inclusions} onChange={(e) => setInclusions(e.target.value)} rows={3} className={inp} /></Field>
                <Field label="Exclusions (one per line)"><textarea value={exclusions} onChange={(e) => setExclusions(e.target.value)} rows={2} className={inp} /></Field>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm text-warning">
              <AlertTriangle className="h-4 w-4 shrink-0" /> Review package details before publishing. This saves a <strong>draft only</strong> — publish from the package editor.
            </p>
            <button onClick={onSaveDraft} disabled={saving} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 font-semibold text-white transition-colors hover:bg-brand-blueDark disabled:opacity-60">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save Draft → open editor"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const inp = "w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-ink-muted">{label}</label>
      {children}
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 border-t border-surface-border pt-3 first:mt-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
      <div className="mt-1 text-sm text-ink">{children}</div>
    </div>
  );
}

function em() {
  return <span className="italic text-ink-faint">Not published on source.</span>;
}

function splitLines(s: string): string[] {
  return s.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 40);
}
