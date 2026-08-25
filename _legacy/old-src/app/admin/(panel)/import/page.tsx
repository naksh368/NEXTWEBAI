import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";
import { PackageImporter } from "@/components/admin/package-importer";

export const dynamic = "force-dynamic";

export default async function ImportPackagePage() {
  await requireAdmin("package.create");

  const destinations = await db.destination.findMany({
    orderBy: [{ country: "asc" }, { name: "asc" }],
    select: { id: true, name: true, country: true },
  });

  return (
    <>
      <PageHeader
        title="Package Importer"
        subtitle="Internal research & data-entry assistant. Scan a public package URL, review the extracted facts, rewrite into original ExpertzTrip copy, and save a draft. Never auto-publishes."
      />
      <PackageImporter destinations={destinations} />
    </>
  );
}
