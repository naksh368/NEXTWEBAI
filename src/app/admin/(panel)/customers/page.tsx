import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, Panel, Table, Th, Td, EmptyRow, Pill, AdminPager } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin("customer.view");
  const page = Math.max(1, Number((await searchParams).page ?? 1) || 1);

  const [total, rows] = await Promise.all([
    db.customer.count(),
    db.customer.findMany({
      orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      include: { _count: { select: { bookings: true } } },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader title="Customers" subtitle={`${total} registered customer${total === 1 ? "" : "s"}`} />
      <Panel>
        <Table head={<><Th>Name</Th><Th>Mobile</Th><Th>Email</Th><Th>Bookings</Th><Th>Verified</Th><Th>Joined</Th></>}>
          {rows.length === 0 ? <EmptyRow colSpan={6} label="No customers yet." /> : rows.map((c) => (
            <tr key={c.id} className="hover:bg-surface-muted/40">
              <Td className="font-medium">{c.fullName ?? "—"}</Td>
              <Td>{c.mobile}</Td>
              <Td className="text-ink-muted">{c.email ?? "—"}</Td>
              <Td>{c._count.bookings}</Td>
              <Td>{c.isVerified ? <Pill tone="success">Verified</Pill> : <Pill tone="neutral">No</Pill>}</Td>
              <Td className="text-ink-muted">{formatDate(c.createdAt)}</Td>
            </tr>
          ))}
        </Table>
        <AdminPager page={page} totalPages={totalPages} base="/admin/customers" />
      </Panel>
    </>
  );
}
