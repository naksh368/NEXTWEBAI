import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, Panel, Pill } from "@/components/admin/ui";
import { PackageEditor } from "@/components/admin/package-editor";
import { ImageManager } from "@/components/admin/image-manager";
import { ItineraryEditor } from "@/components/admin/itinerary-editor";
import { OptionsEditor } from "@/components/admin/options-editor";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = { PUBLISHED: "success", DRAFT: "neutral", IN_REVIEW: "info", PAUSED: "warning", ARCHIVED: "danger" };

export default async function EditPackagePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("package.edit");
  const { id } = await params;

  const [pkg, destinations] = await Promise.all([
    db.package.findUnique({
      where: { id },
      include: {
        currentVersion: {
          include: {
            images: { orderBy: { sortOrder: "asc" } },
            days: { orderBy: { dayNumber: "asc" }, include: { items: { orderBy: { sortOrder: "asc" } } } },
            options: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    }),
    db.destination.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!pkg || !pkg.currentVersion) notFound();
  const v = pkg.currentVersion;

  return (
    <>
      <Link href="/admin/packages" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-brand-blue"><ArrowLeft className="h-4 w-4" /> Packages</Link>
      <PageHeader
        title={pkg.name}
        subtitle={`${pkg.code ?? pkg.slug} · v${v.versionNumber}`}
        action={<div className="flex items-center gap-2"><Pill tone={STATUS_TONE[pkg.status] ?? "neutral"}>{pkg.status}</Pill><Link href={`/packages/${pkg.slug}`} className="text-sm font-semibold text-brand-blue hover:underline">View live ↗</Link></div>}
      />

      <div className="space-y-6">
        <Panel title="Details">
          <div className="p-5">
            <PackageEditor
              pkg={{ id: pkg.id, name: pkg.name, code: pkg.code, theme: pkg.theme, isFeatured: pkg.isFeatured, status: pkg.status, destinationId: pkg.destinationId }}
              version={v as unknown as Record<string, unknown>}
              destinations={destinations}
            />
          </div>
        </Panel>

        <Panel title={`Images (${v.images.length})`} action={<span className="text-xs text-ink-faint">Minimum 3 recommended</span>}>
          <div className="p-5"><ImageManager versionId={v.id} images={v.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt, isCover: i.isCover }))} /></div>
        </Panel>

        <Panel title={`Day-by-day itinerary (${v.days.length} days)`}>
          <div className="p-5"><ItineraryEditor versionId={v.id} days={v.days.map((d) => ({ id: d.id, dayNumber: d.dayNumber, title: d.title, summary: d.summary, items: d.items.map((it) => ({ id: it.id, timeslot: it.timeslot, kind: it.kind, title: it.title, description: it.description })) }))} /></div>
        </Panel>

        <Panel title={`Customization options (${v.options.length})`}>
          <div className="p-5"><OptionsEditor versionId={v.id} options={v.options.map((o) => ({ id: o.id, category: o.category, label: o.label, priceDelta: o.priceDelta, isDefault: o.isDefault }))} /></div>
        </Panel>
      </div>
    </>
  );
}
