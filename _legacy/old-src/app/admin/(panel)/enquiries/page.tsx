import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, StatCard, Panel, Table, Th, Td, EmptyRow, Pill, AdminPager } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";
import { updateEnquiryStatus } from "./actions";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

const STATUS_TONE: Record<string, "info" | "warning" | "success" | "neutral" | "brand" | "danger"> = {
  NEW: "brand",
  CONTACTED: "info",
  QUALIFIED: "info",
  QUOTE_SENT: "warning",
  FOLLOW_UP: "warning",
  NEGOTIATION: "warning",
  WON: "success",
  LOST: "danger",
};
const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "QUOTE_SENT", "FOLLOW_UP", "NEGOTIATION", "WON", "LOST"];

const toDateInput = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");

export default async function AdminEnquiriesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin("customer.view");
  const page = Math.max(1, Number((await searchParams).page ?? 1) || 1);
  const now = new Date();

  const [total, newCount, convertedCount, followUpsDue, staff, responded, rows] = await Promise.all([
    db.enquiry.count(),
    db.enquiry.count({ where: { status: "NEW" } }),
    db.enquiry.count({ where: { status: "WON" } }),
    db.enquiry.count({ where: { followUpAt: { lte: now }, status: { notIn: ["WON", "LOST"] } } }),
    db.adminUser.findMany({ where: { status: "ACTIVE" }, select: { id: true, fullName: true }, orderBy: { fullName: "asc" } }),
    db.enquiry.findMany({ where: { firstRespondedAt: { not: null } }, select: { createdAt: true, firstRespondedAt: true }, orderBy: { createdAt: "desc" }, take: 200 }),
    db.enquiry.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { assignedTo: { select: { fullName: true } } },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Average first-response time (real, from firstRespondedAt − createdAt).
  const durations = responded
    .map((e) => (e.firstRespondedAt ? e.firstRespondedAt.getTime() - e.createdAt.getTime() : 0))
    .filter((ms) => ms > 0);
  const avgMs = durations.length ? durations.reduce((s, ms) => s + ms, 0) / durations.length : 0;
  const avgResponse = !durations.length ? "—" : avgMs < 3600_000 ? `${Math.round(avgMs / 60000)} min` : avgMs < 86400_000 ? `${(avgMs / 3600_000).toFixed(1)} h` : `${(avgMs / 86400_000).toFixed(1)} d`;

  return (
    <>
      <PageHeader title="Enquiries" subtitle="Travel leads submitted from the website." />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard label="Total leads" value={total} tone="navy" />
        <StatCard label="New" value={newCount} tone="orange" hint="Needs follow-up" />
        <StatCard label="Follow-ups due" value={followUpsDue} tone="orange" hint="Chase now" />
        <StatCard label="Avg 1st response" value={avgResponse} tone="blue" hint="createdAt → contacted" />
        <StatCard label="Won" value={convertedCount} tone="green" />
        <StatCard label="Conversion" value={total ? `${Math.round((convertedCount / total) * 100)}%` : "—"} tone="blue" />
      </div>

      <Panel>
        <Table head={<><Th>Lead</Th><Th>Contact</Th><Th>Interest</Th><Th>Manage</Th><Th>Received</Th></>}>
          {rows.length === 0 ? (
            <EmptyRow colSpan={5} label="No enquiries yet — website leads will appear here." />
          ) : rows.map((e) => {
            const due = !!e.followUpAt && new Date(e.followUpAt) <= now && !["WON", "LOST"].includes(e.status);
            return (
            <tr key={e.id} className={`align-top hover:bg-surface-muted/40 ${due ? "bg-brand-orangeLight/30" : ""}`}>
              <Td>
                <div className="font-semibold text-brand-navy">{e.fullName}</div>
                {e.reference && <div className="text-xs font-semibold text-brand-blue">{e.reference}</div>}
                {e.travelType && <div className="text-xs text-ink-muted">{e.travelType}</div>}
              </Td>
              <Td>
                <a href={`tel:+91${e.phone}`} className="font-medium text-brand-blue hover:underline">+91 {e.phone}</a>
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  <a href={`https://wa.me/91${e.phone}?text=${encodeURIComponent(`Hi ${e.fullName.split(" ")[0]}, this is ExpertzTrip regarding your enquiry ${e.reference ?? ""}.`)}`} target="_blank" rel="noreferrer" className="font-semibold text-[#128C4B] hover:underline">WhatsApp</a>
                  {e.email && <a href={`mailto:${e.email}?subject=${encodeURIComponent(`Your ExpertzTrip enquiry ${e.reference ?? ""}`)}`} className="text-ink-muted hover:underline">Email</a>}
                </div>
                {e.email && <div className="mt-0.5 text-xs text-ink-muted">{e.email}</div>}
              </Td>
              <Td>
                <div className="text-sm">{e.packageName ?? e.destination ?? "—"}</div>
                <div className="text-xs text-ink-muted">
                  {[
                    e.travellers ? `${e.travellers} pax` : null,
                    e.nights ? `${e.nights} nights` : null,
                    e.travelDate || null,
                    e.budget || null,
                  ].filter(Boolean).join(" · ") || "—"}
                </div>
                {e.message && <div className="mt-1 max-w-[220px] truncate italic text-ink-faint">“{e.message}”</div>}
              </Td>
              <Td>
                <form action={updateEnquiryStatus} className="space-y-1.5">
                  <input type="hidden" name="id" value={e.id} />
                  <div className="flex items-center gap-2">
                    <Pill tone={STATUS_TONE[e.status] ?? "neutral"}>{e.status}</Pill>
                    {due && <Pill tone="warning">Follow-up due</Pill>}
                  </div>
                  <select name="status" defaultValue={e.status} className="w-full rounded-lg border border-surface-border bg-white px-2 py-1 text-xs focus:border-brand-blue focus:outline-none">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select name="assignedToId" defaultValue={e.assignedToId ?? ""} className="w-full rounded-lg border border-surface-border bg-white px-2 py-1 text-xs focus:border-brand-blue focus:outline-none">
                    <option value="">Unassigned</option>
                    {staff.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                  </select>
                  <div className="flex items-center gap-2">
                    <input type="date" name="followUpAt" defaultValue={toDateInput(e.followUpAt)} title="Follow up on" className="flex-1 rounded-lg border border-surface-border bg-white px-2 py-1 text-xs focus:border-brand-blue focus:outline-none" />
                    <button type="submit" className="rounded-lg bg-brand-blue px-3 py-1 text-xs font-semibold text-white hover:bg-brand-blueDark">Save</button>
                  </div>
                </form>
                <Link href={`/admin/quotes?enquiryId=${e.id}`} className="mt-1.5 inline-block text-xs font-semibold text-brand-orange hover:underline">Create quote →</Link>
              </Td>
              <Td className="whitespace-nowrap text-ink-muted">{formatDate(e.createdAt)}</Td>
            </tr>
          );})}
        </Table>
        <AdminPager page={page} totalPages={totalPages} base="/admin/enquiries" />
      </Panel>
    </>
  );
}
