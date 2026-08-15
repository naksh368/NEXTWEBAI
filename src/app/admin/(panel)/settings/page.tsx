import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, Panel } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin("settings.manage");
  const settings = await db.businessSetting.findMany({ orderBy: { key: "asc" } });

  return (
    <>
      <PageHeader title="Business settings" subtitle="Key operational configuration." />
      <div className="space-y-4">
        {settings.length === 0 ? (
          <Panel><div className="p-6 text-sm text-ink-muted">No settings configured.</div></Panel>
        ) : settings.map((s) => (
          <Panel key={s.key} title={s.key}>
            <pre className="overflow-x-auto p-5 text-sm text-ink">{JSON.stringify(s.value, null, 2)}</pre>
          </Panel>
        ))}
      </div>
    </>
  );
}
