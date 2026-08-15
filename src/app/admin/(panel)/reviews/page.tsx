import { requireAdmin, hasPermission } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, Panel, Table, Th, Td, Pill, EmptyRow } from "@/components/admin/ui";
import { ReviewModerate } from "@/components/admin/catalog-actions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
const TONE: Record<string, string> = { PUBLISHED: "success", PENDING: "warning", REJECTED: "danger" };

export default async function AdminReviewsPage() {
  const admin = await requireAdmin("review.moderate");
  const canModerate = hasPermission(admin, "review.moderate");

  const rows = await db.review.findMany({
    orderBy: { createdAt: "desc" }, take: 50,
    include: { customer: { select: { fullName: true } }, package: { select: { name: true } } },
  });

  return (
    <>
      <PageHeader title="Reviews" subtitle="Only genuine, verified reviews should be published." />
      <Panel>
        <Table head={<><Th>Customer</Th><Th>Package</Th><Th>Rating</Th><Th>Review</Th><Th>Status</Th>{canModerate && <Th>Action</Th>}</>}>
          {rows.length === 0 ? (
            <EmptyRow colSpan={canModerate ? 6 : 5} label="No reviews submitted yet. Reviews come only from real customers." />
          ) : rows.map((r) => (
            <tr key={r.id} className="hover:bg-surface-muted/40">
              <Td className="font-medium">{r.customer.fullName ?? "—"}</Td>
              <Td className="text-ink-muted">{r.package?.name ?? "—"}</Td>
              <Td>{"★".repeat(r.rating)}<span className="text-ink-faint">{"★".repeat(5 - r.rating)}</span></Td>
              <Td className="max-w-xs truncate text-ink-muted">{r.body ?? r.title ?? "—"}</Td>
              <Td><Pill tone={TONE[r.status] ?? "neutral"}>{r.status}</Pill></Td>
              {canModerate && <Td>{r.status === "PENDING" ? <ReviewModerate reviewId={r.id} /> : <span className="text-xs text-ink-faint">—</span>}</Td>}
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
