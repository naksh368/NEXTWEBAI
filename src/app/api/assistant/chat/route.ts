import { NextResponse } from "next/server";
import { z } from "zod";
import { isAiConfigured, runAssistant } from "@/lib/services/ai-service";
import { groundedPicks } from "@/lib/services/assistant-search";
import { clientIp, hit } from "@/lib/rate-limit";

export const runtime = "nodejs";
// Free models can be slow, and a reply may take two or three model rounds.
// Vercel's default function limit would cut that off mid-answer.
export const maxDuration = 60;

const schema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(20),
});

// Per-address cap. Generous for a real conversation, and it stops one visitor
// (or a script) from burning through the AI provider's daily quota.
const RATE_LIMIT = 24;
const RATE_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const limit = hit(`assistant:${clientIp(request)}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "You have sent a lot of messages in a short time. Please wait a few minutes, or message our team on WhatsApp.",
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Please type a message." }, { status: 422 });
  }

  const messages = parsed.data.messages;
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  try {
    if (isAiConfigured()) {
      const { reply, results } = await runAssistant(messages);
      return NextResponse.json({ ok: true, ai: true, reply, results }, { headers: { "Cache-Control": "no-store" } });
    }
  } catch (e) {
    // Busy or failed model: fall through to grounded search, which still only
    // ever returns real published packages.
    console.warn("[assistant] AI unavailable, using grounded search:", (e as Error).message);
  }

  try {
    const { message, results } = await groundedPicks(lastUser);
    return NextResponse.json(
      { ok: true, ai: false, reply: message, results, degraded: isAiConfigured() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "The planner is unavailable right now. Please message our team on WhatsApp." },
      { status: 503 }
    );
  }
}
