import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { PageHeader } from "@/components/admin/ui";
import { ContentEditor } from "@/components/admin/content-editor";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  await requireAdmin("settings.manage");
  const settings = await getSiteSettings();

  return (
    <>
      <PageHeader
        title="Website content"
        subtitle="Brand, homepage hero, contact details, pricing defaults and SEO — all editable here, with no code change or redeploy."
        action={
          <Link href="/" target="_blank" className="text-sm font-semibold text-brand-blue hover:underline">
            View site ↗
          </Link>
        }
      />
      <ContentEditor settings={settings} />
    </>
  );
}
