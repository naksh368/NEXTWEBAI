import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Publishes any packages whose scheduled `publishAt` time has arrived.
 * Idempotent and safe to call opportunistically (on admin page loads) or from a
 * cron endpoint. Returns the number of packages published. Never throws.
 */
export async function publishDuePackages(): Promise<number> {
  try {
    const now = new Date();
    const due = await db.package.findMany({
      where: { publishAt: { lte: now, not: null }, status: { in: ["DRAFT", "IN_REVIEW", "PAUSED"] } },
      select: { id: true, slug: true },
    });
    if (!due.length) return 0;

    await db.package.updateMany({
      where: { id: { in: due.map((p) => p.id) } },
      data: { status: "PUBLISHED", publishAt: null },
    });

    // Refresh the surfaces where the newly-live packages should now appear.
    revalidatePath("/");
    revalidatePath("/packages");
    revalidatePath("/admin/packages");
    for (const p of due) revalidatePath(`/packages/${p.slug}`);
    return due.length;
  } catch {
    return 0;
  }
}
