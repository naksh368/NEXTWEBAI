import Link from "next/link";
import { requireAdmin, hasPermission } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, Panel, Table, Th, Td, Pill, EmptyRow, AdminPager } from "@/components/admin/ui";
import { PackageStatusControl, FlagToggle, SchedulePublish } from "@/components/admin/catalog-actions";
import { RunDuePublish } from "@/components/admin/run-due-publish";
import { BulkProvider, BulkBar, RowSelect, SelectAll, DeletePackage, DuplicatePackage } from "@/components/admin/package-bulk";
import { PACKAGE_STATUS } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 15;

const STATUS_TONE: Record<string, string> = { PUBLISHED: "success", DRAFT: "neutral", IN_REVIEW: "info", PAUSED: "warning", ARCHIVED: "danger" };

export default async function AdminPackagesPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; status?: string }> }) {
  const admin = await requireAdmin("package.view");
  const canEdit = hasPermission(admin, "package.edit") || hasPermission(admin, "package.publish");
  const canCreate = hasPermission(admin, "package.create");
  const canDelete = hasPermission(admin, "package.archive");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const q = (sp.q ?? "").trim();
  const status = PACKAGE_STATUS.includes(sp.status as (typeof PACKAGE_STATUS)[number]) ? sp.status! : "";

  const where: Prisma.PackageWhereInput = {
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { destination: { name: { contains: q, mode: "insensitive" } } }] } : {}),
    ...(status ? { status } : {}),
  };

  const [total, rows] = await Promise.all([
    db.package.count({ where }),
    db.package.findMany({
      where, orderBy: { updatedAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      include: { destination: { select: { name: true } }, currentVersion: { select: { basePrice: true, durationNights: true, pricingStatus: true } } },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pagerBase = `/admin/packages${q || status ? `?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}) }).toString()}` : ""}`;

  return (
    <>
      <PageHeader
        title="Packages"
        subtitle={`${total} package${total === 1 ? "" : "s"} · only PUBLISHED appear on the site; toggle "Home" to feature (shows once published)`}
        action={
          <div className="flex items-center gap-2">
            {canEdit && <RunDuePublish />}
            {canCreate && <Link href="/admin/packages/new" className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-blue px-4 text-sm font-bold text-white hover:bg-brand-blueDark">+ New package</Link>}
          </div>
        }
      />
      <form method="get" className="mb-4 flex flex-wrap items-center gap-2">
        <input name="q" defaultValue={q} placeholder="Search name or destination…" className="h-10 min-w-[220px] flex-1 rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-blue focus:outline-none" />
        <select name="status" defaultValue={status} className="h-10 rounded-xl border border-surface-border bg-white px-3 text-sm">
          <option value="">All statuses</option>
          {PACKAGE_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="submit" className="inline-flex h-10 items-center rounded-xl bg-brand-blue px-4 text-sm font-bold text-white hover:bg-brand-blueDark">Search</button>
        {(q || status) && <Link href="/admin/packages" className="inline-flex h-10 items-center rounded-xl border border-surface-border px-4 text-sm font-medium text-ink-muted hover:text-brand-blue">Clear</Link>}
      </form>

      <BulkProvider>
        <Panel>
          <Table head={<><Th>{canEdit ? <SelectAll ids={rows.map((r) => r.id)} /> : null}</Th><Th>Package</Th><Th>Destination</Th><Th>Duration</Th><Th className="text-right">From</Th><Th>Status</Th><Th>Home</Th><Th>Checked</Th><Th>Schedule</Th><Th></Th></>}>
            {rows.length === 0 ? <EmptyRow colSpan={10} label={q || status ? "No packages match your filter." : "No packages yet."} /> : rows.map((p) => (
              <tr key={p.id} className="hover:bg-surface-muted/40">
                <Td>{canEdit ? <RowSelect id={p.id} /> : null}</Td>
                <Td className="font-medium text-brand-navy">{p.name}</Td>
                <Td className="text-ink-muted">{p.destination.name}</Td>
                <Td className="text-ink-muted">{p.currentVersion ? `${p.currentVersion.durationNights}N` : "—"}</Td>
                <Td className="text-right tabular-nums">{!p.currentVersion ? "—" : p.currentVersion.pricingStatus === "PRICE_REVIEW_REQUIRED" ? <span className="text-xs font-medium text-warning">Price review</span> : formatINR(p.currentVersion.basePrice)}</Td>
                <Td>{canEdit ? <PackageStatusControl packageId={p.id} current={p.status} /> : <Pill tone={STATUS_TONE[p.status] ?? "neutral"}>{p.status}</Pill>}</Td>
                <Td>{canEdit ? <FlagToggle id={p.id} on={p.isFeatured} kind="featured" label="Feature" /> : (p.isFeatured ? <Pill tone="brand">Featured</Pill> : "—")}</Td>
                <Td>{canEdit ? <FlagToggle id={p.id} on={p.isChecked} kind="checked" label="Checked" /> : (p.isChecked ? <Pill tone="success">Checked</Pill> : "—")}</Td>
                <Td>{canEdit ? <SchedulePublish id={p.id} publishAt={p.publishAt ? p.publishAt.toISOString() : null} status={p.status} /> : (p.publishAt ? <Pill tone="info">Scheduled</Pill> : "—")}</Td>
                <Td className="text-right">
                  <span className="flex items-center justify-end gap-3">
                    {canEdit && <Link href={`/admin/packages/${p.id}/edit`} className="text-sm font-semibold text-brand-blue hover:underline">Edit</Link>}
                    <Link href={`/packages/${p.slug}`} className="text-sm font-medium text-ink-muted hover:text-brand-blue">View ↗</Link>
                    {canCreate && <DuplicatePackage id={p.id} />}
                    {canDelete && <DeletePackage id={p.id} name={p.name} />}
                  </span>
                </Td>
              </tr>
            ))}
          </Table>
          <AdminPager page={page} totalPages={totalPages} base={pagerBase} />
        </Panel>
        <BulkBar />
      </BulkProvider>
    </>
  );
}
