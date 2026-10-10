"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { authorize } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/services/audit-service";
import { DEFAULT_SITE_SETTINGS, SITE_SETTINGS_KEY, siteSettingsSchema, type SiteSettings } from "@/lib/site-settings";

/**
 * Website content settings.
 *
 * Each tab of /admin/content saves one slice of the single "site" settings
 * document. We read the current document, merge the submitted slice over it and
 * re-validate the whole thing, so a partial save can never leave the document
 * in a shape the public site cannot read.
 */

export type ContentResult = { ok: true; message: string } | { ok: false; error: string };

const str = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const bool = (v: FormDataEntryValue | null) => v === "on" || v === "true";
const digits = (v: FormDataEntryValue | null) => String(v ?? "").replace(/\D/g, "");

/** An optional number field: blank means "not published", not zero. */
function optionalNumber(v: FormDataEntryValue | null): number | null {
  const raw = String(v ?? "").trim();
  if (!raw) return null;
  const n = Number(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Split a textarea into trimmed, non-empty lines. */
function lines(v: FormDataEntryValue | null): string[] {
  return String(v ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

async function readCurrent(): Promise<SiteSettings> {
  const row = await db.businessSetting.findUnique({ where: { key: SITE_SETTINGS_KEY } });
  if (!row) return DEFAULT_SITE_SETTINGS;
  const parsed = siteSettingsSchema.safeParse(row.value);
  return parsed.success ? parsed.data : DEFAULT_SITE_SETTINGS;
}

/** Merge a slice over the saved document, validate, persist and revalidate. */
async function save(
  patch: Partial<SiteSettings>,
  action: string,
  successMessage: string
): Promise<ContentResult> {
  const admin = await authorize("settings.manage");
  if (!admin) return { ok: false, error: "You do not have permission to change website content." };

  const before = await readCurrent();
  const parsed = siteSettingsSchema.safeParse({ ...before, ...patch });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the values and try again." };
  }

  await db.businessSetting.upsert({
    where: { key: SITE_SETTINGS_KEY },
    create: { key: SITE_SETTINGS_KEY, value: parsed.data },
    update: { value: parsed.data },
  });

  await writeAudit({
    adminUserId: admin.id,
    action,
    resource: `Settings:${SITE_SETTINGS_KEY}`,
    before: patch ? Object.fromEntries(Object.keys(patch).map((k) => [k, (before as Record<string, unknown>)[k]])) : null,
    after: patch,
  });

  // Settings touch every page, so refresh the whole public tree.
  revalidatePath("/", "layout");
  revalidatePath("/admin/content");
  return { ok: true, message: successMessage };
}

export async function saveBrandContentAction(formData: FormData): Promise<ContentResult> {
  return save(
    {
      brandName: str(formData.get("brandName")) || DEFAULT_SITE_SETTINGS.brandName,
      tagline: str(formData.get("tagline")),
      logoUrl: str(formData.get("logoUrl")) || DEFAULT_SITE_SETTINGS.logoUrl,
      logoUrlLight: str(formData.get("logoUrlLight")),
      poweredBy: str(formData.get("poweredBy")),
      footerBlurb: str(formData.get("footerBlurb")),
    },
    "settings.brand.update",
    "Brand details saved."
  );
}

export async function saveHeroContentAction(formData: FormData): Promise<ContentResult> {
  return save(
    {
      heroEyebrow: str(formData.get("heroEyebrow")),
      heroHeading: str(formData.get("heroHeading")),
      heroSubheading: str(formData.get("heroSubheading")),
      heroImage: str(formData.get("heroImage")),
      heroCtaPrimaryLabel: str(formData.get("heroCtaPrimaryLabel")) || DEFAULT_SITE_SETTINGS.heroCtaPrimaryLabel,
      heroCtaPrimaryHref: str(formData.get("heroCtaPrimaryHref")) || DEFAULT_SITE_SETTINGS.heroCtaPrimaryHref,
      heroCtaSecondaryLabel: str(formData.get("heroCtaSecondaryLabel")) || DEFAULT_SITE_SETTINGS.heroCtaSecondaryLabel,
      heroCtaSecondaryHref: str(formData.get("heroCtaSecondaryHref")) || DEFAULT_SITE_SETTINGS.heroCtaSecondaryHref,
      announcementEnabled: bool(formData.get("announcementEnabled")),
      announcementText: str(formData.get("announcementText")),
      announcementHref: str(formData.get("announcementHref")),
    },
    "settings.hero.update",
    "Homepage hero saved."
  );
}

export async function saveContactContentAction(formData: FormData): Promise<ContentResult> {
  return save(
    {
      phonePrimary: str(formData.get("phonePrimary")),
      phonePrimaryE164: digits(formData.get("phonePrimaryE164")),
      phoneSecondary: str(formData.get("phoneSecondary")),
      phoneSecondaryE164: digits(formData.get("phoneSecondaryE164")),
      email: str(formData.get("email")),
      whatsappEnabled: bool(formData.get("whatsappEnabled")),
      whatsappE164: digits(formData.get("whatsappE164")),
      addressLines: lines(formData.get("addressLines")),
      officeHours: str(formData.get("officeHours")),
      social: {
        facebook: str(formData.get("facebook")),
        instagram: str(formData.get("instagram")),
        youtube: str(formData.get("youtube")),
        x: str(formData.get("x")),
        linkedin: str(formData.get("linkedin")),
      },
    },
    "settings.contact.update",
    "Contact details saved."
  );
}

export async function savePricingContentAction(formData: FormData): Promise<ContentResult> {
  const score = optionalNumber(formData.get("reviewScore"));
  const count = optionalNumber(formData.get("reviewCount"));
  const travellers = optionalNumber(formData.get("travellersServed"));

  // The badge is display-only; the reviews link is optional and kept for reference.
  const reviewUrl = str(formData.get("reviewUrl"));
  if (score === null && count !== null) {
    return { ok: false, error: "Enter the review score as well as the number of reviews, or leave both blank." };
  }
  if (reviewUrl && !/^https:\/\//.test(reviewUrl)) {
    return { ok: false, error: "The reviews link must start with https://" };
  }
  if (score !== null && (score < 0 || score > 5)) {
    return { ok: false, error: "The review score must be between 0 and 5." };
  }

  return save(
    {
      defaultMinTravellers: Math.max(1, Math.min(50, Number(optionalNumber(formData.get("defaultMinTravellers")) ?? 4))),
      promoValidFrom: str(formData.get("promoValidFrom")),
      promoValidTo: str(formData.get("promoValidTo")),
      priceDisclaimer: str(formData.get("priceDisclaimer")) || DEFAULT_SITE_SETTINGS.priceDisclaimer,
      reviewScore: score,
      reviewCount: count === null ? null : Math.round(count),
      reviewUrl,
      travellersServed: travellers === null ? null : Math.round(travellers),
      registrationInfo: str(formData.get("registrationInfo")),
    },
    "settings.pricing.update",
    "Pricing and trust settings saved."
  );
}

export async function saveSeoContentAction(formData: FormData): Promise<ContentResult> {
  return save(
    {
      seoTitle: str(formData.get("seoTitle")) || DEFAULT_SITE_SETTINGS.seoTitle,
      seoDescription: str(formData.get("seoDescription")) || DEFAULT_SITE_SETTINGS.seoDescription,
      seoKeywords: String(formData.get("seoKeywords") ?? "")
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    },
    "settings.seo.update",
    "SEO defaults saved."
  );
}

/** Restore every website content setting to the shipped defaults. */
export async function resetSiteSettingsAction(): Promise<ContentResult> {
  const admin = await authorize("settings.manage");
  if (!admin) return { ok: false, error: "You do not have permission to change website content." };

  const before = await readCurrent();
  await db.businessSetting.upsert({
    where: { key: SITE_SETTINGS_KEY },
    create: { key: SITE_SETTINGS_KEY, value: DEFAULT_SITE_SETTINGS },
    update: { value: DEFAULT_SITE_SETTINGS },
  });
  await writeAudit({ adminUserId: admin.id, action: "settings.reset", resource: `Settings:${SITE_SETTINGS_KEY}`, before });
  revalidatePath("/", "layout");
  revalidatePath("/admin/content");
  return { ok: true, message: "Website content reset to the defaults." };
}
