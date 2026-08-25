import { headers } from "next/headers";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, Panel } from "@/components/admin/ui";
import { MediaLibrary } from "@/components/admin/media-library";
import { getSiteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  await requireAdmin("package.edit");
  const assets = await db.mediaAsset.findMany({
    orderBy: { createdAt: "desc" }, take: 200,
    select: { id: true, filename: true, contentType: true, size: true, alt: true, createdAt: true },
  });

  // Absolute origin so "Copy URL" gives a link that works anywhere.
  let origin = getSiteUrl();
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) origin = `${h.get("x-forwarded-proto") ?? "https"}://${host}`;
  } catch { /* keep configured site url */ }

  return (
    <>
      <PageHeader title="Media library" subtitle="Upload and manage images on your own server — no third-party host. Copy a URL to use in any package, offer or destination." />
      <Panel>
        <div className="p-4 sm:p-5">
          <MediaLibrary assets={assets} origin={origin} />
        </div>
      </Panel>
    </>
  );
}
