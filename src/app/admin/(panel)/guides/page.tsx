import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, Panel, Table, Th, Td, EmptyRow, Pill } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminGuidesPage() {
  await requireAdmin("content.manage");
  const rows = await db.travelGuide.findMany({ orderBy: { publishedAt: "desc" }, include: { destination: { select: { name: true } } } });

  return (
    <>
      <PageHeader title="Travel guides" subtitle="Long-form content shown under Travel Guide." />
      <Panel>
        <Table head={<><Th>Title</Th><Th>Destination</Th><Th>Status</Th><Th>Published</Th></>}>
          {rows.length === 0 ? <EmptyRow colSpan={4} label="No guides yet." /> : rows.map((g) => (
            <tr key={g.id} className="hover:bg-surface-muted/40">
              <Td className="max-w-md truncate font-medium text-brand-navy">{g.title}</Td>
              <Td className="text-ink-muted">{g.destination?.name ?? "General"}</Td>
              <Td>{g.isPublished ? <Pill tone="success">Published</Pill> : <Pill tone="neutral">Draft</Pill>}</Td>
              <Td className="text-ink-muted">{formatDate(g.publishedAt)}</Td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
