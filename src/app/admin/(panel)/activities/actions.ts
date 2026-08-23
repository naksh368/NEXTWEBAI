"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { authorize } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/services/audit-service";

type R<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string };

const TIMESLOTS = ["MORNING", "AFTERNOON", "EVENING"] as const;
const KINDS = ["ACTIVITY", "MEAL", "TRANSFER", "HOTEL", "FLIGHT", "FREE_TIME", "NOTE"] as const;

const activitySchema = z.object({
  title: z.string().min(2, "Title is required.").max(200),
  summary: z.string().max(1000).optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  country: z.string().max(80).optional().nullable(),
  timeslot: z.enum(TIMESLOTS).catch("MORNING"),
  kind: z.enum(KINDS).catch("ACTIVITY"),
  priceFrom: z.coerce.number().int().min(0).max(5_000_000).optional().nullable(),
  imageUrl: z.string().max(2048).optional().nullable(),
});

export async function createActivityAction(input: unknown): Promise<R<{ id: string }>> {
  const admin = await authorize("package.edit");
  if (!admin) return { ok: false, error: "Not authorized." };
  const p = activitySchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Please check the form." };
  const d = p.data;
  const a = await db.activity.create({
    data: {
      title: d.title, summary: d.summary || null, city: d.city || null, country: d.country || null,
      timeslot: d.timeslot, kind: d.kind, priceFrom: d.priceFrom ?? null, imageUrl: d.imageUrl || null,
      createdById: admin.id,
    },
    select: { id: true },
  });
  await writeAudit({ adminUserId: admin.id, action: "activity.create", resource: `Activity:${a.id}`, after: { title: d.title } });
  revalidatePath("/admin/activities");
  return { ok: true, id: a.id };
}

export async function updateActivityAction(id: string, input: unknown): Promise<R> {
  const admin = await authorize("package.edit");
  if (!admin) return { ok: false, error: "Not authorized." };
  const p = activitySchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Please check the form." };
  const d = p.data;
  const exists = await db.activity.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return { ok: false, error: "Activity not found." };
  await db.activity.update({
    where: { id },
    data: { title: d.title, summary: d.summary || null, city: d.city || null, country: d.country || null, timeslot: d.timeslot, kind: d.kind, priceFrom: d.priceFrom ?? null, imageUrl: d.imageUrl || null },
  });
  await writeAudit({ adminUserId: admin.id, action: "activity.update", resource: `Activity:${id}` });
  revalidatePath("/admin/activities");
  return { ok: true };
}

export async function deleteActivityAction(id: string): Promise<R> {
  const admin = await authorize("package.edit");
  if (!admin) return { ok: false, error: "Not authorized." };
  const a = await db.activity.findUnique({ where: { id }, select: { title: true } });
  if (!a) return { ok: false, error: "Activity not found." };
  await db.activity.delete({ where: { id } });
  await writeAudit({ adminUserId: admin.id, action: "activity.delete", resource: `Activity:${id}`, before: { title: a.title } });
  revalidatePath("/admin/activities");
  return { ok: true };
}

/**
 * Populate the catalogue from every package's itinerary items (the activities
 * that came in with imported/built packages). Dedupes on title+city so running
 * it repeatedly is safe.
 */
export async function harvestActivitiesAction(): Promise<R<{ added: number; scanned: number }>> {
  const admin = await authorize("package.edit");
  if (!admin) return { ok: false, error: "Not authorized." };

  const items = await db.packageDayItem.findMany({
    where: { kind: { in: ["ACTIVITY", "MEAL"] } },
    select: {
      timeslot: true, kind: true, title: true, description: true,
      day: { select: { version: { select: { package: { select: { destination: { select: { name: true, country: true } } } } } } } },
    },
    take: 3000,
  });

  const existing = await db.activity.findMany({ select: { title: true, city: true } });
  const seen = new Set(existing.map((e) => `${e.title.toLowerCase()}|${(e.city ?? "").toLowerCase()}`));

  const toCreate: { title: string; summary: string | null; city: string | null; country: string | null; timeslot: string; kind: string; createdById: string }[] = [];
  for (const it of items) {
    const title = it.title.trim();
    if (!title) continue;
    const city = it.day.version.package.destination?.name ?? null;
    const key = `${title.toLowerCase()}|${(city ?? "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    toCreate.push({
      title: title.slice(0, 200), summary: it.description?.slice(0, 1000) ?? null,
      city, country: it.day.version.package.destination?.country ?? null,
      timeslot: it.timeslot, kind: it.kind, createdById: admin.id,
    });
  }

  if (toCreate.length) await db.activity.createMany({ data: toCreate });
  await writeAudit({ adminUserId: admin.id, action: "activity.harvest", resource: "Activity", after: { added: toCreate.length, scanned: items.length } });
  revalidatePath("/admin/activities");
  return { ok: true, added: toCreate.length, scanned: items.length };
}

/** Insert a catalogue activity into a package itinerary day as a new item. */
export async function addActivityToDayAction(dayId: string, activityId: string): Promise<R> {
  const admin = await authorize("package.edit");
  if (!admin) return { ok: false, error: "Not authorized." };
  const [day, activity] = await Promise.all([
    db.packageDay.findUnique({ where: { id: dayId }, select: { id: true, version: { select: { packageId: true, package: { select: { slug: true } } } } } }),
    db.activity.findUnique({ where: { id: activityId }, select: { title: true, summary: true, timeslot: true, kind: true } }),
  ]);
  if (!day) return { ok: false, error: "Day not found." };
  if (!activity) return { ok: false, error: "Activity not found." };
  const max = await db.packageDayItem.aggregate({ where: { dayId }, _max: { sortOrder: true } });
  await db.packageDayItem.create({
    data: { dayId, timeslot: activity.timeslot, kind: activity.kind, title: activity.title, description: activity.summary || null, sortOrder: (max._max.sortOrder ?? -1) + 1 },
  });
  await writeAudit({ adminUserId: admin.id, action: "activity.addToDay", resource: `Package:${day.version.packageId}`, after: { activityId, dayId } });
  revalidatePath(`/admin/packages/${day.version.packageId}/edit`);
  revalidatePath(`/packages/${day.version.package.slug}`);
  return { ok: true };
}
