/**
 * Legacy contact helpers.
 *
 * Kept as a thin shim so existing imports keep working; the real, editable
 * contact details live in the database (see `lib/site-settings.ts`) with
 * `lib/brand.ts` supplying the compiled fallback.
 */
import { BRAND_PHONE_E164, telHref, whatsappHref } from "./brand";

export const EXPERT_PHONE = BRAND_PHONE_E164.replace(/^91/, "");
export const EXPERT_PHONE_INTL = BRAND_PHONE_E164;

export function whatsappLink(message: string): string {
  return whatsappHref(message);
}

export function telLink(): string {
  return telHref();
}
