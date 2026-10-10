"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { authorize } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/services/audit-service";
import { refreshPublicSite } from "@/lib/revalidate-site";
import { pageSettingKey, PAGE_SCHEMAS, type PageKey } from "@/lib/page-content";

export type PageResult = { ok: true; message: string; updatedAt?: string } | { ok: false; error: string };

// Saving is strict: a problem is reported, never silently replaced with the
// default text (which is what the read-side schemas do for display).
const line = (label: string, max: number) => z.string().trim().min(1, `${label} cannot be empty.`).max(max, `${label} is too long (max ${max} characters).`);
const optional = (label: string, max: number) => z.string().trim().max(max, `${label} is too long (max ${max} characters).`);
const blocks = (label: string, max: number) =>
  z.array(z.object({ title: line(`${label} title`, 120), body: optional(`${label} text`, 600) })).max(max, `At most ${max} ${label.toLowerCase()}s.`);

const STRICT = {
  home: z.object({
    planEyebrow: optional("Plan section label", 60), planTitle: line("Plan section heading", 120), planText: optional("Plan section text", 600),
    features: blocks("Highlight", 8),
    packagesEyebrow: optional("Packages label", 60), packagesTitle: line("Packages heading", 120), packagesText: optional("Packages text", 600),
    islandsEyebrow: optional("Islands label", 60), islandsTitle: line("Islands heading", 120), islandsText: optional("Islands text", 600),
    servicesEyebrow: optional("Services label", 60), servicesTitle: line("Services heading", 120), servicesText: optional("Services text", 600),
    services: blocks("Service", 12),
    galleryEyebrow: optional("Gallery label", 60), galleryTitle: line("Gallery heading", 120),
    testimonialsEyebrow: optional("Testimonials label", 60), testimonialsTitle: line("Testimonials heading", 120),
    faqEyebrow: optional("FAQ label", 60), faqTitle: line("FAQ heading", 120),
    ctaTitle: line("Closing heading", 120), ctaText: optional("Closing text", 600),
  }),
  about: z.object({
    heading: line("Heading", 120), body: line("Main text", 6000),
    principlesEyebrow: optional("Points label", 60), principlesTitle: line("Points heading", 120), principlesText: optional("Points text", 600),
    principles: blocks("Point", 12),
    ctaTitle: line("Closing heading", 120), ctaText: optional("Closing text", 600),
  }),
  terms: z.object({
    title: line("Page title", 120), intro: optional("Introduction", 600), contactLine: optional("Closing line", 600),
    updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date like 2026-10-10."),
    sections: z
      .array(z.object({ id: z.string().max(40).optional(), heading: z.string().trim().min(1, "A section heading is empty — give every section a heading.").max(160, "A section heading is too long (max 160 characters)."), body: optional("Section text", 8000) }))
      .min(1, "Keep at least one section.")
      .max(40, "At most 40 sections."),
  }),
};
const STRICT_SCHEMAS: Record<PageKey, z.ZodTypeAny> = { home: STRICT.home, about: STRICT.about, terms: STRICT.terms, privacy: STRICT.terms };

const isLegal = (key: PageKey) => key === "terms" || key === "privacy";
const today = () => new Date().toISOString().slice(0, 10);

export async function savePageAction(key: PageKey, data: unknown, bumpDate = true): Promise<PageResult> {
  const admin = await authorize("settings.manage");
  if (!admin) return { ok: false, error: "You do not have permission to edit pages." };
  if (!(key in PAGE_SCHEMAS)) return { ok: false, error: "Unknown page." };

  const input = isLegal(key) && bumpDate ? { ...(data as object), updatedAt: today() } : data;
  const parsed = STRICT_SCHEMAS[key].safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the page and try again." };

  const value = PAGE_SCHEMAS[key].parse(parsed.data);
  await db.businessSetting.upsert({
    where: { key: pageSettingKey(key) },
    create: { key: pageSettingKey(key), value },
    update: { value },
  });
  await writeAudit({ adminUserId: admin.id, action: "page.update", resource: `Page:${key}` });
  refreshPublicSite();
  return { ok: true, message: "Saved — the website shows it now.", updatedAt: isLegal(key) ? (value as { updatedAt: string }).updatedAt : undefined };
}

/** Go back to the site's original text for this page. */
export async function resetPageAction(key: PageKey): Promise<PageResult> {
  const admin = await authorize("settings.manage");
  if (!admin) return { ok: false, error: "You do not have permission to edit pages." };
  await db.businessSetting.deleteMany({ where: { key: pageSettingKey(key) } });
  await writeAudit({ adminUserId: admin.id, action: "page.reset", resource: `Page:${key}` });
  refreshPublicSite();
  return { ok: true, message: "Restored the original text." };
}

const faqList = z
  .array(z.object({
    question: z.string().trim().min(1, "A question is empty — fill it in or remove it.").max(300, "A question is too long (max 300 characters)."),
    answer: z.string().trim().min(1, "An answer is empty — fill it in or remove the question.").max(4000, "An answer is too long (max 4000 characters)."),
  }))
  .max(60, "At most 60 questions.");

/** Replace the general FAQs (the /faq page and the homepage) with this list, in this order. */
export async function saveFaqsAction(items: unknown): Promise<PageResult> {
  const admin = await authorize("settings.manage");
  if (!admin) return { ok: false, error: "You do not have permission to edit FAQs." };
  const parsed = faqList.safeParse(items);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the questions." };

  await db.$transaction([
    db.faq.deleteMany({ where: { scope: "GLOBAL" } }),
    db.faq.createMany({ data: parsed.data.map((f, i) => ({ scope: "GLOBAL", question: f.question, answer: f.answer, sortOrder: i })) }),
  ]);
  await writeAudit({ adminUserId: admin.id, action: "faq.update", resource: "Faq:GLOBAL", after: { count: parsed.data.length } });
  refreshPublicSite();
  return { ok: true, message: `Saved ${parsed.data.length} question${parsed.data.length === 1 ? "" : "s"}.` };
}
