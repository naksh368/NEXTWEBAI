import { listDestinations, searchPackages, type GroundedPackage } from "./assistant-search";
import { getSiteSettings } from "@/lib/site-settings";
import { getSiteUrl } from "@/lib/utils";

/**
 * Asha — the JST Andaman Travels AI trip planner.
 *
 * Works with any OpenAI-compatible endpoint (OpenRouter, OpenAI, Azure, a
 * local gateway) selected by `AI_BASE_URL`. It answers ONLY from what its tools
 * return — live, published rows in our own database — so it can never invent
 * a package, a price, a hotel or an availability claim. Because the tools read
 * the database on every call, anything an administrator publishes or edits is
 * known to the planner immediately: no retraining, no redeploy, no cache.
 *
 * `AI_MODEL` may be a comma-separated list. On OpenRouter the list is sent as a
 * fallback chain, so when a free model is rate-limited the next one answers.
 * With no `AI_API_KEY` the planner switches off and callers fall back to
 * grounded keyword search. The key is server-side only.
 */

const API_KEY = process.env.AI_API_KEY;
const MODELS = (process.env.AI_MODEL || "gpt-4o-mini")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
const PRIMARY_MODEL = MODELS[0] ?? "gpt-4o-mini";
const BASE = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
const IS_OPENROUTER = BASE.includes("openrouter.ai");

/** Kept under the 60s function limit set on the chat route, across all rounds. */
const ROUND_TIMEOUT_MS = 20_000;

export const ASSISTANT_NAME = "Asha";

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };
  if (IS_OPENROUTER) {
    // OpenRouter asks callers to identify themselves; harmless elsewhere.
    headers["HTTP-Referer"] = getSiteUrl();
    headers["X-Title"] = "JST Andaman Travels";
  }
  return headers;
}

/** The model selector: a fallback chain on OpenRouter, a single model elsewhere. */
function modelFields(): Record<string, unknown> {
  if (IS_OPENROUTER && MODELS.length > 1) return { model: PRIMARY_MODEL, models: MODELS.slice(0, 3) };
  return { model: PRIMARY_MODEL };
}

/**
 * Some reasoning models wrap their working in <think> tags. That is never
 * meant for the customer, so it is removed before anything is shown.
 */
export function stripReasoning(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^\s*<think>[\s\S]*$/i, "").trim();
}

export function isAiConfigured(): boolean {
  return Boolean(API_KEY);
}

/**
 * Single-shot completion (no tools) for admin tooling such as the package
 * importer and the AI writing assistant. Returns null when AI is off or the
 * call fails. Never throws.
 */
export async function aiComplete(
  prompt: string,
  opts?: { system?: string; maxTokens?: number; temperature?: number; timeoutMs?: number }
): Promise<string | null> {
  if (!API_KEY) return null;
  try {
    const messages = [
      ...(opts?.system ? [{ role: "system", content: opts.system }] : []),
      { role: "user", content: prompt },
    ];
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      signal: AbortSignal.timeout(opts?.timeoutMs ?? 22_000),
      headers: authHeaders(),
      body: JSON.stringify({
        ...modelFields(),
        messages,
        temperature: opts?.temperature ?? 0.2,
        max_tokens: opts?.maxTokens ?? 1600,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    return typeof text === "string" ? stripReasoning(text) : null;
  } catch {
    return null;
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
        "Search JST Andaman Travels' REAL published holiday packages, read live from the database. Call this for ANY question about packages, prices, durations, hotel categories, inclusions or what fits a budget or group. Returns starting prices per person, minimum group size and the package's own inclusions.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "The traveller's request in their words, including group size, days, budget and hotel preference if given, e.g. '6 days for 4 people under 1 lakh 3 star'.",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_destinations",
      description:
        "List the Andaman islands, beaches and sights JST Andaman Travels currently offers, read live from the database.",
      parameters: { type: "object", properties: {} },
    },
  },
];

async function systemPrompt(): Promise<string> {
  const s = await getSiteSettings();
  const contact = [s.phonePrimary && `phone/WhatsApp ${s.phonePrimary}`, s.email].filter(Boolean).join(", ");

  return [
    `You are ${ASSISTANT_NAME}, the AI trip planner for ${s.brandName}, a travel agency based in Sri Vijaya Puram (Port Blair) that arranges holidays in the Andaman & Nicobar Islands ONLY.`,
    `You are an AI, not a person. If anyone asks whether you are human, say plainly that you are JST's AI trip planner and offer to connect them with the team on WhatsApp.`,
    ``,
    `WHAT WE SELL`,
    `- Andaman island holidays: Port Blair, Havelock Island (Swaraj Dweep) and Neil Island (Shaheed Dweep), with Radhanagar and Kalapathar beaches, Ross Island, North Bay, the Cellular Jail and more. Call list_destinations for the current list.`,
    `- We do NOT sell anywhere outside the Andamans. If asked, say we are Andaman specialists and offer to plan an Andaman trip instead.`,
    ``,
    `CUSTOMISED PLANS`,
    `- You may draft a customised day-by-day Andaman itinerary when asked. Use real places and real logistics: arrival and departure are through Port Blair; inter-island ferries take most of a morning; Radhanagar is best in the late afternoon; Ross Island and North Bay pair well in one day; the Cellular Jail Light & Sound Show is in the evening.`,
    `- Places outside our standard route — Baratang (limestone caves, mud volcano), Long Island, Rangat, Mayabunder, Diglipur (Ross & Smith Island), Little Andaman, Barren Island viewing — are still in the Andamans. Never refuse them: offer them as a customised add-on or extension, explain the realistic travel time, and say our team will quote it.`,
    `- Always call search_packages and name the closest real package as the starting point, with its starting price. Never put a price on a custom plan yourself — say our team will send a written quotation for it.`,
    ``,
    `STRICT RULES — these protect the customer:`,
    `- Prices, packages, durations and inclusions come ONLY from tool results. NEVER invent a package, price, hotel name, ferry time, discount, review or availability.`,
    `- Prices are starting rates per person in INR before GST, for the package's minimum group size. Always call them starting rates confirmed in writing by our team — never final.`,
    `- Mention the minimum group size when it matters. If the traveller's group is smaller, say the per-person rate will be a little higher and the team will quote it.`,
    `- Inclusions differ between packages. Only state what that package's own inclusions list says. Airfare to Port Blair is not included in our land packages.`,
    `- Never promise availability. Hotels and ferries are confirmed by our team, and sailings depend on sea conditions. An enquiry books nothing.`,
    ``,
    `STYLE`,
    `- Warm, friendly and practical, like a helpful local planner. British English. Keep replies short — a few lines or a compact list. Use **bold** for package names and prices.`,
    `- Link to a package with ONLY the relative url the tool returned, e.g. [Andaman 3 Star Package](/packages/andaman-3-star-package). Never write a domain name or invent a web address.`,
    `- End with one helpful next step (a question, or an offer to send the details as an enquiry).`,
    contact ? `- To speak to a person: ${contact}.` : ``,
  ]
    .filter(Boolean)
    .join("\n");
}

async function callModel(messages: unknown[], allowTools: boolean) {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: authHeaders(),
    signal: AbortSignal.timeout(ROUND_TIMEOUT_MS),
    body: JSON.stringify({
      ...modelFields(),
      messages,
      tools: TOOLS,
      // On the last round tools are switched off, so the model has to write
      // its answer from what it has already gathered instead of searching again.
      tool_choice: allowTools ? "auto" : "none",
      temperature: 0.3,
      max_tokens: 900,
    }),
  });
  if (!res.ok) {
    // The upstream body can echo account details — keep only the status.
    throw new Error(`AI request failed (${res.status})`);
  }
  return res.json();
}

/** Compact, model-friendly view of a package (no internal ids). */
function toolPackage(p: GroundedPackage) {
  return {
    name: p.name,
    url: `/packages/${p.slug}`,
    nights: p.nights,
    days: p.days,
    hotelCategory: p.hotelCategory,
    startingPricePerPersonINR: p.basePrice,
    pricing: p.perPerson ? "per person, twin sharing, before GST" : "per group, before GST",
    minimumTravellers: p.minTravellers,
    estimatedGroupTotalBeforeGstINR: p.estTotal,
    groupBelowMinimum: p.belowMinimum,
    route: p.route,
    inclusions: p.inclusions,
    summary: p.summary,
  };
}

export async function runAssistant(history: ChatMessage[]): Promise<AssistantReply> {
  if (!API_KEY) throw new Error("AI not configured");

  const collected = new Map<string, GroundedPackage>();
  const messages: unknown[] = [
    { role: "system", content: await systemPrompt() },
    ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
  ];

  // Up to 3 rounds. The last one always produces text: a model that keeps
  // calling tools would otherwise run out of rounds without ever answering.
  const MAX_ROUNDS = 3;
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const data = await callModel(messages, round < MAX_ROUNDS - 1);
    const msg = data.choices?.[0]?.message;
    if (!msg) break;

    if (msg.tool_calls?.length) {
      messages.push({ role: "assistant", content: msg.content ?? "", tool_calls: msg.tool_calls });
      for (const call of msg.tool_calls) {
        let content: unknown;
        if (call.function?.name === "list_destinations") {
          content = { destinations: await listDestinations() };
        } else {
          let query = "";
          try {
            query = JSON.parse(call.function?.arguments || "{}").query ?? "";
          } catch {
            /* malformed arguments — search with an empty query */
          }
          const { packages } = await searchPackages(query);
          for (const p of packages.slice(0, 5)) collected.set(p.id, p);
          content = { count: packages.length, packages: packages.slice(0, 5).map(toolPackage) };
        }
        messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(content) });
      }
      continue; // let the model read the tool output
    }

    const reply = stripReasoning(typeof msg.content === "string" ? msg.content : "");
    if (!reply) break;
    const results = Array.from(collected.values())
      .slice(0, 3)
      .map((pkg) => ({ label: pkg.hotelCategory ?? pkg.destination.name, pkg }));
    return { reply, results };
  }

  throw new Error("AI did not produce an answer");
}
