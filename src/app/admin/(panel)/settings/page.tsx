import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, Panel } from "@/components/admin/ui";
import { updateBrandSettingsAction, updateCheckoutSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

const inp = "w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15";

export default async function AdminSettingsPage() {
  await requireAdmin("settings.manage");
  const settings = await db.businessSetting.findMany({ orderBy: { key: "asc" } });
  const byKey = Object.fromEntries(settings.map((s) => [s.key, s.value as Record<string, unknown>]));
  const brand = (byKey.brand ?? {}) as { name?: string; supportEmail?: string; supportPhone?: string };
  const checkout = (byKey.checkout ?? {}) as { taxRatePct?: number; currency?: string };
  const other = settings.filter((s) => s.key !== "brand" && s.key !== "checkout");

  return (
    <>
      <PageHeader title="Business settings" subtitle="Real, editable operational configuration." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Brand & contact">
          <form action={updateBrandSettingsAction} className="space-y-4 p-5">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-brand-navy">Brand name</span>
              <input name="name" defaultValue={brand.name ?? "ExpertzTrip"} className={inp} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-brand-navy">Support email</span>
              <input name="supportEmail" type="email" defaultValue={brand.supportEmail ?? ""} placeholder="support@expertztrip.com" className={inp} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-brand-navy">Support phone</span>
              <input name="supportPhone" defaultValue={brand.supportPhone ?? ""} placeholder="+91 …" className={inp} />
            </label>
            <button type="submit" className="inline-flex h-10 items-center rounded-xl bg-brand-blue px-5 text-sm font-semibold text-white hover:bg-brand-blueDark">Save brand settings</button>
          </form>
        </Panel>

        <Panel title="Checkout & pricing">
          <form action={updateCheckoutSettingsAction} className="space-y-4 p-5">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-brand-navy">Tax rate (%)</span>
              <input name="taxRatePct" type="number" step="0.1" min={0} max={100} defaultValue={checkout.taxRatePct ?? 5} className={inp} />
              <span className="mt-1 block text-xs text-ink-muted">Applied to bookings at checkout.</span>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-brand-navy">Currency</span>
              <input name="currency" defaultValue={checkout.currency ?? "INR"} className={inp} />
            </label>
            <button type="submit" className="inline-flex h-10 items-center rounded-xl bg-brand-blue px-5 text-sm font-semibold text-white hover:bg-brand-blueDark">Save checkout settings</button>
          </form>
        </Panel>
      </div>

      {other.length > 0 && (
        <div className="mt-6 space-y-4">
          {other.map((s) => (
            <Panel key={s.key} title={s.key}>
              <pre className="overflow-x-auto p-5 text-sm text-ink">{JSON.stringify(s.value, null, 2)}</pre>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
