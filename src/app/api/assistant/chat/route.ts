import { NextResponse } from "next/server";
import { z } from "zod";
import { isAiConfigured, runAssistant } from "@/lib/services/ai-service";
import { groundedPicks } from "@/lib/services/assistant-search";

export const runtime = "nodejs";

const schema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) })).min(1).max(20),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 422 });

  const messages = parsed.data.messages;
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  try {
    if (isAiConfigured()) {
      const { reply, results } = await runAssistant(messages);
      return NextResponse.json({ ok: true, ai: true, reply, results }, { headers: { "Cache-Control": "no-store" } });
    }
    // Fallback: grounded keyword retrieval (no LLM key set).
    const { message, results } = await groundedPicks(lastUser);
    return NextResponse.json({ ok: true, ai: false, reply: message, results }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // If the LLM call fails, degrade gracefully to grounded search.
    const { message, results } = await groundedPicks(lastUser);
    return NextResponse.json({ ok: true, ai: false, reply: message, results, degraded: true }, { headers: { "Cache-Control": "no-store" } });
  }
}
