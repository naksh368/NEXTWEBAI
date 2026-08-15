"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, Send, Loader2, ArrowRight } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils";

type ResultPkg = {
  id: string; slug: string; name: string; theme: string | null;
  destination: { name: string; slug: string }; cover: string | null;
  nights: number; days: number; basePrice: number; estTotal: number;
};
type Result = { label: string; pkg: ResultPkg };
type Msg = { role: "user" | "assistant"; text: string; results?: Result[] };

const SUGGESTIONS = [
  "A 6-day Dubai holiday for 2 under ₹1.5 lakh",
  "Honeymoon in Bali",
  "Family trip to Singapore for 4",
  "Beach holiday in Thailand under ₹80k",
];

export function AssistantChat() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Hi! Tell me about your dream trip — destination, dates, travellers and budget. I only ever suggest real, published ExpertzTrip packages." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const query = text.trim();
    if (!query || loading) return;
    const nextMessages: Msg[] = [...messages, { role: "user", text: query }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      // Send conversation history so the LLM has context (grounded to real data).
      const history = nextMessages.filter((m) => m.role === "user" || m.role === "assistant").map((m) => ({ role: m.role, content: m.text }));
      const res = await fetch("/api/assistant/chat", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", text: data.reply ?? "Here's what I found.", results: data.results ?? [] }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Sorry, I couldn't reach the server. Please try again." }]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }));
    }
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] min-h-[520px] flex-col overflow-hidden rounded-2xl border border-surface-border bg-white shadow-card">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={m.role === "user" ? "max-w-[85%]" : "w-full max-w-[95%]"}>
              <div
                className={
                  m.role === "user"
                    ? "rounded-2xl rounded-tr-sm bg-brand-blue px-4 py-2.5 text-sm text-white"
                    : "rounded-2xl rounded-tl-sm bg-surface-muted px-4 py-2.5 text-sm text-ink"
                }
              >
                {m.text}
              </div>
              {m.results && m.results.length > 0 && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {m.results.map((r) => (
                    <div key={r.label + r.pkg.id} className="overflow-hidden rounded-xl border border-surface-border">
                      <div className="relative aspect-[16/9]">
                        <SmartImage src={r.pkg.cover} alt={r.pkg.name} sizes="(max-width:640px) 100vw, 40vw" />
                        <div className="absolute left-2 top-2"><Badge tone="brand">{r.label}</Badge></div>
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-ink-muted">{r.pkg.destination.name} · {r.pkg.nights}N/{r.pkg.days}D</p>
                        <p className="line-clamp-1 text-sm font-semibold text-brand-navy">{r.pkg.name}</p>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-sm font-bold text-brand-navy">{formatINR(r.pkg.basePrice)}<span className="text-xs font-normal text-ink-muted">/pp</span></span>
                          <Link href={`/packages/${r.pkg.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:underline">
                            Open <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Searching real packages…
          </div>
        )}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="rounded-full border border-surface-border bg-white px-3 py-1.5 text-sm text-ink-muted transition-colors hover:border-brand-blue hover:text-brand-blue">
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2 border-t border-surface-border p-3">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-surface-border px-3">
          <Sparkles className="h-4 w-4 shrink-0 text-brand-orange" />
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Describe your trip…" aria-label="Describe your trip"
            className="h-11 w-full bg-transparent text-sm focus:outline-none" />
        </div>
        <button type="submit" disabled={loading || !input.trim()} className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blue text-white disabled:opacity-50" aria-label="Send">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
