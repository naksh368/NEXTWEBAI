import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";
import { GalleryManager } from "@/components/admin/gallery-manager";
import { GALLERY_CATEGORIES } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  await requireAdmin("gallery.manage");

  const items = await db.galleryItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <PageHeader
        title="Gallery"
        subtitle="Photographs shown on the public gallery page and the homepage strip. Only published images are ever served."
        action={
          <Link href="/gallery" target="_blank" className="text-sm font-semibold text-brand-blue hover:underline">
            View public gallery ↗
          </Link>
        }
      />
      <GalleryManager
        items={items.map((i) => ({
          id: i.id, url: i.url, alt: i.alt, caption: i.caption,
          location: i.location, category: i.category, isPublished: i.isPublished, sortOrder: i.sortOrder,
        }))}
        categories={GALLERY_CATEGORIES.map((c) => ({ key: c.key, label: c.label }))}
      />
    </>
  );
}
