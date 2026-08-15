import { db } from "@/lib/db";
import { searchPackages, type GroundedPackage } from "./assistant-search";
import { TAX_RATE } from "@/lib/constants";

/**
 * ExpertzTrip AI — LLM layer (Phase 21). Uses an OpenAI-compatible chat model
 * (default gpt-4o-mini) with function calling. The model may ONLY answer from
 * packages returned by the search_packages tool — it can never invent packages,
 * prices, hotels or availability. Activates when AI_API_KEY is set; otherwise
 * callers fall back to the grounded keyword search.
 */

const API_KEY = process.env.AI_API_KEY;
const MODEL = process.env.AI_MODEL || "gpt-4o-mini";
const BASE = process.env.AI_BASE_URL || "https://api.openai.com/v1";

export function isAiConfigured(): boolean {
  return Boolean(API_KEY);
}

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type AssistantReply = { reply: string; results: { label: string; pkg: GroundedPackage }[] };

const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_packages",
      description: "Search ExpertzTrip's REAL published holiday packages. Call this for any question about trips, destinations, durations, prices or availability.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Natural-language trip query, e.g. '6-day Dubai for 2 under 1.5 lakh' or 'honeymoon in Bali'." } },
        required: ["query"],
      },
    },
  },
];

async function systemPrompt(): Promise<string> {
  const brand = await db.businessSetting.findUnique({ where: { key: "brand" } });
  const b = (brand?.value ?? {}) as { name?: string; supportEmail?: string; supportPhone?: string };
  return [
    `You are ${b.name ?? "ExpertzTrip"} AI, the assistant for ${b.name ?? "ExpertzTrip"}, a holiday-package company selling curated, customizable trips (Dubai, Bali, Maldives, Thailand, Singapore, Europe and more).`,
    `STRICT RULES:`,
    `- Only recommend packages, prices, durations and availability returned by the search_packages tool.`,
    `- NEVER invent packages, prices, hotels, flights, discounts, availability or reviews. If the tool returns nothing, say so honestly and suggest changing the budget or destination.`,
    `- Prices are per person in INR unless stated. You may note an estimated total for the group when helpful.`,
    `- When recommending, give the package name, destination, duration and starting price, and invite the customer to open the package page to customize and book.`,
    `- Be concise, warm and helpful. Answer general trip-planning questions too, but ground any specific offering in tool results.`,
    b.supportEmail ? `- For help beyond trips, share support: ${b.supportEmail}${b.supportPhone ? ` / ${b.supportPhone}` : ""}.` : ``,
  ].filter(Boolean).join("\n");
}

async function callOpenAI(messages: unknown[]) {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages, tools: TOOLS, tool_choice: "auto", temperature: 0.3 }),
  });
  if (!res.ok) throw new Error(`AI request failed (${res.status})`);
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
