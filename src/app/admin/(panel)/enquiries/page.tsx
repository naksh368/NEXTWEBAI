import Link from "next/link";
import { Download, Phone, MessageCircle, Mail, Search } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, StatCard, Panel, Table, Th, Td, EmptyRow, Pill, AdminPager } from "@/components/admin/ui";
import { EnquiryRowForm } from "@/components/admin/enquiry-row-form";
import { ENQUIRY_STATUS, ENQUIRY_STATUS_META, ENQUIRY_OPEN_STATUSES, ENQUIRY_CLOSED_STATUSES } from "@/lib/constants";
import { getSiteSettings } from "@/lib/site-settings";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

const toDateInput = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");

/** Strip a phone to digits so tel:/wa.me links work whatever format was typed. */
const phoneDigits = (phone: string) => phone.replace(/\D/g, "");

type SearchParams = Promise<{ page?: string; status?: string; q?: string }>;

export default async function AdminEnquiriesPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin("enquiry.view");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const status = sp.status && ENQUIRY_STATUS_META[sp.status] ? sp.status : "";
  const q = (sp.q ?? "").trim();
  const now = new Date();
  const settings = await getSiteSettings();

  const where: Prisma.EnquiryWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { email: { contains: q, mode: "insensitive" } },
            { reference: { contains: q, mode: "insensitive" } },
            { packageName: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, filtered, newCount, confirmedCount, followUpsDue, staff, responded, rows] = await Promise.all([
    db.enquiry.count(),
    db.enquiry.count({ where }),
    db.enquiry.count({ where: { status: "NEW" } }),
    db.enquiry.count({ where: { status: { in: ["CONFIRMED", "WON"] } } }),
    db.enquiry.count({ where: { followUpAt: { lte: now }, status: { notIn: [...ENQUIRY_CLOSED_STATUSES] } } }),
    db.adminUser.findMany({ where: { status: "ACTIVE" }, select: { id: true, fullName: true }, orderBy: { fullName: "asc" } }),
    db.enquiry.findMany({ where: { firstRespondedAt: { not: null } }, select: { createdAt: true, firstRespondedAt: true }, orderBy: { createdAt: "desc" }, take: 200 }),
    db.enquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { assignedTo: { select: { fullName: true } } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered / PAGE_SIZE));

  // Average first-response time, measured from real timestamps.
  const durations = responded
    .map((e) => (e.firstRespondedAt ? e.firstRespondedAt.getTime() - e.createdAt.getTime() : 0))
    .filter((ms) => ms > 0);
  const avgMs = durations.length ? durations.reduce((s, ms) => s + ms, 0) / durations.length : 0;
  const avgResponse = !durations.length
    ? "—"
    : avgMs < 3_600_000 ? `${Math.round(avgMs / 60_000)} min`
    : avgMs < 86_400_000 ? `${(avgMs / 3_600_000).toFixed(1)} h`
    : `${(avgMs / 86_400_000).toFixed(1)} d`;

  const filterQs = new URLSearchParams();
  if (status) filterQs.set("status", status);
  if (q) filterQs.set("q", q);
  const base = `/admin/enquiries${filterQs.toString() ? `?${filterQs}` : ""}`;
  const exportHref = `/api/admin/enquiries/export${filterQs.toString() ? `?${filterQs}` : ""}`;

  return (
    <>
      <PageHeader
        title="Enquiries"
        subtitle="Travel leads submitted from the website. Internal notes stay here — they are never shown to the customer."
        action={
          <a href={exportHref} className="inline-flex h-10 items-center gap-2 rounded-xl border border-surface-border bg-white px-4 text-sm font-bold text-ink hover:border-brand-blue hover:text-brand-blue">
            <Download className="h-4 w-4" /> Export CSV{status || q ? " (filtered)" : ""}
          </a>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total enquiries" value={total} tone="navy" />
        <StatCard label="New" value={newCount} tone="orange" hint="Not yet contacted" />
        <StatCard label="Follow-ups due" value={followUpsDue} tone="orange" hint="Scheduled for today or earlier" />
        <StatCard label="Avg first response" value={avgResponse} tone="blue" hint="Received → first action" />
        <StatCard label="Confirmed" value={confirmedCount} tone="green" />
      </div>

      {/* Filters — plain GET form so the view is shareable and needs no JS. */}
      <form method="GET" action="/admin/enquiries" className="mb-5 flex flex-col gap-3 rounded-2xl border border-surface-border bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, phone, email, reference or package"
            aria-label="Search enquiries"
            className="h-10 w-full rounded-xl border border-surface-border pl-9 pr-3 text-sm focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10"
          />
        </div>
        <select
          name="status"
          defaultValue={status}
          aria-label="Filter by status"
          className="h-10 rounded-xl border border-surface-border bg-white px-3 text-sm font-semibold focus:border-brand-blue focus:outline-none"
        >
          <option value="">All statuses</option>
          {ENQUIRY_STATUS.map((s) => (
            <option key={s} value={s}>{ENQUIRY_STATUS_META[s].label}</option>
          ))}
        </select>
        <button type="submit" className="h-10 rounded-xl bg-brand-blue px-5 text-sm font-bold text-white hover:bg-brand-blueDark">
          Apply
        </button>
        {(status || q) && (
          <Link href="/admin/enquiries" className="inline-flex h-10 items-center rounded-xl px-3 text-sm font-bold text-ink-muted hover:text-brand-blue">
            Clear
          </Link>
        )}
      </form>

      <Panel>
        <Table head={<><Th>Lead</Th><Th>Contact</Th><Th>Interest</Th><Th>Manage</Th><Th>Received</Th></>}>
          {rows.length === 0 ? (
            <EmptyRow colSpan={5} label={status || q ? "No enquiries match those filters." : "No enquiries yet — website leads will appear here."} />
          ) : rows.map((e) => {
            const due = !!e.followUpAt && new Date(e.followUpAt) <= now && !ENQUIRY_CLOSED_STATUSES.includes(e.status as never);
            const meta = ENQUIRY_STATUS_META[e.status] ?? { label: e.status, tone: "neutral" as const };
            const digits = phoneDigits(e.phone);
            const waText = `Hello ${e.fullName.split(" ")[0]}, this is ${settings.brandName} regarding your enquiry ${e.reference ?? ""}.`;

            return (
              <tr key={e.id} className={`align-top hover:bg-surface-muted/40 ${due ? "bg-brand-orangeLight/30" : ""}`}>
                <Td>
                  <div className="font-semibold text-brand-navy">{e.fullName}</div>
                  {e.reference && <div className="tabular text-xs font-bold text-brand-blue">{e.reference}</div>}
                  {e.travelType && <div className="text-xs text-ink-muted">{e.travelType}</div>}
                </Td>

                <Td>
                  <a href={`tel:${digits.startsWith("91") || digits.length > 10 ? `+${digits}` : digits}`} className="inline-flex items-center gap-1.5 font-semibold text-brand-blue hover:underline">
                    <Phone className="h-3.5 w-3.5" /> {e.phone}
                  </a>
                  <div className="mt-1.5 flex flex-wrap gap-2.5 text-xs">
                    {settings.whatsappEnabled && (
                      <a
                        href={`https://wa.me/${digits.length > 10 ? digits : `91${digits}`}?text=${encodeURIComponent(waText)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-[#128C4B] hover:underline"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                    )}
                    {e.email && (
                      <a
                        href={`mailto:${e.email}?subject=${encodeURIComponent(`Your ${settings.brandName} enquiry ${e.reference ?? ""}`)}`}
                        className="inline-flex items-center gap-1 font-semibold text-ink-muted hover:text-brand-blue hover:underline"
                      >
                        <Mail className="h-3.5 w-3.5" /> Email
                      </a>
                    )}
                  </div>
                  {e.email && <div className="mt-1 break-all text-xs text-ink-muted">{e.email}</div>}
                </Td>

                <Td>
                  <div className="text-sm font-medium">{e.packageName ?? e.destination ?? "—"}</div>
                  <div className="mt-0.5 text-xs text-ink-muted">
                    {[
                      e.adults ? `${e.adults} adult${e.adults > 1 ? "s" : ""}` : e.travellers ? `${e.travellers} pax` : null,
                      e.children ? `${e.children} child${e.children > 1 ? "ren" : ""}` : null,
                      e.nights ? `${e.nights} nights` : null,
                      e.travelDate || null,
                      e.budget || null,
                    ].filter(Boolean).join(" · ") || "—"}
                  </div>
                  {e.message && (
                    <p className="mt-1.5 max-w-[240px] text-xs italic leading-relaxed text-ink-faint">“{e.message}”</p>
                  )}
                </Td>

                <Td className="min-w-[230px]">
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <Pill tone={meta.tone}>{meta.label}</Pill>
                    {due && <Pill tone="warning">Follow-up due</Pill>}
                  </div>
                  <EnquiryRowForm
                    id={e.id}
                    status={e.status}
                    assignedToId={e.assignedToId}
                    followUpAt={toDateInput(e.followUpAt)}
                    internalNotes={e.internalNotes ?? ""}
                    staff={staff}
                  />
                  <Link href={`/admin/quotes?enquiryId=${e.id}`} className="mt-2 inline-block text-xs font-bold text-brand-orange hover:underline">
                    Create a quote →
                  </Link>
                </Td>

                <Td className="whitespace-nowrap text-ink-muted">{formatDate(e.createdAt)}</Td>
              </tr>
            );
          })}
        </Table>
        <AdminPager page={page} totalPages={totalPages} base={base} />
      </Panel>

      <p className="mt-4 text-xs text-ink-muted">
        Showing {rows.length} of {filtered} matching {filtered === 1 ? "enquiry" : "enquiries"}
        {filtered !== total ? ` (${total} in total)` : ""}. Open statuses: {ENQUIRY_OPEN_STATUSES.map((s) => ENQUIRY_STATUS_META[s].label).join(", ")}.
      </p>
    </>
  );
}
