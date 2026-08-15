import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, Panel, Table, Th, Td, EmptyRow, Pill } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminDestinationsPage() {
  await requireAdmin("destination.manage");
  const rows = await db.destination.findMany({
    orderBy: [{ isPopular: "desc" }, { sortOrder: "asc" }],
    include: { _count: { select: { packages: true } } },
  });

  return (
    <>
      <PageHeader title="Destinations" subtitle="Destination pages are generated from these records." />
      <Panel>
        <Table head={<><Th>Name</Th><Th>Country</Th><Th>Region</Th><Th>Packages</Th><Th>Flags</Th><Th></Th></>}>
          {rows.length === 0 ? <EmptyRow colSpan={6} label="No destinations yet." /> : rows.map((d) => (
            <tr key={d.id} className="hover:bg-surface-muted/40">
              <Td className="font-medium text-brand-navy">{d.name}</Td>
              <Td className="text-ink-muted">{d.country}</Td>
              <Td className="text-ink-muted">{d.region ?? "—"}</Td>
              <Td>{d._count.packages}</Td>
              <Td className="flex gap-1.5">{d.isPopular && <Pill tone="brand">Popular</Pill>}{d.isPublished ? <Pill tone="success">Live</Pill> : <Pill tone="neutral">Hidden</Pill>}</Td>
              <Td className="text-right"><Link href={`/destinations/${d.slug}`} className="text-sm font-medium text-brand-blue hover:underline">View ↗</Link></Td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
