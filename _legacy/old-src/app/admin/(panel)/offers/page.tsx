import { requireAdmin, hasPermission } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, Panel, Table, Th, Td, EmptyRow, Pill } from "@/components/admin/ui";
import { ActiveToggle } from "@/components/admin/catalog-actions";

export const dynamic = "force-dynamic";

export default async function AdminOffersPage() {
  const admin = await requireAdmin("offer.manage");
  const canManage = hasPermission(admin, "offer.manage");
  const rows = await db.offer.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <>
      <PageHeader title="Offers" subtitle="Promotional banners shown on the homepage and offers page." />
      <Panel>
        <Table head={<><Th>Title</Th><Th>Badge</Th><Th>Link</Th><Th>Active</Th></>}>
          {rows.length === 0 ? <EmptyRow colSpan={4} label="No offers yet." /> : rows.map((o) => (
            <tr key={o.id} className="hover:bg-surface-muted/40">
              <Td className="font-medium text-brand-navy">{o.title}</Td>
              <Td>{o.badge ? <Pill tone="brand">{o.badge}</Pill> : <span className="text-ink-faint">—</span>}</Td>
              <Td className="text-ink-muted">{o.ctaHref ?? "—"}</Td>
              <Td>{canManage ? <ActiveToggle id={o.id} isActive={o.isActive} kind="offer" /> : <Pill tone={o.isActive ? "success" : "neutral"}>{o.isActive ? "Active" : "Off"}</Pill>}</Td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
