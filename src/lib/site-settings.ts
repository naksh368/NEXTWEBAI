import { cache } from "react";
import { z } from "zod";
import { db } from "./db";
import {
  BRAND_ADDRESS_LINES,
  BRAND_EMAIL,
  BRAND_LOGO,
  BRAND_NAME,
  BRAND_PHONE_DISPLAY,
  BRAND_PHONE_E164,
  BRAND_TAGLINE,
} from "./brand";

/**
 * Website content settings.
 *
 * Stored as a single JSON document under BusinessSetting key "site" so an
 * administrator can change the brand copy, hero, contact details, social links
 * and SEO defaults from /admin/settings — no code change, no redeploy. Reads
 * fall back to the compiled defaults in `lib/brand.ts`, so a brand-new database
 * (or a momentary DB outage) still renders a correct, complete site.
 *
 * Nothing here is ever invented at runtime: the review score, traveller count
 * and registration number default to empty and only appear publicly once the
 * agency has entered real, verifiable values.
 */

export const SITE_SETTINGS_KEY = "site";

const socialSchema = z.object({
  facebook: z.string().default(""),
  instagram: z.string().default(""),
  youtube: z.string().default(""),
  x: z.string().default(""),
  linkedin: z.string().default(""),
});

export const siteSettingsSchema = z.object({
  // Brand
  brandName: z.string().default(BRAND_NAME),
  tagline: z.string().default(BRAND_TAGLINE),
  logoUrl: z.string().default(BRAND_LOGO),
  logoUrlLight: z.string().default(""),

  // Hero
  heroEyebrow: z.string().default("Your next island escape"),
  heroHeading: z.string().default("Discover Andaman. Experience More."),
  heroSubheading: z
    .string()
    .default(
      "Explore stunning islands, crystal-clear beaches, unforgettable sightseeing, and thoughtfully planned holiday packages with JST Andaman Travels."
    ),
  heroImage: z.string().default(""),
  heroCtaPrimaryLabel: z.string().default("Explore Packages"),
  heroCtaPrimaryHref: z.string().default("/packages"),
  heroCtaSecondaryLabel: z.string().default("Plan My Trip"),
  heroCtaSecondaryHref: z.string().default("/contact"),

  // Contact
  phonePrimary: z.string().default(BRAND_PHONE_DISPLAY),
  phonePrimaryE164: z.string().default(BRAND_PHONE_E164),
  phoneSecondary: z.string().default(""),
  phoneSecondaryE164: z.string().default(""),
  email: z.string().default(BRAND_EMAIL),
  whatsappEnabled: z.boolean().default(true),
  whatsappE164: z.string().default(BRAND_PHONE_E164),
  addressLines: z.array(z.string()).default([...BRAND_ADDRESS_LINES]),
  officeHours: z.string().default(""),

  // Footer / social
  footerBlurb: z
    .string()
    .default(
      "JST Andaman Travels plans island holidays across Port Blair, Havelock and Neil — accommodation, sightseeing, inter-island transfers and travel assistance, arranged end to end."
    ),
  social: socialSchema.default({ facebook: "", instagram: "", youtube: "", x: "", linkedin: "" }),

  // Announcement bar
  announcementEnabled: z.boolean().default(true),
  announcementText: z
    .string()
    .default("Andaman holiday packages from ₹15,600 per person · 5 nights / 6 days · Min 4 pax"),
  announcementHref: z.string().default("/packages"),

  /**
   * Social proof. Empty/zero by default — the trust strip hides each figure
   * until an administrator enters a real, verifiable number. Never seeded.
   */
  reviewScore: z.number().min(0).max(5).nullable().default(null),
  reviewCount: z.number().int().min(0).nullable().default(null),
  reviewUrl: z.string().default(""),
  travellersServed: z.number().int().min(0).nullable().default(null),
  registrationInfo: z.string().default(""),

  // Package defaults
  defaultMinTravellers: z.number().int().min(1).max(50).default(4),
  promoValidFrom: z.string().default("2026-09-01"),
  promoValidTo: z.string().default("2027-01-31"),
  priceDisclaimer: z
    .string()
    .default(
      "Prices shown are starting rates per person on the stated occupancy and are confirmed by our team before any booking. Ferry, activity and hotel availability may change the final quote."
    ),

  // SEO defaults
  seoTitle: z.string().default("JST Andaman Travels — Andaman holiday packages & island tours"),
  seoDescription: z
    .string()
    .default(
      "Andaman holiday packages, island sightseeing, resort stays and inter-island transfers planned by JST Andaman Travels. Port Blair, Havelock and Neil Island, arranged end to end."
    ),
  seoKeywords: z
    .array(z.string())
    .default([
      "Andaman tour packages",
      "Andaman holiday packages",
      "Port Blair tour",
      "Havelock Island package",
      "Neil Island tour",
      "Radhanagar Beach",
      "Cellular Jail",
      "Andaman travel agency",
    ]),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

/** The compiled defaults — used as the fallback whenever the DB has no row. */
export const DEFAULT_SITE_SETTINGS: SiteSettings = siteSettingsSchema.parse({});

/**
 * Load the live settings (request-deduped). Unknown/removed keys are dropped
 * and missing keys are filled from the defaults, so an older saved document
 * never breaks a newer site.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const row = await db.businessSetting.findUnique({ where: { key: SITE_SETTINGS_KEY } });
    if (!row) return DEFAULT_SITE_SETTINGS;
    const parsed = siteSettingsSchema.safeParse(row.value);
    return parsed.success ? parsed.data : DEFAULT_SITE_SETTINGS;
  } catch (e) {
    console.error("site-settings read failed (using defaults):", (e as Error).message);
    return DEFAULT_SITE_SETTINGS;
  }
});

/** Convenience: the enquiry WhatsApp deep link, or null when disabled. */
export function whatsappLinkFor(s: SiteSettings, message: string): string | null {
  const digits = (s.whatsappE164 || "").replace(/\D/g, "");
  if (!s.whatsappEnabled || !digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** Convenience: tel: link for the primary number, or null when not configured. */
export function telLinkFor(s: SiteSettings): string | null {
  const digits = (s.phonePrimaryE164 || "").replace(/\D/g, "");
  return digits ? `tel:+${digits}` : null;
}

/** Is the promotional validity window still open today? */
export function promoIsActive(s: SiteSettings, now = new Date()): boolean {
  const from = Date.parse(s.promoValidFrom);
  const to = Date.parse(s.promoValidTo);
  if (!Number.isFinite(to)) return true;
  // Treat the end date as inclusive (end of that day).
  const end = to + 24 * 60 * 60 * 1000 - 1;
  if (Number.isFinite(from) && now.getTime() < from) return false;
  return now.getTime() <= end;
}
