import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";
import { PackageImporter } from "@/components/admin/package-importer";

export const dynamic = "force-dynamic";
// Reading details with a free AI model can take a while.
export const maxDuration = 60;

export default async function ImportPackagePage() {
  await requireAdmin("package.create");

  const destinations = await db.destination.findMany({
    orderBy: [{ country: "asc" }, { name: "asc" }],
    select: { id: true, name: true, country: true },
  });

  return (
    <>
      <PageHeader
        title="Add packages with AI"
        subtitle="Paste a package's details and the hotel tier, nights, route, price and itinerary are worked out for you to check — or read them from a web page, or build one from a brief. Everything is saved as a draft; nothing is published until you publish it."
      />
      <PackageImporter destinations={destinations} />
    </>
  );
}
