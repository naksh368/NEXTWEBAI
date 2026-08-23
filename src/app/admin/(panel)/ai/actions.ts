"use server";

import { authorize } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/services/audit-service";
import { aiComplete, isAiConfigured } from "@/lib/services/ai-service";

type R = { ok: true; text: string } | { ok: false; error: string };

// Grounded, honest task specs. Kept server-side (a "use server" module may only
// export async functions); the client mirrors the labels in ai-assistant.tsx.
const AI_TASKS: Record<string, { system: string; maxTokens: number; temperature: number }> = {
  summary: {
    system:
      "You are a copywriter for ExpertzTrip, a premium Indian holiday brand. Write a warm, confident 2–3 sentence package summary for Indian travellers. Use only the facts given — never invent hotels, prices, inclusions or availability. Prices, if any, stay in INR. No emojis, no clichés like 'nestled'. Output the summary only.",
    maxTokens: 400,
    temperature: 0.5,
  },
  improve: {
    system:
      "You are an editor for ExpertzTrip. Rewrite the text to be clearer, warmer and more professional for Indian travellers, keeping every fact identical — do not add, remove or invent any detail, price or claim. Keep it roughly the same length. Output the improved text only.",
    maxTokens: 700,
    temperature: 0.4,
  },
  itinerary: {
    system:
      "You are a travel planner for ExpertzTrip. Draft a realistic day-by-day itinerary for Indian travellers from the destination, nights and highlights given. Use the format 'Day 1: <title> — <2–3 sentences>'. Keep pacing sensible; do not invent specific hotel names, exact prices or flight numbers. Output the itinerary only.",
    maxTokens: 1200,
    temperature: 0.5,
  },
  inclusions: {
    system:
      "You are a travel product specialist for ExpertzTrip. From the package details, produce two short bullet lists: 'Inclusions:' and 'Exclusions:'. Only list things implied by the details or standard for such a package (e.g. exclusions like personal expenses, tips, anything not mentioned). Never invent specific prices. Output the two lists only.",
    maxTokens: 700,
    temperature: 0.4,
  },
  reply: {
    system:
      "You are a travel expert at ExpertzTrip replying to a customer. Write a warm, professional, concise reply for an Indian traveller. Use only facts the admin provides — never invent prices, availability or promises. If pricing is needed but not given, say the team will share an exact, server-verified quote. Sign off as 'Team ExpertzTrip' and mention they can reach support@expertztrip.com. Output the reply only.",
    maxTokens: 600,
    temperature: 0.5,
  },
  faq: {
    system:
      "You are writing an FAQ answer for ExpertzTrip. Answer in 2–4 clear sentences for Indian travellers. Be honest and avoid over-promising; do not invent specific prices, timelines or policies not implied by the question. Output the answer only.",
    maxTokens: 400,
    temperature: 0.3,
  },
};

/** Run one assistant task on the admin's input. Returns draft text to paste. */
export async function assistAction(task: string, context: string): Promise<R> {
  const admin = await authorize("dashboard.view");
  if (!admin) return { ok: false, error: "Not authorized." };
  if (!isAiConfigured()) return { ok: false, error: "AI isn't configured yet — set AI_API_KEY to enable the assistant." };

  const spec = AI_TASKS[task];
  if (!spec) return { ok: false, error: "Unknown task." };

  const input = context.trim();
  if (input.length < 3) return { ok: false, error: "Add a little more detail so the assistant has something to work with." };
  if (input.length > 6000) return { ok: false, error: "That's a lot of text — please trim it to under 6000 characters." };

  const text = await aiComplete(input, { system: spec.system, maxTokens: spec.maxTokens, temperature: spec.temperature, timeoutMs: 24_000 });
  if (!text || !text.trim()) return { ok: false, error: "The assistant couldn't produce a draft — please try again in a moment." };

  await writeAudit({ adminUserId: admin.id, action: "ai.assist", resource: `AiTask:${task}`, after: { chars: input.length } });
  return { ok: true, text: text.trim() };
}
