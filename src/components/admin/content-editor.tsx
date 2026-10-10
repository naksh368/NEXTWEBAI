"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  AlertTriangle, Check, Image as ImageIcon, Loader2, Megaphone, Phone, RotateCcw, Search, Tag, X,
} from "lucide-react";
import { Panel } from "@/components/admin/ui";
import { MediaUploader } from "@/components/admin/media-library";
import {
  resetSiteSettingsAction, saveBrandContentAction, saveContactContentAction,
  saveHeroContentAction, savePricingContentAction, saveSeoContentAction,
  type ContentResult,
} from "@/app/admin/(panel)/content/actions";
import type { SiteSettings } from "@/lib/site-settings";
import { cn } from "@/lib/utils";

const inp =
  "h-10 w-full rounded-xl border border-surface-border bg-white px-3 text-sm text-ink " +
  "focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10";
const area =
  "w-full rounded-xl border border-surface-border bg-white px-3 py-2.5 text-sm text-ink " +
  "focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10";

const TABS = [
  { key: "brand", label: "Brand", Icon: Tag },
  { key: "hero", label: "Homepage hero", Icon: Megaphone },
  { key: "contact", label: "Contact details", Icon: Phone },
  { key: "pricing", label: "Pricing & trust", Icon: ImageIcon },
  { key: "seo", label: "SEO", Icon: Search },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function ContentEditor({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("brand");
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl);
  const [heroImage, setHeroImage] = useState(settings.heroImage);

  const submit = (action: (fd: FormData) => Promise<ContentResult>, extra?: Record<string, string>) =>
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      if (extra) for (const [k, v] of Object.entries(extra)) fd.set(k, v);
      startTransition(async () => {
        const res = await action(fd);
        setFlash(res.ok ? { tone: "ok", text: res.message } : { tone: "err", text: res.error });
        router.refresh();
        setTimeout(() => setFlash(null), 5000);
      });
    };

  const SaveBar = ({ label = "Save changes" }: { label?: string }) => (
    <div className="flex items-center gap-3 border-t border-surface-border pt-4">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-blue px-6 text-sm font-bold text-white transition-colors hover:bg-brand-blueDark disabled:opacity-50"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} {label}
      </button>
      <p className="text-xs text-ink-muted">Changes go live on the public site straight away.</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {flash && (
        <div
          role="status"
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold",
            flash.tone === "ok" ? "bg-[#E7F6EC] text-success" : "bg-[#FCE9E9] text-danger"
          )}
        >
          {flash.tone === "ok" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />} {flash.text}
        </div>
      )}

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-current={tab === key ? "true" : undefined}
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition-colors",
              tab === key
                ? "border-brand-blue bg-brand-blue text-white"
                : "border-surface-border bg-white text-ink-muted hover:border-brand-blue hover:text-brand-blue"
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── BRAND ─────────────────────────────────────────── */}
      {tab === "brand" && (
        <Panel title="Brand">
          <form className="space-y-5 p-5" onSubmit={submit(saveBrandContentAction, { logoUrl })}>
            <div className="grid gap-5 sm:grid-cols-[200px_1fr]">
              <div>
                <Label>Logo</Label>
                <div className="relative mb-2 flex aspect-[3/2] items-center justify-center overflow-hidden rounded-xl border border-surface-border bg-white p-3">
                  {logoUrl ? (
                    <Image src={logoUrl} alt="Current logo" fill sizes="200px" className="object-contain p-3" unoptimized />
                  ) : (
                    <span className="text-xs text-ink-faint">No logo set</span>
                  )}
                </div>
                <MediaUploader compact onUploaded={(u) => setLogoUrl(u)} />
                <input className={cn(inp, "mt-2")} value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} aria-label="Logo URL" />
              </div>

              <div className="space-y-4">
                <Field label="Brand name" hint="Used in the page titles, emails and the footer.">
                  <input name="brandName" className={inp} defaultValue={settings.brandName} required />
                </Field>
                <Field label="Tagline">
                  <input name="tagline" className={inp} defaultValue={settings.tagline} />
                </Field>
                <Field label="Logo for dark backgrounds" hint="Optional. Leave blank to keep using the main logo on a white chip.">
                  <input name="logoUrlLight" className={inp} defaultValue={settings.logoUrlLight} placeholder="/api/media/…" />
                </Field>
                <Field label="Powered by" hint={'Shown as "Powered by …" at the bottom of every page. Leave blank to hide it.'}>
                  <input name="poweredBy" className={inp} defaultValue={settings.poweredBy} />
                </Field>
                <Field label="Footer introduction" hint="The short paragraph under the logo in the footer.">
                  <textarea name="footerBlurb" rows={3} className={area} defaultValue={settings.footerBlurb} />
                </Field>
              </div>
            </div>
            <SaveBar />
          </form>
        </Panel>
      )}

      {/* ── HERO ──────────────────────────────────────────── */}
      {tab === "hero" && (
        <Panel title="Homepage hero & announcement bar">
          <form className="space-y-5 p-5" onSubmit={submit(saveHeroContentAction, { heroImage })}>
            <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
              <div>
                <Label>Hero photograph</Label>
                <div className="relative mb-2 aspect-[4/3] overflow-hidden rounded-xl border border-surface-border bg-surface-muted">
                  {heroImage ? (
                    <Image src={heroImage} alt="Hero" fill sizes="260px" className="object-cover" unoptimized />
                  ) : (
                    <span className="flex h-full items-center justify-center px-3 text-center text-xs text-ink-faint">
                      None set — the first gallery photograph is used instead
                    </span>
                  )}
                </div>
                <MediaUploader compact onUploaded={(u) => setHeroImage(u)} />
                <div className="mt-2 flex gap-2">
                  <input className={inp} value={heroImage} onChange={(e) => setHeroImage(e.target.value)} aria-label="Hero image URL" placeholder="/api/media/…" />
                  {heroImage && (
                    <button type="button" onClick={() => setHeroImage("")} className="h-10 shrink-0 rounded-xl border border-surface-border px-3 text-sm font-bold text-ink-muted hover:border-danger hover:text-danger">
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Field label="Eyebrow" hint="The small line above the heading.">
                  <input name="heroEyebrow" className={inp} defaultValue={settings.heroEyebrow} />
                </Field>
                <Field label="Heading">
                  <input name="heroHeading" className={inp} defaultValue={settings.heroHeading} />
                </Field>
                <Field label="Supporting paragraph">
                  <textarea name="heroSubheading" rows={3} className={area} defaultValue={settings.heroSubheading} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Primary button text">
                    <input name="heroCtaPrimaryLabel" className={inp} defaultValue={settings.heroCtaPrimaryLabel} />
                  </Field>
                  <Field label="Primary button link">
                    <input name="heroCtaPrimaryHref" className={inp} defaultValue={settings.heroCtaPrimaryHref} />
                  </Field>
                  <Field label="Secondary button text">
                    <input name="heroCtaSecondaryLabel" className={inp} defaultValue={settings.heroCtaSecondaryLabel} />
                  </Field>
                  <Field label="Secondary button link">
                    <input name="heroCtaSecondaryHref" className={inp} defaultValue={settings.heroCtaSecondaryHref} />
                  </Field>
                </div>
              </div>
            </div>

            <fieldset className="rounded-xl border border-surface-border p-4">
              <legend className="px-2 text-xs font-bold uppercase tracking-wide text-ink-faint">Announcement bar</legend>
              <label className="flex items-center gap-2.5 text-sm font-semibold text-ink">
                <input type="checkbox" name="announcementEnabled" defaultChecked={settings.announcementEnabled} className="h-4 w-4 rounded border-surface-border text-brand-blue focus:ring-brand-blue" />
                Show the bar at the top of every public page
              </label>
              <div className="mt-4 grid gap-4 sm:grid-cols-[2fr_1fr]">
                <Field label="Message" hint="Write {price} where the lowest package price should go — it updates itself whenever you change a price.">
                  <input name="announcementText" className={inp} defaultValue={settings.announcementText} maxLength={200} />
                </Field>
                <Field label="Link">
                  <input name="announcementHref" className={inp} defaultValue={settings.announcementHref} placeholder="/packages" />
                </Field>
              </div>
            </fieldset>

            <SaveBar />
          </form>
        </Panel>
      )}

      {/* ── CONTACT ───────────────────────────────────────── */}
      {tab === "contact" && (
        <Panel title="Contact details">
          <form className="space-y-5 p-5" onSubmit={submit(saveContactContentAction)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone (as displayed)">
                <input name="phonePrimary" className={inp} defaultValue={settings.phonePrimary} placeholder="+91 94342 84365" />
              </Field>
              <Field label="Phone digits for tel: links" hint="Country code and number, digits only — e.g. 919434284365.">
                <input name="phonePrimaryE164" className={inp} defaultValue={settings.phonePrimaryE164} inputMode="numeric" />
              </Field>
              <Field label="Second phone (optional)">
                <input name="phoneSecondary" className={inp} defaultValue={settings.phoneSecondary} />
              </Field>
              <Field label="Second phone digits (optional)">
                <input name="phoneSecondaryE164" className={inp} defaultValue={settings.phoneSecondaryE164} inputMode="numeric" />
              </Field>
              <Field label="Public email" hint="Shown in the footer and on the contact page. Leave blank to hide it.">
                <input name="email" type="email" className={inp} defaultValue={settings.email} />
              </Field>
              <Field label="Office hours (optional)">
                <input name="officeHours" className={inp} defaultValue={settings.officeHours} placeholder="Mon – Sat, 9:00 am – 7:00 pm IST" />
              </Field>
            </div>

            <fieldset className="rounded-xl border border-surface-border p-4">
              <legend className="px-2 text-xs font-bold uppercase tracking-wide text-ink-faint">WhatsApp</legend>
              <label className="flex items-center gap-2.5 text-sm font-semibold text-ink">
                <input type="checkbox" name="whatsappEnabled" defaultChecked={settings.whatsappEnabled} className="h-4 w-4 rounded border-surface-border text-brand-blue focus:ring-brand-blue" />
                Show WhatsApp links across the site
              </label>
              <div className="mt-4">
                <Field label="WhatsApp number" hint="Digits only, including the country code.">
                  <input name="whatsappE164" className={inp} defaultValue={settings.whatsappE164} inputMode="numeric" />
                </Field>
              </div>
            </fieldset>

            <Field label="Address" hint="One line per row. Shown in the footer, on the contact page and in the map link.">
              <textarea name="addressLines" rows={5} className={area} defaultValue={settings.addressLines.join("\n")} />
            </Field>

            <fieldset className="rounded-xl border border-surface-border p-4">
              <legend className="px-2 text-xs font-bold uppercase tracking-wide text-ink-faint">Social links</legend>
              <p className="mb-3 text-xs text-ink-muted">Leave a field blank to hide that icon. Paste the full URL.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Facebook"><input name="facebook" className={inp} defaultValue={settings.social.facebook} placeholder="https://facebook.com/…" /></Field>
                <Field label="Instagram"><input name="instagram" className={inp} defaultValue={settings.social.instagram} placeholder="https://instagram.com/…" /></Field>
                <Field label="YouTube"><input name="youtube" className={inp} defaultValue={settings.social.youtube} /></Field>
                <Field label="LinkedIn"><input name="linkedin" className={inp} defaultValue={settings.social.linkedin} /></Field>
                <Field label="X / Twitter"><input name="x" className={inp} defaultValue={settings.social.x} /></Field>
              </div>
            </fieldset>

            <SaveBar />
          </form>
        </Panel>
      )}

      {/* ── PRICING & TRUST ───────────────────────────────── */}
      {tab === "pricing" && (
        <Panel title="Pricing defaults & trust figures">
          <form className="space-y-5 p-5" onSubmit={submit(savePricingContentAction)}>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Default minimum travellers" hint="Shown as the “MIN n PAX” note.">
                <input name="defaultMinTravellers" type="number" min={1} max={50} className={inp} defaultValue={settings.defaultMinTravellers} />
              </Field>
              <Field label="Promotion valid from">
                <input name="promoValidFrom" type="date" className={inp} defaultValue={settings.promoValidFrom} />
              </Field>
              <Field label="Promotion valid until" hint="After this date the promotional banner is replaced with an “ask us for current rates” note.">
                <input name="promoValidTo" type="date" className={inp} defaultValue={settings.promoValidTo} />
              </Field>
            </div>

            <Field label="Price disclaimer" hint="Shown under the package grid and on every package page.">
              <textarea name="priceDisclaimer" rows={3} className={area} defaultValue={settings.priceDisclaimer} />
            </Field>

            <fieldset className="rounded-xl border border-warning/30 bg-[#FDF6E9] p-4">
              <legend className="px-2 text-xs font-bold uppercase tracking-wide text-warning">Social proof</legend>
              <p className="mb-4 flex items-start gap-2 text-xs leading-relaxed text-ink">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                Only enter figures you can evidence. Each one is hidden on the site while it is blank — never
                estimate a rating, a review count or a traveller number.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Google review score" hint="0–5, exactly as Google shows it. Blank = hidden.">
                  <input name="reviewScore" type="number" step="0.1" min={0} max={5} className={inp} defaultValue={settings.reviewScore ?? ""} placeholder="Blank = hidden" />
                </Field>
                <Field label="Number of reviews">
                  <input name="reviewCount" type="number" min={0} className={inp} defaultValue={settings.reviewCount ?? ""} placeholder="Blank = hidden" />
                </Field>
                <Field label="Link to your reviews (optional, not shown)">
                  <input name="reviewUrl" className={inp} defaultValue={settings.reviewUrl} placeholder="https://maps.app.goo.gl/…" />
                </Field>
                <Field label="Travellers hosted">
                  <input name="travellersServed" type="number" min={0} className={inp} defaultValue={settings.travellersServed ?? ""} placeholder="Blank = hidden" />
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Registration / licence details" hint="e.g. a tourism registration number. Appears in the trust strip and the footer.">
                  <input name="registrationInfo" className={inp} defaultValue={settings.registrationInfo} placeholder="Blank = hidden" />
                </Field>
              </div>
            </fieldset>

            <SaveBar />
          </form>
        </Panel>
      )}

      {/* ── SEO ───────────────────────────────────────────── */}
      {tab === "seo" && (
        <Panel title="SEO defaults">
          <form className="space-y-5 p-5" onSubmit={submit(saveSeoContentAction)}>
            <Field label="Default page title" hint="Used on the homepage and as the template suffix on every other page.">
              <input name="seoTitle" className={inp} defaultValue={settings.seoTitle} maxLength={70} />
            </Field>
            <Field label="Default meta description" hint="Aim for 140–160 characters.">
              <textarea name="seoDescription" rows={3} className={area} defaultValue={settings.seoDescription} maxLength={320} />
            </Field>
            <Field label="Keywords" hint="Comma separated.">
              <textarea name="seoKeywords" rows={3} className={area} defaultValue={settings.seoKeywords.join(", ")} />
            </Field>
            <SaveBar label="Save SEO defaults" />
          </form>
        </Panel>
      )}

      <Panel title="Reset">
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-muted">
            Put every website content setting back to the shipped defaults. Packages, enquiries, the gallery and
            testimonials are not affected.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!confirm("Reset all website content settings to the defaults? Your brand copy, contact details and SEO text will be overwritten.")) return;
              startTransition(async () => {
                const res = await resetSiteSettingsAction();
                setFlash(res.ok ? { tone: "ok", text: res.message } : { tone: "err", text: res.error });
                router.refresh();
                setTimeout(() => setFlash(null), 5000);
              });
            }}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-danger/30 px-4 text-sm font-bold text-danger transition-colors hover:bg-[#FCE9E9] disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" /> Reset to defaults
          </button>
        </div>
      </Panel>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-ink-faint">{children}</span>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      {children}
      {hint && <span className="mt-1 block text-xs leading-relaxed text-ink-muted">{hint}</span>}
    </label>
  );
}
