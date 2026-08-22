/**
 * WhatsApp delivery for the notification/event system. Provider-agnostic and
 * honest: it never fakes a send. Without a configured provider it returns
 * SKIPPED so MessageLog records the truth. Two real providers are supported when
 * credentials are set:
 *  - meta   : WhatsApp Cloud API (Graph). Needs WHATSAPP_PHONE_ID + WHATSAPP_TOKEN.
 *  - twilio : Twilio WhatsApp. Needs TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN +
 *             TWILIO_WHATSAPP_FROM (e.g. "whatsapp:+14155238886").
 * India business-initiated messages generally require approved templates; free-
 * form text works inside a 24-hour customer-service window.
 */
const provider = () => process.env.WHATSAPP_PROVIDER || "";
const onlyDigits = (e164: string) => e164.replace(/[^\d]/g, "");
const withCc = (mobile: string) => {
  const d = onlyDigits(mobile);
  return d.length === 10 ? `91${d}` : d;
};

export type WhatsAppResult = { status: "SENT" | "SKIPPED" | "FAILED"; providerId?: string; error?: string };

/** True when a real WhatsApp provider is configured. */
export function isWhatsAppConfigured(): boolean {
  const p = provider();
  if (p === "meta") return Boolean(process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_TOKEN);
  if (p === "twilio") return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM);
  return false;
}

export async function sendWhatsApp(mobile: string, message: string): Promise<WhatsAppResult> {
  try {
    const p = provider();
    if (!p || p === "console") {
      if (p === "console") console.log(`\n🟢 [WhatsApp:console] to ${mobile}\n   ${message}\n`);
      return { status: "SKIPPED", error: p ? undefined : "WHATSAPP_PROVIDER not set" };
    }

    if (p === "meta") {
      const phoneId = process.env.WHATSAPP_PHONE_ID, token = process.env.WHATSAPP_TOKEN;
      if (!phoneId || !token) return { status: "SKIPPED", error: "WHATSAPP_PHONE_ID/TOKEN not configured" };
      const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", to: withCc(mobile), type: "text", text: { body: message } }),
      });
      const body = await res.text().catch(() => "");
      if (!res.ok) return { status: "FAILED", error: `Meta ${res.status}: ${body.slice(0, 140)}` };
      let providerId: string | undefined;
      try { providerId = (JSON.parse(body) as { messages?: { id?: string }[] }).messages?.[0]?.id; } catch { /* non-JSON ok */ }
      return { status: "SENT", providerId };
    }

    if (p === "twilio") {
      const sid = process.env.TWILIO_ACCOUNT_SID, tok = process.env.TWILIO_AUTH_TOKEN, from = process.env.TWILIO_WHATSAPP_FROM;
      if (!sid || !tok || !from) return { status: "SKIPPED", error: "Twilio WhatsApp not configured" };
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: { Authorization: `Basic ${Buffer.from(`${sid}:${tok}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ From: from, To: `whatsapp:+${withCc(mobile)}`, Body: message }).toString(),
      });
      const body = await res.text().catch(() => "");
      if (!res.ok) return { status: "FAILED", error: `Twilio ${res.status}: ${body.slice(0, 140)}` };
      let providerId: string | undefined;
      try { providerId = (JSON.parse(body) as { sid?: string }).sid; } catch { /* non-JSON ok */ }
      return { status: "SENT", providerId };
    }

    return { status: "SKIPPED", error: `WhatsApp provider "${p}" not supported` };
  } catch (e) {
    return { status: "FAILED", error: (e as Error).message };
  }
}
