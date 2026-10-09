import { searchPackages, type GroundedPackage } from "./assistant-search";
import { TAX_RATE } from "@/lib/constants";
import { getSiteSettings } from "@/lib/site-settings";
import { getSiteUrl } from "@/lib/utils";

/**
 * JST Travel Assistant — the LLM layer.
 *
 * Works with any OpenAI-compatible chat endpoint (OpenAI, OpenRouter, Azure,
 * a local gateway) selected by `AI_BASE_URL`. The model answers ONLY from the
 * packages returned by the `search_packages` tool: it cannot invent a package,
 * a price, a hotel or an availability claim, because it is never given any
 * inventory except real published rows from our own database.
 *
 * The assistant turns itself off when `AI_API_KEY` is unset, and every caller
 * falls back to the grounded keyword search — no key, no degraded "made-up"
 * mode. The key is read server-side only and never reaches the browser.
 */

const API_KEY = process.env.AI_API_KEY;
const MODEL = process.env.AI_MODEL || "gpt-4o-mini";
const BASE = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");

/** OpenRouter asks callers to identify themselves; harmless on other hosts. */
function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };
  if (BASE.includes("openrouter.ai")) {
    headers["HTTP-Referer"] = getSiteUrl();
    headers["X-Title"] = "JST Andaman Travels";
  }
  return headers;
}

export function isAiConfigured(): boolean {
  return Boolean(API_KEY);
}

/**
 * Generic single-shot completion (no tools) for internal admin tooling such as
 * the Package Importer. Returns the model's text, or null when AI isn't
 * configured or the call fails. Never throws.
 */
export async function aiComplete(prompt: string, opts?: { system?: string; maxTokens?: number; temperature?: number; timeoutMs?: number }): Promise<string | null> {
  if (!API_KEY) return null;
  // Never hang past the serverless function limit — abort and let the caller
  // fall back to facts-only extraction instead of returning a timeout page.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 22_000);
  try {
    const messages = [
      ...(opts?.system ? [{ role: "system", content: opts.system }] : []),
      { role: "user", content: prompt },
    ];
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: authHeaders(),
      body: JSON.stringify({ model: MODEL, messages, temperature: opts?.temperature ?? 0.2, max_tokens: opts?.maxTokens ?? 1600 }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type AssistantReply = { reply: string; results: { label: string; pkg: GroundedPackage }[] };

const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_packages",
      description:
        "Search JST Andaman Travels's REAL published Andaman holiday packages. Call this for any question about trips, islands, durations, prices, inclusions or availability.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Natural-language trip query, e.g. '6-day Andaman trip for 4 under 1 lakh', '3 star package with Havelock', 'budget Andaman holiday'.",
          },
        },
        required: ["query"],
      },
    },
  },
];

async function systemPrompt(): Promise<string> {
  const s = await getSiteSettings();
  const contact = [s.phonePrimary, s.email].filter(Boolean).join(" / ");

  return [
    `You are the travel assistant for ${s.brandName}, a travel agency based in Sri Vijaya Puram (Port Blair) that arranges holidays in the Andaman & Nicobar Islands ONLY.`,
    ``,
    `WHAT WE SELL`,
    `- Andaman island holidays: Port Blair, Havelock Island (Swaroop Dweep) and Neil Island (Shaheed Dweep), with sightseeing at Radhanagar and Kalapathar beaches, Ross Island, North Bay and the Cellular Jail.`,
    `- We do NOT sell Dubai, Bali, Maldives, Thailand, Europe or any destination outside the Andamans. If someone asks for one, say plainly that we are Andaman specialists and offer to plan their Andaman trip instead.`,
    ``,
    `STRICT RULES — these protect the customer, so never bend them:`,
    `- Recommend only packages, prices, durations and inclusions returned by the search_packages tool. If the tool returns nothing, say so and suggest adjusting the budget, dates or group size.`,
    `- NEVER invent a package, price, hotel name, ferry time, discount, review or availability. You have no inventory beyond the tool results.`,
    `- Prices are starting rates per person in INR on the stated occupancy and group size. Always describe them as starting rates confirmed in writing by the team, never as a final or guaranteed quote.`,
    `- Inclusions differ between packages. Only state what a specific package's own inclusions say; never assume breakfast, air-conditioned transport or ferries are included.`,
    `- Airfare to Port Blair is NOT included in our land packages.`,
    `- Never promise availability. Hotels and ferries are confirmed by hand by our team, and sailings change with sea conditions.`,
    `- An enquiry books nothing. Be clear that nothing is held until the team confirms it in writing.`,
    ``,
    `STYLE`,
    `- Warm, concise and practical. British English. Short paragraphs.`,
    `- When recommending, give the package name, duration, hotel category, minimum group size and starting price, then invite them to open the package page or send an enquiry.`,
    `- Link to a package using ONLY the relative \`url\` the tool returned, e.g. [Andaman 3 Star Package](/packages/andaman-3-star-package). Never write a domain name or invent a web address.`,
    `- You can answer general Andaman planning questions (best time to visit, permits, ferries, how many nights to allow) from general knowledge, but flag anything that changes often as worth confirming with the team.`,
    contact ? `- To speak to a person: ${contact}.` : ``,
  ].filter(Boolean).join("\n");
}

async function callOpenAI(messages: unknown[]) {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: authHeaders(),
    signal: AbortSignal.timeout(28_000),
    body: JSON.stringify({ model: MODEL, messages, tools: TOOLS, tool_choice: "auto", temperature: 0.3 }),
  });
  if (!res.ok) {
    // The upstream body can contain the key or account details — log the
    // status only, and let the caller fall back to grounded search.
    throw new Error(`AI request failed (${res.status})`);
  }
  return res.json();
}

export async function runAssistant(history: ChatMessage[]): Promise<AssistantReply> {
  if (!API_KEY) throw new Error("AI not configured");

  const collected = new Map<string, GroundedPackage>();
  const messages: unknown[] = [
    { role: "system", content: await systemPrompt() },
    ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
  ];

  // Up to 3 rounds: model → tool(s) → model → (tool) → final.
  for (let round = 0; round < 3; round++) {
    const data = await callOpenAI(messages);
    const msg = data.choices?.[0]?.message;
    if (!msg) break;

    if (msg.tool_calls?.length) {
      messages.push(msg);
      for (const call of msg.tool_calls) {
        let query = "";
        try { query = JSON.parse(call.function.arguments || "{}").query ?? ""; } catch { /* ignore */ }
        const { parsed, packages } = await searchPackages(query);
        for (const p of packages.slice(0, 6)) collected.set(p.id, p);
        const compact = packages.slice(0, 6).map((p) => ({
          name: p.name, destination: p.destination.name, nights: p.nights, days: p.days,
          pricePerPersonINR: p.basePrice, estTotalForPartyINR: Math.round(p.basePrice * parsed.pax * (1 + TAX_RATE)),
          url: `/packages/${p.slug}`, summary: p.summary,
        }));
        messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify({ count: compact.length, packages: compact }) });
      }
      continue; // let the model read tool output
    }

    // Final answer
    const reply: string = msg.content ?? "";
    const results = Array.from(collected.values()).slice(0, 4).map((pkg) => ({ label: pkg.destination.name, pkg }));
    return { reply, results };
  }

  return { reply: "Sorry, I couldn't complete that. Please try rephrasing.", results: [] };
}
