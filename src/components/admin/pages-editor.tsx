"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, ExternalLink, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { resetPageAction, saveFaqsAction, savePageAction } from "@/app/admin/(panel)/pages/actions";
import type { PageContent, PageKey } from "@/lib/page-content";
import { cn } from "@/lib/utils";

const inp = "w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15";

type Block = { title: string; body: string };
type Faq = { question: string; answer: string };
type Tab = PageKey | "faqs";

const TABS: { key: Tab; label: string; href: string }[] = [
  { key: "home", label: "Homepage", href: "/" },
  { key: "about", label: "About us", href: "/about" },
  { key: "terms", label: "Terms & Conditions", href: "/terms" },
  { key: "privacy", label: "Privacy Policy", href: "/privacy-policy" },
  { key: "faqs", label: "FAQs", href: "/faq" },
];

/** Field layouts for the two free-form pages. `list` fields are editable cards. */
type Group = { title: string; hint?: string; fields?: [string, string, ("area" | "big")?][]; list?: string; itemLabel?: string };

const HOME_GROUPS: Group[] = [
  { title: "Plan my trip section", fields: [["planEyebrow", "Small label"], ["planTitle", "Heading"], ["planText", "Text", "area"]] },
  { title: "Highlights strip", hint: "The four points under the Plan my trip section.", list: "features", itemLabel: "Highlight" },
  { title: "Packages section", fields: [["packagesEyebrow", "Small label"], ["packagesTitle", "Heading"], ["packagesText", "Text", "area"]] },
  { title: "Islands section", fields: [["islandsEyebrow", "Small label"], ["islandsTitle", "Heading"], ["islandsText", "Text", "area"]] },
  { title: "Services section", fields: [["servicesEyebrow", "Small label"], ["servicesTitle", "Heading"], ["servicesText", "Text", "area"]] },
  { title: "Services list", list: "services", itemLabel: "Service" },
  { title: "Gallery, reviews and FAQ headings", fields: [["galleryEyebrow", "Gallery label"], ["galleryTitle", "Gallery heading"], ["testimonialsEyebrow", "Reviews label"], ["testimonialsTitle", "Reviews heading"], ["faqEyebrow", "FAQ label"], ["faqTitle", "FAQ heading"]] },
  { title: "Closing banner", fields: [["ctaTitle", "Heading"], ["ctaText", "Text", "area"]] },
];

const ABOUT_GROUPS: Group[] = [
  { title: "Main story", hint: "Leave a blank line between paragraphs.", fields: [["heading", "Heading"], ["body", "Text", "big"]] },
  { title: "How we work", fields: [["principlesEyebrow", "Small label"], ["principlesTitle", "Heading"], ["principlesText", "Text", "area"]] },
  { title: "How we work — points", list: "principles", itemLabel: "Point" },
  { title: "Closing banner", fields: [["ctaTitle", "Heading"], ["ctaText", "Text", "area"]] },
];

const TOKENS_HINT = "You can write {brand}, {phone}, {email}, {contact} or {address} — they are filled in from Website Content.";

function move<T>(list: T[], i: number, by: number): T[] {
  const j = i + by;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

function RowTools({ onUp, onDown, onRemove, label }: { onUp: () => void; onDown: () => void; onRemove: () => void; label: string }) {
  const btn = "rounded p-1.5 text-ink-faint hover:bg-surface-muted hover:text-brand-navy";
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <button type="button" onClick={onUp} className={btn} aria-label={`Move ${label} up`}><ArrowUp className="h-4 w-4" /></button>
      <button type="button" onClick={onDown} className={btn} aria-label={`Move ${label} down`}><ArrowDown className="h-4 w-4" /></button>
      <button type="button" onClick={onRemove} className={cn(btn, "hover:text-danger")} aria-label={`Remove ${label}`}><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}

function SaveBar({ busy, status, onSave, onReset, extra }: { busy: boolean; status: { ok: boolean; text: string } | null; onSave: () => void; onReset?: () => void; extra?: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-3 border-t border-surface-border bg-white/95 px-1 py-3 backdrop-blur">
      <button type="button" onClick={onSave} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-blueDark disabled:opacity-50">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
      </button>
      {extra}
      {status && (
        <span role="status" className={cn("inline-flex items-center gap-1.5 text-sm font-semibold", status.ok ? "text-success" : "text-danger")}>
          {status.ok && <CheckCircle2 className="h-4 w-4" />} {status.text}
        </span>
      )}
      {onReset && (
        <button type="button" onClick={onReset} disabled={busy} className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-danger">
          <RotateCcw className="h-4 w-4" /> Restore original text
        </button>
      )}
    </div>
  );
}

function useSaver() {
  const [busy, start] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (fn: () => Promise<{ ok: true; message: string } | { ok: false; error: string }>, after?: (r: { ok: true; message: string }) => void) =>
    start(async () => {
      setStatus(null);
      const res = await fn();
      if (res.ok) {
        setStatus({ ok: true, text: res.message });
        after?.(res);
      } else setStatus({ ok: false, text: res.error });
    });
  return { busy, status, run };
}

/** Homepage and About: labelled fields plus editable card lists. */
function SectionsForm({ pageKey, groups, initial, defaults }: { pageKey: "home" | "about"; groups: Group[]; initial: Record<string, unknown>; defaults: Record<string, unknown> }) {
  const [data, setData] = useState<Record<string, unknown>>(initial);
  const { busy, status, run } = useSaver();
  const set = (k: string, v: unknown) => setData((d) => ({ ...d, [k]: v }));

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-muted">{TOKENS_HINT}</p>
      {groups.map((g) => (
        <fieldset key={g.title} className="rounded-2xl border border-surface-border bg-white p-5">
          <legend className="px-1 text-sm font-extrabold text-brand-navy">{g.title}</legend>
          {g.hint && <p className="mb-3 text-xs text-ink-muted">{g.hint}</p>}
          {g.fields && (
            <div className="grid gap-4 sm:grid-cols-2">
              {g.fields.map(([key, label, kind]) => (
                <label key={key} className={cn("block text-sm font-semibold", kind && "sm:col-span-2")}>
                  {label}
                  {kind ? (
                    <textarea rows={kind === "big" ? 10 : 3} className={cn(inp, "mt-1")} value={String(data[key] ?? "")} onChange={(e) => set(key, e.target.value)} />
                  ) : (
                    <input className={cn(inp, "mt-1")} value={String(data[key] ?? "")} onChange={(e) => set(key, e.target.value)} />
                  )}
                </label>
              ))}
            </div>
          )}
          {g.list && (() => {
            const list = (data[g.list] as Block[]) ?? [];
            const update = (next: Block[]) => set(g.list!, next);
            return (
              <div className="space-y-3">
                {list.map((b, i) => (
                  <div key={i} className="rounded-xl border border-surface-border p-3">
                    <div className="flex items-center gap-2">
                      <input className={inp} value={b.title} aria-label={`${g.itemLabel} ${i + 1} title`} placeholder="Title"
                        onChange={(e) => update(list.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                      <RowTools label={`${g.itemLabel} ${i + 1}`} onUp={() => update(move(list, i, -1))} onDown={() => update(move(list, i, 1))} onRemove={() => update(list.filter((_, j) => j !== i))} />
                    </div>
                    <textarea rows={2} className={cn(inp, "mt-2")} value={b.body} aria-label={`${g.itemLabel} ${i + 1} text`} placeholder="Text"
                      onChange={(e) => update(list.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} />
                  </div>
                ))}
                <button type="button" onClick={() => update([...list, { title: "", body: "" }])} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue">
                  <Plus className="h-4 w-4" /> Add {g.itemLabel?.toLowerCase()}
                </button>
              </div>
            );
          })()}
        </fieldset>
      ))}
      <SaveBar
        busy={busy}
        status={status}
        onSave={() => run(() => savePageAction(pageKey, data))}
        onReset={() => { if (confirm("Replace this page's text with the original? Your edits will be lost.")) run(() => resetPageAction(pageKey), () => setData(defaults)); }}
      />
    </div>
  );
}

type Legal = PageContent<"terms">;

/** Terms / Privacy: title, intro, any number of sections, closing line. */
function LegalForm({ pageKey, initial, defaults }: { pageKey: "terms" | "privacy"; initial: Legal; defaults: Legal }) {
  const [data, setData] = useState<Legal>(initial);
  const [bump, setBump] = useState(true);
  const { busy, status, run } = useSaver();
  const sections = data.sections;
  const setSections = (next: Legal["sections"]) => setData((d) => ({ ...d, sections: next }));

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-muted">
        Write each section as plain text. Leave a blank line between paragraphs, and start a line with “- ” to make a bullet point. {TOKENS_HINT}
      </p>
      <div className="grid gap-4 rounded-2xl border border-surface-border bg-white p-5 sm:grid-cols-2">
        <label className="block text-sm font-semibold">
          Page title
          <input className={cn(inp, "mt-1")} value={data.title} onChange={(e) => setData({ ...data, title: e.target.value })} />
        </label>
        <p className="self-end text-sm text-ink-muted">Last updated: <b className="text-ink">{data.updatedAt}</b></p>
        <label className="block text-sm font-semibold sm:col-span-2">
          Introduction
          <textarea rows={2} className={cn(inp, "mt-1")} value={data.intro} onChange={(e) => setData({ ...data, intro: e.target.value })} />
        </label>
      </div>

      {sections.map((s, i) => (
        <div key={i} className="rounded-2xl border border-surface-border bg-white p-5">
          <div className="flex items-center gap-2">
            <input className={cn(inp, "font-bold")} value={s.heading} aria-label={`Section ${i + 1} heading`}
              onChange={(e) => setSections(sections.map((x, j) => (j === i ? { ...x, heading: e.target.value } : x)))} />
            <RowTools label={`section ${i + 1}`} onUp={() => setSections(move(sections, i, -1))} onDown={() => setSections(move(sections, i, 1))}
              onRemove={() => { if (confirm(`Remove “${s.heading || "this section"}”?`)) setSections(sections.filter((_, j) => j !== i)); }} />
          </div>
          <textarea rows={Math.min(16, Math.max(4, s.body.split("\n").length + 2))} className={cn(inp, "mt-2 leading-relaxed")} value={s.body} aria-label={`Section ${i + 1} text`}
            onChange={(e) => setSections(sections.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} />
        </div>
      ))}
      <button type="button" onClick={() => setSections([...sections, { heading: `${sections.length + 1}. New section`, body: "" }])} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue">
        <Plus className="h-4 w-4" /> Add a section
      </button>

      <label className="block rounded-2xl border border-surface-border bg-white p-5 text-sm font-semibold">
        Closing line (shown in a box at the end)
        <textarea rows={2} className={cn(inp, "mt-1")} value={data.contactLine} onChange={(e) => setData({ ...data, contactLine: e.target.value })} />
      </label>

      <SaveBar
        busy={busy}
        status={status}
        onSave={() => run(() => savePageAction(pageKey, data, bump), (r) => { const u = (r as { updatedAt?: string }).updatedAt; if (u) setData((d) => ({ ...d, updatedAt: u })); })}
        onReset={() => { if (confirm("Replace this page with the original text? Your edits will be lost.")) run(() => resetPageAction(pageKey), () => setData(defaults)); }}
        extra={
          <label className="inline-flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={bump} onChange={(e) => setBump(e.target.checked)} className="h-4 w-4 rounded border-surface-border" />
            Set “Last updated” to today
          </label>
        }
      />
    </div>
  );
}

function FaqForm({ initial }: { initial: Faq[] }) {
  const [list, setList] = useState<Faq[]>(initial);
  const { busy, status, run } = useSaver();
  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-muted">These appear on the FAQ page, and the first six on the homepage. Change the order with the arrows.</p>
      {list.map((f, i) => (
        <div key={i} className="rounded-2xl border border-surface-border bg-white p-4">
          <div className="flex items-center gap-2">
            <input className={cn(inp, "font-bold")} value={f.question} placeholder="Question" aria-label={`Question ${i + 1}`}
              onChange={(e) => setList(list.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))} />
            <RowTools label={`question ${i + 1}`} onUp={() => setList(move(list, i, -1))} onDown={() => setList(move(list, i, 1))} onRemove={() => setList(list.filter((_, j) => j !== i))} />
          </div>
          <textarea rows={3} className={cn(inp, "mt-2")} value={f.answer} placeholder="Answer" aria-label={`Answer ${i + 1}`}
            onChange={(e) => setList(list.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))} />
        </div>
      ))}
      <button type="button" onClick={() => setList([...list, { question: "", answer: "" }])} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue">
        <Plus className="h-4 w-4" /> Add a question
      </button>
      <SaveBar busy={busy} status={status} onSave={() => run(() => saveFaqsAction(list))} />
    </div>
  );
}

export function PagesEditor({
  pages,
  defaults,
  faqs,
}: {
  pages: { home: PageContent<"home">; about: PageContent<"about">; terms: Legal; privacy: Legal };
  defaults: { home: PageContent<"home">; about: PageContent<"about">; terms: Legal; privacy: Legal };
  faqs: Faq[];
}) {
  const [tab, setTab] = useState<Tab>("home");
  const current = TABS.find((t) => t.key === tab)!;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex flex-wrap rounded-xl border border-surface-border bg-white p-1" role="tablist">
          {TABS.map((t) => (
            <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
              className={cn("rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors", tab === t.key ? "bg-brand-blue text-white" : "text-ink-muted hover:text-brand-navy")}>
              {t.label}
            </button>
          ))}
        </div>
        <a href={current.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:underline">
          View page <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Each tab keeps its own unsaved edits while you switch between them. */}
      <div hidden={tab !== "home"}><SectionsForm pageKey="home" groups={HOME_GROUPS} initial={pages.home} defaults={defaults.home} /></div>
      <div hidden={tab !== "about"}><SectionsForm pageKey="about" groups={ABOUT_GROUPS} initial={pages.about} defaults={defaults.about} /></div>
      <div hidden={tab !== "terms"}><LegalForm pageKey="terms" initial={pages.terms} defaults={defaults.terms} /></div>
      <div hidden={tab !== "privacy"}><LegalForm pageKey="privacy" initial={pages.privacy} defaults={defaults.privacy} /></div>
      <div hidden={tab !== "faqs"}><FaqForm initial={faqs} /></div>
    </div>
  );
}
