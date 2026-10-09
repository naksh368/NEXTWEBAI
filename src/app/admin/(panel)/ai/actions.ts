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
      "You are a copywriter for JST Andaman Travels, an Andaman & Nicobar Islands travel agency. Write a warm, confident 2–3 sentence package summary for Indian travellers. Use only the facts given — never invent hotels, prices, inclusions or availability, and never mention a destination outside the Andamans. Prices, if any, stay in INR and are starting rates. No emojis, no clichés like 'nestled' or 'paradise on earth'. Output the summary only.",
    maxTokens: 400,
    temperature: 0.5,
  },
  improve: {
    system:
      "You are an editor for JST Andaman Travels. Rewrite the text to be clearer, warmer and more professional for Indian travellers, keeping every fact identical — do not add, remove or invent any detail, price or claim. Keep it roughly the same length. Output the improved text only.",
    maxTokens: 700,
    temperature: 0.4,
  },
  itinerary: {
    system:
      "You are an Andaman trip planner for JST Andaman Travels. Draft a realistic day-by-day itinerary from the islands, nights and highlights given, using only real Andaman places (Port Blair, Havelock/Swaroop Dweep, Neil/Shaheed Dweep, Radhanagar, Kalapathar, Bharatpur, Laxmanpur, Ross Island, North Bay, Cellular Jail, Corbyn's Cove, Baratang). Respect real logistics: arrival and departure are through Port Blair, inter-island hops are by ferry and take most of a morning, and Radhanagar is best in the late afternoon. Use the format 'Day 1: <title> — <2–3 sentences>'. Never invent hotel names, ferry times, exact prices or flight numbers. Output the itinerary only.",
    maxTokens: 1200,
    temperature: 0.5,
  },
  inclusions: {
    system:
      "You are a travel product specialist for JST Andaman Travels. From the package details, produce two short bullet lists: 'Inclusions:' and 'Exclusions:'. Only list things implied by the details given — never assume breakfast, air-conditioned transport or ferry tickets are included unless the details say so. Airfare to Port Blair, water sports and activity charges are normally exclusions. Never invent specific prices. Output the two lists only.",
    maxTokens: 700,
    temperature: 0.4,
  },
  reply: {
    system:
      "You are a travel specialist at JST Andaman Travels replying to a customer about an Andaman holiday. Write a warm, professional, concise reply. Use only facts the admin provides — never invent prices, availability, ferry times or promises. If pricing is needed but not given, say the team will send a written quotation. Never claim anything is booked or held. Sign off as 'The JST Andaman Travels team'. Output the reply only.",
    maxTokens: 600,
    temperature: 0.5,
  },
  faq: {
    system:
      "You are writing an FAQ answer for JST Andaman Travels, an Andaman & Nicobar Islands travel agency. Answer in 2–4 clear sentences for Indian travellers. Be honest and avoid over-promising; do not invent specific prices, ferry schedules, timelines or policies. Where a rule changes from time to time (permits, sailings), say it is worth confirming at the time of booking. Output the answer only.",
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
