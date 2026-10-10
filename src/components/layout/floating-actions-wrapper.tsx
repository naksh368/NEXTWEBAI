import { getSiteSettings, telLinkFor, whatsappLinkFor } from "@/lib/site-settings";
import { FloatingActions } from "./floating-actions";

/** Reads the admin-editable phone and WhatsApp settings for the floating buttons. */
export async function FloatingActionsWrapper() {
  const s = await getSiteSettings();
  const waDigits = (s.whatsappE164 || "").replace(/\D/g, "");
  return (
    <FloatingActions
      telHref={telLinkFor(s)}
      phoneDisplay={s.phonePrimary}
      whatsappHref={whatsappLinkFor(s, `Hello ${s.brandName}, I would like to plan an Andaman holiday.`)}
      whatsappE164={s.whatsappEnabled && waDigits ? waDigits : null}
    />
  );
}
