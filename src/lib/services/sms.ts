/**
 * SMS delivery (Phase 13). Provider-agnostic sender selected by SMS_PROVIDER.
 * - console  : dev — prints the message (no cost).
 * - msg91    : India — uses the Flow API with a DLT template + variables.
 * - fast2sms : India — OTP route (code only) or DLT route with a template.
 *
 * Note: in India, transactional/OTP SMS needs a DLT-approved template and
 * sender header. Set the template id(s) in env once approved.
 */
const provider = () => process.env.SMS_PROVIDER || "console";
// MSG91 auth key (preferred), falling back to the generic SMS_API_KEY slot.
const apiKey = () => process.env.MSG91_AUTH_KEY || process.env.SMS_API_KEY || "";
const sender = () => process.env.SMS_SENDER_ID || "EXPRTZ";

const onlyDigits = (e164: string) => e164.replace(/[^\d]/g, ""); // 918700650467
const tenDigit = (e164: string) => onlyDigits(e164).replace(/^91/, "");

async function msg91Flow(mobile: string, templateId: string, vars: Record<string, string>) {
  if (!templateId) throw new Error("MSG91 template id is not configured.");
  const res = await fetch("https://control.msg91.com/api/v5/flow/", {
    method: "POST",
    headers: { authkey: apiKey(), "Content-Type": "application/json" },
    body: JSON.stringify({ template_id: templateId, sender: sender(), short_url: "0", recipients: [{ mobiles: onlyDigits(mobile), ...vars }] }),
  });
  if (!res.ok) throw new Error(`MSG91 send failed (${res.status})`);
}

async function fast2smsOtp(mobile: string, code: string) {
  const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: { authorization: apiKey(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ route: "otp", variables_values: code, numbers: tenDigit(mobile) }).toString(),
  });
  if (!res.ok) throw new Error(`Fast2SMS send failed (${res.status})`);
}

/** Send an OTP. `message` is the full branded text used by the console provider. */
export async function sendOtpSms(mobile: string, code: string, message: string) {
  switch (provider()) {
    case "console":
      console.log(`\n📱 [SMS:console] to ${mobile} · sender ${sender()}\n   ${message}\n`);
      return;
    case "msg91":
      return msg91Flow(mobile, process.env.MSG91_OTP_TEMPLATE_ID || "", { OTP: code });
    case "fast2sms":
      return fast2smsOtp(mobile, code);
    default:
      throw new Error(`SMS provider "${provider()}" is not configured.`);
  }
}

/** Send a non-OTP transactional text (e.g. welcome). Non-critical: never throws. */
export async function sendTextSms(mobile: string, message: string, vars: Record<string, string> = {}) {
  try {
    switch (provider()) {
      case "console":
        console.log(`\n📱 [SMS:console] to ${mobile}\n   ${message}\n`);
        return;
      case "msg91": {
        const tpl = process.env.MSG91_WELCOME_TEMPLATE_ID;
        if (tpl) await msg91Flow(mobile, tpl, vars);
        return;
      }
      // fast2sms branded text needs a DLT template — skip unless configured.
      default:
        return;
    }
  } catch (e) {
    console.error("welcome SMS failed:", (e as Error).message);
  }
}

export type SmsResult = { status: "SENT" | "SKIPPED" | "FAILED"; providerId?: string; error?: string };

/**
 * Generic transactional SMS for the notification/event system. Returns a real
 * delivery outcome — never throws, never fakes success. In India a DLT-approved
 * MSG91 template is required: set MSG91_TXN_TEMPLATE_ID (a template whose single
 * variable carries the message). Without it we honestly report SKIPPED
 * (configuration required) rather than pretend the SMS was sent.
 */
export async function sendTransactionalSms(mobile: string, message: string): Promise<SmsResult> {
  try {
    switch (provider()) {
      case "console":
        console.log(`\n📱 [SMS:console] to ${mobile}\n   ${message}\n`);
        return { status: "SENT" };
      case "msg91": {
        const tpl = process.env.MSG91_TXN_TEMPLATE_ID;
        if (!tpl) return { status: "SKIPPED", error: "MSG91_TXN_TEMPLATE_ID not configured" };
        const res = await fetch("https://control.msg91.com/api/v5/flow/", {
          method: "POST",
          headers: { authkey: apiKey(), "Content-Type": "application/json" },
          body: JSON.stringify({ template_id: tpl, sender: sender(), short_url: "0", recipients: [{ mobiles: onlyDigits(mobile), message, var: message }] }),
        });
        const bodyText = await res.text().catch(() => "");
        if (!res.ok) return { status: "FAILED", error: `MSG91 ${res.status}: ${bodyText.slice(0, 120)}` };
        let providerId: string | undefined;
        try { providerId = (JSON.parse(bodyText) as { request_id?: string }).request_id; } catch { /* non-JSON ok */ }
        return { status: "SENT", providerId };
      }
      default:
        return { status: "SKIPPED", error: `SMS provider "${provider()}" has no transactional template configured` };
    }
  } catch (e) {
    return { status: "FAILED", error: (e as Error).message };
  }
}
