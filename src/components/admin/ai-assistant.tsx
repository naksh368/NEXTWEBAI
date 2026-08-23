"use client";

import { useState, useTransition } from "react";
import { Sparkles, Copy, Check, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { assistAction } from "@/app/admin/(panel)/ai/actions";

type Task = { key: string; label: string; hint: string; placeholder: string };

// Mirrors the server task specs (labels only — prompts live server-side).
const TASKS: Task[] = [
  { key: "summary", label: "Package summary", hint: "Turn key facts into a short, punchy marketing summary.", placeholder: "e.g. 6N/7D Bali honeymoon — private pool villa in Ubud, Nusa Penida day trip, candlelight dinner, flights from Delhi" },
  { key: "improve", label: "Improve text", hint: "Polish a draft without changing the facts.", placeholder: "Paste the description or paragraph you want improved…" },
  { key: "itinerary", label: "Day-by-day itinerary", hint: "Draft a day-wise plan from a destination and highlights.", placeholder: "e.g. Thailand 5 nights — Bangkok 2N (city, temples), Phuket 3N (beach, Phi Phi island tour), airport transfers" },
  { key: "inclusions", label: "Inclusions & exclusions", hint: "Suggest a clean inclusions / exclusions list.", placeholder: "e.g. 4N Dubai — 4★ hotel with breakfast, city tour, desert safari, Burj Khalifa, transfers, visa" },
  { key: "reply", label: "Customer reply", hint: "Draft a warm, professional reply to an enquiry.", placeholder: "Paste the customer's enquiry. Add any facts to include (dates, what's available)…" },
  { key: "faq", label: "FAQ answer", hint: "Write a concise, accurate answer to a common question.", placeholder: "e.g. Do you help with visa? What is the cancellation policy?" },
];

export function AiAssistant({ configured }: { configured: boolean }) {
  const [taskKey, setTaskKey] = useState<string>(TASKS[0].key);
  const [context, setContext] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  const task = TASKS.find((t) => t.key === taskKey)!;

  function run() {
    setError(null);
    setCopied(false);
    start(async () => {
      const r = await assistAction(taskKey, context);
      if (r.ok) setOutput(r.text);
      else { setError(r.error); setOutput(""); }
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked — user can select manually */ }
  }

  return (
    <div className="space-y-5">
      {!configured && (
        <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-[#FDF7EC] px-4 py-3 text-sm text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>AI isn&apos;t configured yet. Set <code className="rounded bg-white/60 px-1">AI_API_KEY</code> in your environment to turn on the assistant. You can still explore the tools below.</span>
        </div>
      )}

      {/* Task picker */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {TASKS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => { setTaskKey(t.key); setError(null); }}
            className={`rounded-xl border p-3 text-left transition-colors ${taskKey === t.key ? "border-brand-blue bg-brand-blueLight" : "border-surface-border bg-white hover:border-brand-blue/50"}`}
          >
            <p className={`text-sm font-semibold ${taskKey === t.key ? "text-brand-blue" : "text-brand-navy"}`}>{t.label}</p>
            <p className="mt-0.5 text-xs text-ink-muted">{t.hint}</p>
          </button>
        ))}
      </div>

      {/* Input */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-brand-navy">Your details</label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder={task.placeholder}
          rows={5}
          className="w-full rounded-xl border border-surface-border bg-white p-3 text-sm text-ink focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15"
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-ink-faint">The assistant only uses what you type — it never invents prices or availability.</p>
          <button
            type="button"
            onClick={run}
            disabled={pending || context.trim().length < 3}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-blue px-5 text-sm font-bold text-white transition-colors hover:bg-brand-blueDark disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {output ? "Regenerate" : "Generate"}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-[#FCE9E9] px-4 py-3 text-sm text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Output */}
      {output && (
        <div className="rounded-2xl border border-surface-border bg-white">
          <div className="flex items-center justify-between border-b border-surface-border px-4 py-2.5">
            <p className="text-sm font-semibold text-brand-navy">Draft</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={run} disabled={pending} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-ink-muted hover:bg-surface-muted">
                <RefreshCw className="h-3.5 w-3.5" /> Redo
              </button>
              <button type="button" onClick={copy} className="inline-flex items-center gap-1 rounded-lg bg-brand-blueLight px-2.5 py-1 text-xs font-semibold text-brand-blue hover:brightness-95">
                {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
              </button>
            </div>
          </div>
          <p className="whitespace-pre-wrap p-4 text-sm leading-relaxed text-ink">{output}</p>
        </div>
      )}
    </div>
  );
}
