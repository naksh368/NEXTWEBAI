import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, Panel, Table, Th, Td, EmptyRow, Pill } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminSuppliersPage() {
  await requireAdmin("supplier.manage");
  const rows = await db.supplier.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { mappings: true } } } });

  return (
    <>
      <PageHeader title="Suppliers" subtitle="Supplier records. Credentials live in secret storage — never in the database." />
      <Panel>
        <Table head={<><Th>Name</Th><Th>Type</Th><Th>Status</Th><Th>Product mappings</Th><Th>Credential ref</Th></>}>
          {rows.length === 0 ? <EmptyRow colSpan={5} label="No suppliers yet." /> : rows.map((s) => (
            <tr key={s.id} className="hover:bg-surface-muted/40">
              <Td className="font-medium">{s.name}</Td>
              <Td><Pill tone="info">{s.type}</Pill></Td>
              <Td><Pill tone={s.status === "ACTIVE" ? "success" : "neutral"}>{s.status}</Pill></Td>
              <Td className="text-ink-muted">{s._count.mappings}</Td>
              <Td className="font-mono text-xs text-ink-faint">{s.credentialRef ?? "—"}</Td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
