import Link from "next/link";
import { requireAdmin, hasPermission } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, Panel, Table, Th, Td, Pill, EmptyRow, AdminPager } from "@/components/admin/ui";
import { PackageStatusControl } from "@/components/admin/catalog-actions";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 15;

const STATUS_TONE: Record<string, string> = { PUBLISHED: "success", DRAFT: "neutral", IN_REVIEW: "info", PAUSED: "warning", ARCHIVED: "danger" };

export default async function AdminPackagesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const admin = await requireAdmin("package.view");
  const canEdit = hasPermission(admin, "package.edit") || hasPermission(admin, "package.publish");
  const page = Math.max(1, Number((await searchParams).page ?? 1) || 1);

  const [total, rows] = await Promise.all([
    db.package.count(),
    db.package.findMany({
      orderBy: { updatedAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      include: { destination: { select: { name: true } }, currentVersion: { select: { basePrice: true, durationNights: true } } },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader title="Packages" subtitle={`${total} package${total === 1 ? "" : "s"} · only PUBLISHED appear on the public site`} />
      <Panel>
        <Table head={<><Th>Package</Th><Th>Destination</Th><Th>Duration</Th><Th className="text-right">From</Th><Th>Status</Th><Th></Th></>}>
          {rows.length === 0 ? <EmptyRow colSpan={6} label="No packages yet." /> : rows.map((p) => (
            <tr key={p.id} className="hover:bg-surface-muted/40">
              <Td className="font-medium text-brand-navy">{p.name}</Td>
              <Td className="text-ink-muted">{p.destination.name}</Td>
              <Td className="text-ink-muted">{p.currentVersion ? `${p.currentVersion.durationNights}N` : "—"}</Td>
              <Td className="text-right tabular-nums">{p.currentVersion ? formatINR(p.currentVersion.basePrice) : "—"}</Td>
              <Td>{canEdit ? <PackageStatusControl packageId={p.id} current={p.status} /> : <Pill tone={STATUS_TONE[p.status] ?? "neutral"}>{p.status}</Pill>}</Td>
              <Td className="text-right"><Link href={`/packages/${p.slug}`} className="text-sm font-medium text-brand-blue hover:underline">View ↗</Link></Td>
            </tr>
          ))}
        </Table>
        <AdminPager page={page} totalPages={totalPages} base="/admin/packages" />
      </Panel>
    </>
  );
}
