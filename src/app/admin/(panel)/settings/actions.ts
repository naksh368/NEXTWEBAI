"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { authorize } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/services/audit-service";
import { ANDAMAN_DESTINATIONS } from "@/lib/data/destinations";
import { slugify } from "@/lib/utils";

const str = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const num = (v: FormDataEntryValue | null) => { const n = Number(String(v ?? "").replace(/[^\d.]/g, "")); return Number.isFinite(n) ? n : 0; };

/** Update brand contact settings (name, support email/phone). */
export async function updateBrandSettingsAction(formData: FormData): Promise<void> {
  const admin = await authorize("settings.manage");
  if (!admin) return;
  const value = { name: str(formData.get("name")) || "JST Andaman Travels", supportEmail: str(formData.get("supportEmail")), supportPhone: str(formData.get("supportPhone")) };
  await db.businessSetting.upsert({ where: { key: "brand" }, create: { key: "brand", value }, update: { value } });
  await writeAudit({ adminUserId: admin.id, action: "settings.brand.update", resource: "Settings:brand", after: value });
  revalidatePath("/admin/settings");
}

/** Update checkout settings (tax rate %, currency). */
export async function updateCheckoutSettingsAction(formData: FormData): Promise<void> {
  const admin = await authorize("settings.manage");
  if (!admin) return;
  const value = { taxRatePct: Math.max(0, Math.min(100, num(formData.get("taxRatePct")))), currency: str(formData.get("currency")) || "INR" };
  await db.businessSetting.upsert({ where: { key: "checkout" }, create: { key: "checkout", value }, update: { value } });
  await writeAudit({ adminUserId: admin.id, action: "settings.checkout.update", resource: "Settings:checkout", after: value });
  revalidatePath("/admin/settings");
}

/** Idempotently add the Andaman destinations JST sells (never overwrites copy). */
export async function seedDestinationsAction(): Promise<{ ok: true; added: number; updated: number } | { ok: false; error: string }> {
  const admin = await authorize("destination.manage");
  if (!admin) return { ok: false, error: "Not authorized." };

  let added = 0, updated = 0;
  for (let i = 0; i < ANDAMAN_DESTINATIONS.length; i++) {
    const d = ANDAMAN_DESTINATIONS[i];
    const slug = slugify(d.name);
    const existing = await db.destination.findUnique({ where: { slug }, select: { id: true } });
    await db.destination.upsert({
      where: { slug },
      create: {
        slug, name: d.name, country: "India", region: "Andaman & Nicobar Islands",
        shortSummary: d.summary ?? null, isPopular: !!d.popular, isPublished: true,
        sortOrder: i, travelInfo: { hubSlug: d.hub },
      },
      // Only restore structural fields — an admin's edited copy is never clobbered.
      update: { country: "India", region: "Andaman & Nicobar Islands", isPopular: !!d.popular },
    });
    if (existing) updated++; else added++;
  }
  await writeAudit({ adminUserId: admin.id, action: "destination.seed", resource: "Destinations", after: { added, updated } });
  revalidatePath("/admin/destinations");
  revalidateTag("destinations");
  return { ok: true, added, updated };
}
