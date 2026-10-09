import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";
import { TestimonialsManager } from "@/components/admin/testimonials-manager";

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  await requireAdmin("testimonial.manage");

  const items = await db.testimonial.findMany({
    orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <PageHeader
        title="Testimonials"
        subtitle="Traveller quotes shown on the homepage. Enter them from messages you actually received — nothing here is generated."
      />
      <TestimonialsManager
        items={items.map((t) => ({
          id: t.id,
          displayName: t.displayName,
          location: t.location,
          body: t.body,
          rating: t.rating,
          photoUrl: t.photoUrl,
          packageName: t.packageName,
          reviewDate: t.reviewDate ? t.reviewDate.toISOString() : null,
          status: t.status,
          sortOrder: t.sortOrder,
        }))}
      />
    </>
  );
}
