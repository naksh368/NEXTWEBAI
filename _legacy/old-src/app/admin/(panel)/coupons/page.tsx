import { requireAdmin, hasPermission } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, Panel, Table, Th, Td, EmptyRow, Pill } from "@/components/admin/ui";
import { ActiveToggle } from "@/components/admin/catalog-actions";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const admin = await requireAdmin("coupon.manage");
  const canManage = hasPermission(admin, "coupon.manage");
  const rows = await db.coupon.findMany({ orderBy: { code: "asc" } });

  return (
    <>
      <PageHeader title="Coupons" subtitle="Discounts are validated on the server at checkout." />
      <Panel>
        <Table head={<><Th>Code</Th><Th>Type</Th><Th>Value</Th><Th>Min / Cap</Th><Th>Used</Th><Th>Active</Th></>}>
          {rows.length === 0 ? <EmptyRow colSpan={6} label="No coupons yet." /> : rows.map((c) => (
            <tr key={c.id} className="hover:bg-surface-muted/40">
              <Td className="font-mono font-semibold">{c.code}</Td>
              <Td><Pill tone="info">{c.kind}</Pill></Td>
              <Td>{c.kind === "PERCENT" ? `${c.value}%` : formatINR(c.value)}</Td>
              <Td className="text-ink-muted">{c.minAmount ? `min ${formatINR(c.minAmount)}` : "—"}{c.maxDiscount ? ` · cap ${formatINR(c.maxDiscount)}` : ""}</Td>
              <Td className="text-ink-muted">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</Td>
              <Td>{canManage ? <ActiveToggle id={c.id} isActive={c.isActive} kind="coupon" /> : <Pill tone={c.isActive ? "success" : "neutral"}>{c.isActive ? "Active" : "Off"}</Pill>}</Td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
