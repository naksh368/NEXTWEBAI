"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, Loader2, MessageCircle, RotateCcw } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { PlannerAvatar } from "./planner-avatar";
import { RichText } from "./rich-text";
import { cn, formatINR } from "@/lib/utils";

type ResultPkg = {
  id: string;
  slug: string;
  name: string;
  cover: string | null;
  nights: number;
  days: number;
  basePrice: number;
  hotelCategory?: string | null;
  minTravellers?: number;
};
type Msg = { role: "user" | "assistant"; text: string; results?: { label: string; pkg: ResultPkg }[]; error?: boolean };

const STORAGE_KEY = "jst_planner_chat_v1";

const GREETING: Msg = {
  role: "assistant",
  text:
    "Hi, I'm **Asha**, JST's AI trip planner. Tell me who's travelling, roughly when, and your budget — I'll match you to our real Andaman packages or sketch a custom day-by-day plan.",
};

export const PLANNER_SUGGESTIONS = [
  "6 days for 4 people under ₹1 lakh",
  "Plan a honeymoon in Havelock & Neil",
  "Best time to visit the Andamans?",
  "Which package has 4-star hotels?",
];

function load(): Msg[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Msg[]) : null;
    return Array.isArray(parsed) && parsed.length ? parsed.slice(-30) : [GREETING];
  } catch {
    return [GREETING];
  }
}

function save(messages: Msg[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
  } catch {
    /* storage unavailable — the chat still works, it just won't persist */
  }
}

/**
 * The conversation itself — shared by the floating widget and the /ai page.
 * Every reply comes from /api/assistant/chat, which answers only from real
 * published packages.
 */
export function PlannerChat({
  whatsappE164,
  initialPrompt,
  onPromptConsumed,
  autoFocus,
  className,
}: {
  whatsappE164: string | null;
  initialPrompt?: string | null;
  onPromptConsumed?: () => void;
  autoFocus?: boolean;
  className?: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // State, not a ref: effects that depend on the restored conversation must
  // re-run once it is in place, in the same render as the restored messages.
  const [ready, setReady] = useState(false);

  // Restore this tab's conversation after mount (sessionStorage is client-only).
  useEffect(() => {
    setMessages(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) save(messages);
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    );
  }, [messages, loading, ready]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const send = useCallback(
    async (text: string) => {
      const query = text.trim();
      if (!query || loading) return; // guards a double send
      const next: Msg[] = [...messages, { role: "user", text: query }];
      setMessages(next);
      setInput("");
      setLoading(true);
      try {
        const history = next
          // The greeting is local UI copy; never send it back as conversation.
          .filter((m) => !m.error && m.text !== GREETING.text)
          .slice(-12)
          .map((m) => ({ role: m.role, content: m.text }));
        const res = await fetch("/api/assistant/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history.length ? history : [{ role: "user", content: query }] }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) {
          setMessages((m) => [
            ...m,
            { role: "assistant", text: data?.error ?? "I couldn't answer that just now. Please try again in a moment.", error: true },
          ]);
        } else {
          setMessages((m) => [...m, { role: "assistant", text: data.reply, results: data.results ?? [] }]);
        }
      } catch {
        setMessages((m) => [
          ...m,
          { role: "assistant", text: "I couldn't reach the server. Please check your connection and try again.", error: true },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading]
  );

  // A question handed over by the map or another button. Waits until the
  // saved conversation is restored, so the new question is appended to it.
  useEffect(() => {
    if (initialPrompt && ready && !loading) {
      onPromptConsumed?.();
      void send(initialPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt, ready]);

  const userTurns = messages.filter((m) => m.role === "user").map((m) => m.text);
  const handoff =
    whatsappE164 && userTurns.length
      ? `https://wa.me/${whatsappE164}?text=${encodeURIComponent(
          `Hello JST Andaman Travels, I was planning with Asha (your AI planner):\n\n${userTurns
            .slice(-4)
            .map((t) => `• ${t}`)
            .join("\n")}\n\nCould you send me a quotation?`
        )}`
      : null;

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-brand-blue px-3.5 py-2.5 text-sm text-white">
              {m.text}
            </div>
          ) : (
            <div key={i} className="flex max-w-[94%] gap-2.5">
              <PlannerAvatar size={30} className="mt-0.5" />
              <div className="min-w-0 flex-1 space-y-2.5">
                <div
                  className={cn(
                    "rounded-2xl rounded-tl-md px-3.5 py-2.5 text-sm leading-relaxed",
                    m.error ? "bg-brand-orangeLight text-brand-orangeDark" : "bg-surface-muted text-ink"
                  )}
                >
                  <RichText text={m.text} />
                </div>
                {m.results && m.results.length > 0 && (
                  <div className="space-y-2">
                    {m.results.map((r) => (
                      <Link
                        key={r.pkg.id}
                        href={`/packages/${r.pkg.slug}`}
                        className="flex items-center gap-3 rounded-xl border border-surface-border bg-white p-2 transition-colors hover:border-brand-blue"
                      >
                        <span className="relative h-12 w-14 shrink-0 overflow-hidden rounded-lg">
                          <SmartImage src={r.pkg.cover} alt={r.pkg.name} sizes="56px" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-bold text-brand-navy">{r.pkg.name}</span>
                          <span className="block truncate text-[11px] text-ink-muted">
                            {r.pkg.nights}N/{r.pkg.days}D
                            {r.pkg.minTravellers && r.pkg.minTravellers > 1 ? ` · min ${r.pkg.minTravellers} pax` : ""}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block text-[10px] font-semibold uppercase text-ink-faint">from</span>
                          <span className="tabular block text-sm font-extrabold text-brand-navy">{formatINR(r.pkg.basePrice)}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {loading && (
          <div className="flex items-center gap-2.5">
            <PlannerAvatar size={30} />
            <span className="inline-flex items-center gap-2 rounded-2xl rounded-tl-md bg-surface-muted px-3.5 py-2.5 text-sm text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Asha is planning…
            </span>
          </div>
        )}

        {messages.length <= 1 && !loading && (
          <div className="flex flex-wrap gap-2 pl-10">
            {PLANNER_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border border-brand-blue/30 bg-white px-3 py-1.5 text-xs font-bold text-brand-blue transition-colors hover:bg-brand-blueLight"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-surface-border bg-white px-3 pb-3 pt-2.5">
        {(handoff || messages.length > 1) && (
          <div className="mb-2 flex items-center justify-between gap-2">
            {handoff ? (
              <a
                href={handoff}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F7EE] px-3 py-1 text-xs font-bold text-[#128C4B] hover:bg-[#D3F0E0]"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Send this plan to our team
              </a>
            ) : (
              <span />
            )}
            {messages.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  setMessages([GREETING]);
                  setInput("");
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-brand-blue"
              >
                <RotateCcw className="h-3 w-3" /> Start over
              </button>
            )}
          </div>
        )}
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <label htmlFor="planner-input" className="sr-only">
            Message the AI trip planner
          </label>
          <textarea
            id="planner-input"
            ref={inputRef}
            rows={1}
            value={input}
            maxLength={2000}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder="e.g. 5 nights for 4, budget ₹1 lakh"
            className="max-h-28 min-h-[44px] flex-1 resize-none rounded-xl border border-surface-border bg-surface-muted px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-blue/10"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-orange text-white transition-colors hover:bg-brand-orangeDark disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
          </button>
        </form>
        <p className="mt-1.5 text-center text-[10.5px] leading-snug text-ink-faint">
          AI planner · answers from our real packages · prices are starting rates confirmed by our team
        </p>
      </div>
    </div>
  );
}
