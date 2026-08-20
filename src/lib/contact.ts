// Central contact details for enquiries. Change here to update site-wide.
export const EXPERT_PHONE = "8700650467";
export const EXPERT_PHONE_INTL = "918700650467"; // +91 for wa.me / tel links

export function whatsappLink(message: string): string {
  return `https://wa.me/${EXPERT_PHONE_INTL}?text=${encodeURIComponent(message)}`;
}

export function telLink(): string {
  return `tel:+${EXPERT_PHONE_INTL}`;
}
