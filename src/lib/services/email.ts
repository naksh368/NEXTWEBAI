/**
 * Transactional email service (Phase 20).
 * - console  : dev, prints the email to console.
 * - zavu     : sends via Zavu.de using EMAIL_API_KEY.
 * All sends are non-blocking — a failure never breaks the primary action.
 */
const provider = () => process.env.EMAIL_PROVIDER || "console";
const apiKey = () => process.env.EMAIL_API_KEY || "";
const from = () => process.env.EMAIL_FROM || "ExpertzTrip <noreply@expertztrip.com>";

export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<{ ok: boolean; error?: string }> {
  try {
    if (provider() === "console") {
      console.log(`\n📧 [EMAIL:console] to ${opts.to}\n   ${opts.subject}\n`);
      return { ok: true };
    }
    if (provider() === "zavu") {
      const res = await fetch("https://api.zavu.de/v1/email/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: from(),
          to: opts.to,
          subject: opts.subject,
          html: opts.html
        }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        return { ok: false, error: `Zavu ${res.status}: ${t.slice(0, 200)}` };
      }
      return { ok: true };
    }
    return { ok: false, error: `Email provider "${provider()}" not configured. Set EMAIL_PROVIDER and EMAIL_API_KEY.` };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Branded HTML wrapper — inline styles for email-client compatibility. */
export function emailLayout(heading: string, bodyHtml: string, cta?: { label: string; href: string }): string {
  const button = cta
    ? `<tr><td style="padding:8px 0 4px"><a href="${cta.href}" style="display:inline-block;background:#FF6A1A;color:#fff;text-decoration:none;font-weight:800;font-size:15px;padding:12px 22px;border-radius:12px">${cta.label}</a></td></tr>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#F6F7FB;font-family:'Nunito',Segoe UI,system-ui,Arial,sans-serif;color:#16171C">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 16px">
    <table role="presentation" width="100%" style="max-width:520px;background:#fff;border:1px solid #E6E9F1;border-radius:16px;overflow:hidden">
      <tr><td style="padding:22px 28px;border-bottom:2px solid #2340D9">
        <span style="font-size:22px;font-weight:800;letter-spacing:-.02em"><span style="color:#2340D9">expertz</span><span style="color:#FF6A1A">trip</span></span>
      </td></tr>
      <tr><td style="padding:26px 28px 8px">
        <h1 style="margin:0 0 10px;font-size:20px;font-weight:800;color:#16171C">${heading}</h1>
        <div style="font-size:15px;line-height:1.6;color:#3a3f4b">${bodyHtml}</div>
      </td></tr>
      <tr><td style="padding:8px 28px 24px"><table role="presentation">${button}</table></td></tr>
      <tr><td style="padding:16px 28px;border-top:1px solid #E6E9F1;font-size:12px;color:#8A8F9E">
        Real holiday packages · clear pricing · expert support.<br>© ${new Date().getFullYear()} ExpertzTrip.
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

/** One-time login code email (the customer + admin login channel). */
export async function sendOtpEmail(to: string, code: string, minutes = 5) {
  return sendEmail({
    to,
    subject: `${code} is your ExpertzTrip verification code`,
    html: emailLayout(
      "Your verification code",
      `Enter this code to sign in to ExpertzTrip:
       <div style="font-size:34px;font-weight:800;letter-spacing:10px;color:#2340D9;margin:18px 0">${code}</div>
       It's valid for ${minutes} minutes. If you didn't request this, you can safely ignore this email.`
    ),
  });
}

// Per-event email bodies now live in the central notification service
// (src/lib/services/notifications.ts), which composes them via `emailLayout`.
