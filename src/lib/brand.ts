/**
 * JST Andaman Travels — single source of truth for brand identity and the
 * business's public contact details.
 *
 * Everything here is a *fallback*. The live values are stored in the database
 * (BusinessSetting key "site") and edited by an administrator at
 * /admin/settings, so the agency can change its phone number, address or
 * tagline without a code change or redeploy. `getSiteSettings()` in
 * `lib/site-settings.ts` merges the saved values over these defaults.
 */

export const BRAND_NAME = "JST Andaman Travels";
export const BRAND_SHORT = "JST Andaman";
export const BRAND_TAGLINE = "Discover Andaman. Experience More.";

/** Transparent PNG/WebP wordmark supplied by the agency (1536 × 1024). */
export const BRAND_LOGO = "/brand/jst-andaman-travels-logo.webp";
export const BRAND_LOGO_WIDTH = 1536;
export const BRAND_LOGO_HEIGHT = 1024;

/**
 * Registered office / walk-in address.
 *
 * Spelling and capitalisation were normalised from the agency's supplied copy
 * ("PONGY CHOUNG, near CO-OPARATIVE BANK …"): "Co-oparative" → "Co-operative",
 * block capitals → title case, and a country line added for postal clarity.
 */
export const BRAND_ADDRESS_LINES = [
  "Pongy Chaung, near Co-operative Bank",
  "Near Light House, DAG Colony",
  "Sri Vijaya Puram (Port Blair)",
  "Andaman & Nicobar Islands 744101, India",
] as const;

export const BRAND_ADDRESS = BRAND_ADDRESS_LINES.join(", ");

/** National format for display; E.164 digits for tel:/wa.me links. */
export const BRAND_PHONE_DISPLAY = "+91 94342 84365";
export const BRAND_PHONE_E164 = "919434284365";

/** Public enquiry inbox. Overridden by the admin "Contact details" settings. */
export const BRAND_EMAIL = "";

/** Brand palette — mirrors tailwind.config.ts so non-Tailwind surfaces match. */
export const BRAND_COLORS = {
  navy: "#102B4E",
  blue: "#087EBA",
  turquoise: "#18B8CE",
  orange: "#F26535",
  white: "#FFFFFF",
  softBg: "#F6F9FC",
  text: "#172B45",
  textMuted: "#63748A",
  border: "#E2EAF1",
} as const;

/** The islands and sights JST sells. Used for SEO keywords and quick-pick UI. */
export const ANDAMAN_PLACES = [
  "Port Blair",
  "Havelock Island",
  "Neil Island",
  "Radhanagar Beach",
  "Kalapathar Beach",
  "Ross Island",
  "North Bay Island",
  "Cellular Jail",
] as const;

export function telHref(e164 = BRAND_PHONE_E164): string {
  return `tel:+${e164}`;
}

export function whatsappHref(message: string, e164 = BRAND_PHONE_E164): string {
  return `https://wa.me/${e164}?text=${encodeURIComponent(message)}`;
}

/** Google Maps search link for the office — opens the address, never a guess at coordinates. */
export function mapsHref(address = BRAND_ADDRESS): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
