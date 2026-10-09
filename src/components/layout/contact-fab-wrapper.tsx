import { getSiteSettings, telLinkFor, whatsappLinkFor } from "@/lib/site-settings";
import { ContactFab } from "./contact-fab";

export async function ContactFabWrapper() {
  const s = await getSiteSettings();
  return (
    <ContactFab
      telHref={telLinkFor(s)}
      whatsappHref={whatsappLinkFor(s, `Hello ${s.brandName}, I would like to plan an Andaman holiday.`)}
    />
  );
}
