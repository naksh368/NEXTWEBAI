import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, Panel } from "@/components/admin/ui";
import { ActivitiesManager } from "@/components/admin/activities-manager";

export const dynamic = "force-dynamic";

export default async function AdminActivitiesPage() {
  await requireAdmin("package.edit");
  const activities = await db.activity.findMany({
    where: { isActive: true },
    orderBy: [{ city: "asc" }, { createdAt: "desc" }],
    take: 500,
    select: { id: true, title: true, summary: true, city: true, country: true, timeslot: true, kind: true, priceFrom: true, imageUrl: true },
  });

  return (
    <>
      <PageHeader
        title="Activities & experiences"
        subtitle="A reusable catalogue of things to do. Add them to any package's itinerary with “+ Add from catalogue”. Harvest pulls activities out of your imported packages."
      />
      <Panel>
        <div className="p-4 sm:p-5">
          <ActivitiesManager activities={activities} />
        </div>
      </Panel>
    </>
  );
}
