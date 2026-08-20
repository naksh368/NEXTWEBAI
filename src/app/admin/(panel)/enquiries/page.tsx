import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, StatCard, Panel, Table, Th, Td, EmptyRow, Pill, AdminPager } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";
import { updateEnquiryStatus } from "./actions";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

const STATUS_TONE: Record<string, "info" | "warning" | "success" | "neutral" | "brand"> = {
  NEW: "brand",
  CONTACTED: "info",
  QUOTED: "warning",
  CONVERTED: "success",
  CLOSED: "neutral",
};
const STATUSES = ["NEW", "CONTACTED", "QUOTED", "CONVERTED", "CLOSED"];

export default async function AdminEnquiriesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin("customer.view");
  const page = Math.max(1, Number((await searchParams).page ?? 1) || 1);

  const [total, newCount, convertedCount, rows] = await Promise.all([
    db.enquiry.count(),
    db.enquiry.count({ where: { status: "NEW" } }),
    db.enquiry.count({ where: { status: "CONVERTED" } }),
    db.enquiry.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader title="Enquiries" subtitle="Travel leads submitted from the website." />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total leads" value={total} tone="navy" />
        <StatCard label="New" value={newCount} tone="orange" hint="Needs follow-up" />
        <StatCard label="Converted" value={convertedCount} tone="green" />
        <StatCard label="Conversion" value={total ? `${Math.round((convertedCount / total) * 100)}%` : "—"} tone="blue" />
      </div>

      <Panel>
        <Table head={<><Th>Lead</Th><Th>Contact</Th><Th>Interest</Th><Th>Preferences</Th><Th>Status</Th><Th>Received</Th></>}>
          {rows.length === 0 ? (
            <EmptyRow colSpan={6} label="No enquiries yet — website leads will appear here." />
          ) : rows.map((e) => (
            <tr key={e.id} className="align-top hover:bg-surface-muted/40">
              <Td>
                <div className="font-semibold text-brand-navy">{e.fullName}</div>
                {e.travelType && <div className="text-xs text-ink-muted">{e.travelType}</div>}
              </Td>
              <Td>
                <a href={`tel:+91${e.phone}`} className="font-medium text-brand-blue hover:underline">+91 {e.phone}</a>
                {e.email && <div className="text-xs text-ink-muted">{e.email}</div>}
              </Td>
              <Td>
                <div className="text-sm">{e.packageName ?? e.destination ?? "—"}</div>
                <div className="text-xs text-ink-muted">
                  {[
                    e.adults != null ? `${e.adults} adult${e.adults === 1 ? "" : "s"}` : (e.travellers ? `${e.travellers} pax` : null),
                    e.children ? `${e.children} child${e.children === 1 ? "" : "ren"}` : null,
                    e.travelDate || null,
                  ].filter(Boolean).join(" · ") || "—"}
                </div>
              </Td>
              <Td className="text-xs text-ink-muted">
                {[
                  e.roomType || null,
                  e.flightType && e.flightType !== "Not required" ? `${e.flightType} flights` : null,
                  e.hotelCategory && e.hotelCategory !== "Any" ? e.hotelCategory : null,
                  e.preferredTime && e.preferredTime !== "Anytime" ? `Call ${e.preferredTime}` : null,
                ].filter(Boolean).join(" · ") || "—"}
                {e.message && <div className="mt-1 max-w-[220px] truncate italic text-ink-faint">“{e.message}”</div>}
              </Td>
              <Td>
                <form action={updateEnquiryStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={e.id} />
                  <span className="mb-1 block"><Pill tone={STATUS_TONE[e.status] ?? "neutral"}>{e.status}</Pill></span>
                  <select
                    name="status"
                    defaultValue={e.status}
                    className="rounded-lg border border-surface-border bg-white px-2 py-1 text-xs focus:border-brand-blue focus:outline-none"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button type="submit" className="rounded-lg bg-brand-blue px-2 py-1 text-xs font-semibold text-white hover:bg-brand-blueDark">Save</button>
                </form>
              </Td>
              <Td className="whitespace-nowrap text-ink-muted">{formatDate(e.createdAt)}</Td>
            </tr>
          ))}
        </Table>
        <AdminPager page={page} totalPages={totalPages} base="/admin/enquiries" />
      </Panel>
    </>
  );
}
