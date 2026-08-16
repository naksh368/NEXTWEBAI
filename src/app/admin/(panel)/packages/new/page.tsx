import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, Panel } from "@/components/admin/ui";
import { NewPackageForm } from "@/components/admin/new-package-form";

export const dynamic = "force-dynamic";

export default async function NewPackagePage() {
  await requireAdmin("package.create");
  const destinations = await db.destination.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <>
      <Link href="/admin/packages" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-brand-blue"><ArrowLeft className="h-4 w-4" /> Packages</Link>
      <PageHeader title="New package" subtitle="Create a package, then add its content." />
      <Panel><div className="p-5"><NewPackageForm destinations={destinations} /></div></Panel>
    </>
  );
}
