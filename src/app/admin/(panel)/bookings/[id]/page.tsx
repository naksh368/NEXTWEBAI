import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin, hasPermission } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, Panel, Pill } from "@/components/admin/ui";
import { BookingStatusControl, ComponentStatusControl, AddNoteForm, AssignSpecialistControl } from "@/components/admin/booking-actions";
import { DocumentManager } from "@/components/admin/document-upload";
import { BOOKING_STATUS_META } from "@/lib/constants";
import { BOOKING_TRANSITIONS } from "@/lib/booking-states";
import { formatINR, formatDate } from "@/lib/utils";
import type { BookingStatus } from "@/lib/constants";

export const dynamic = "force-dynamic";

const COMPONENT_TONE: Record<string, string> = { CONFIRMED: "success", PENDING: "warning", FAILED: "danger" };

export default async function AdminBookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin("booking.view");
  const canUpdate = hasPermission(admin, "booking.update");
  const { id } = await params;

  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      customer: { select: { fullName: true, mobile: true, email: true } },
      assignedTo: { select: { id: true, fullName: true } },
      package: { select: { name: true, slug: true } },
      packageVersion: { select: { versionNumber: true } },
      items: { orderBy: { sortOrder: "asc" } },
      travellers: true,
      componentStatuses: { orderBy: { component: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
      refunds: true,
      documents: { orderBy: { createdAt: "desc" } },
      events: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!booking) notFound();

  // Staff list for assignment + the email/communication log for this booking.
  const [staff, messages] = await Promise.all([
    db.adminUser.findMany({ where: { status: "ACTIVE" }, select: { id: true, fullName: true }, orderBy: { fullName: "asc" } }),
    db.messageLog.findMany({ where: { bookingId: id }, orderBy: { createdAt: "desc" }, take: 25 }),
  ]);

  const meta = BOOKING_STATUS_META[booking.status] ?? { label: booking.status, tone: "neutral" as const };
  const allowed = BOOKING_TRANSITIONS[booking.status as BookingStatus] ?? [];

  return (
    <>
      <Link href="/admin/bookings" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-brand-blue"><ArrowLeft className="h-4 w-4" /> Bookings</Link>
      <PageHeader
        title={booking.package.name}
        subtitle={`Ref ${booking.reference} · v${booking.packageVersion.versionNumber} · ${booking.travellerCount} traveller${booking.travellerCount > 1 ? "s" : ""} · ${formatINR(booking.totalAmount)} · ${booking.assignedTo ? `Assigned to ${booking.assignedTo.fullName}` : "Unassigned"}`}
        action={<Pill tone={meta.tone}>{meta.label}</Pill>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Customer">
            <div className="grid grid-cols-2 gap-4 p-5 text-sm">
              <div><p className="text-ink-faint">Name</p><p className="font-medium">{booking.customer.fullName ?? "—"}</p></div>
              <div><p className="text-ink-faint">Mobile</p><p className="font-medium">{booking.customer.mobile}</p></div>
              <div><p className="text-ink-faint">Email</p><p className="font-medium">{booking.customer.email ?? "—"}</p></div>
              <div><p className="text-ink-faint">Travel date</p><p className="font-medium">{booking.travelDate ? formatDate(booking.travelDate) : "—"}</p></div>
              <div><p className="text-ink-faint">Departure city</p><p className="font-medium">{booking.departureCity ?? "—"}</p></div>
            </div>
          </Panel>

          <Panel title="Travellers">
            {(() => {
              const b = booking.travellerBreakdown as { adults?: number; children?: number; childrenAges?: number[]; infants?: number; rooms?: number } | null;
              if (!b) return null;
              const parts = [
                b.adults ? `${b.adults} adult${b.adults > 1 ? "s" : ""}` : null,
                b.children ? `${b.children} child${b.children > 1 ? "ren" : ""}${b.childrenAges?.length ? ` (ages ${b.childrenAges.join(", ")})` : ""}` : null,
                b.infants ? `${b.infants} infant${b.infants > 1 ? "s" : ""}` : null,
                b.rooms ? `${b.rooms} room${b.rooms > 1 ? "s" : ""}` : null,
              ].filter(Boolean).join(" · ");
              return <p className="border-b border-surface-border bg-surface-muted/40 px-5 py-2.5 text-xs font-medium text-ink-muted">{parts}</p>;
            })()}
            <ul className="divide-y divide-surface-border">
              {booking.travellers.map((t) => (
                <li key={t.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="font-medium">{t.fullName}</span>
                  <span className="text-ink-muted">{t.type}{t.passportNo ? ` · ${t.passportNo}` : ""}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Component status" action={canUpdate ? <span className="text-xs text-ink-faint">Confirm each before marking the booking Confirmed</span> : null}>
            <ul className="divide-y divide-surface-border">
              {booking.componentStatuses.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm font-medium">{c.component}</span>
                  {canUpdate ? <ComponentStatusControl bookingId={booking.id} component={c.component} status={c.status} />
                    : <Pill tone={COMPONENT_TONE[c.status] ?? "neutral"}>{c.status}</Pill>}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Documents" action={<span className="text-xs text-ink-faint">Tickets, vouchers, invoices, passport/PAN</span>}>
            {canUpdate ? (
              <DocumentManager bookingId={booking.id} initial={booking.documents.map((d) => ({ id: d.id, type: d.type, title: d.title, createdAt: d.createdAt }))} />
            ) : (
              <ul className="divide-y divide-surface-border">
                {booking.documents.length === 0 ? <li className="px-5 py-4 text-sm text-ink-muted">No documents.</li> : booking.documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span>{d.title}</span>
                    <a href={`/api/documents/${d.id}`} target="_blank" rel="noreferrer" className="text-brand-blue hover:underline">Open</a>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Communication" action={<span className="text-xs text-ink-faint">Emails sent for this booking</span>}>
            {messages.length === 0 ? (
              <p className="px-5 py-4 text-sm text-ink-muted">No emails logged yet.</p>
            ) : (
              <ul className="divide-y divide-surface-border">
                {messages.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{m.event}</span>
                      <span className="text-xs text-ink-muted">{m.channel} · {m.toAddress} · {formatDate(m.createdAt, { hour: "2-digit", minute: "2-digit" })}</span>
                    </span>
                    <Pill tone={m.status === "SENT" ? "success" : m.status === "FAILED" ? "danger" : "neutral"}>{m.status}</Pill>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Timeline" action={canUpdate ? null : undefined}>
            <div className="space-y-4 p-5">
              {canUpdate && <AddNoteForm bookingId={booking.id} />}
              <ol className="space-y-3">
                {booking.events.map((e) => (
                  <li key={e.id} className="flex gap-3 text-sm">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-blue" />
                    <div>
                      <p className="font-medium">{BOOKING_STATUS_META[e.toStatus]?.label ?? e.toStatus}</p>
                      {e.message && <p className="text-ink-muted">{e.message}</p>}
                      <p className="text-xs text-ink-faint">{formatDate(e.createdAt, { hour: "2-digit", minute: "2-digit" })} · {e.actor}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          {canUpdate && (
            <Panel title="Assigned specialist" action={<span className="text-xs text-ink-faint">Customer&apos;s point of contact</span>}>
              <div className="p-5"><AssignSpecialistControl bookingId={booking.id} current={booking.assignedTo?.id ?? null} staff={staff.map((s) => ({ id: s.id, name: s.fullName }))} /></div>
            </Panel>
          )}

          {canUpdate && (
            <Panel title="Update status">
              <div className="p-5"><BookingStatusControl bookingId={booking.id} current={booking.status} allowed={allowed} /></div>
            </Panel>
          )}

          <Panel title="Payment">
            <div className="space-y-2 p-5 text-sm">
              {booking.payments.length === 0 ? <p className="text-ink-muted">No payment recorded.</p> : booking.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <span className="text-ink-muted">{p.provider} · {formatINR(p.amount)}</span>
                  <Pill tone={p.status === "PAID" ? "success" : p.status === "FAILED" ? "danger" : "warning"}>{p.status}</Pill>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Price">
            <div className="space-y-1.5 p-5 text-sm">
              {booking.items.map((it) => (
                <div key={it.id} className="flex justify-between"><span className="text-ink-muted">{it.label}</span><span className="tabular-nums">{formatINR(it.amount)}</span></div>
              ))}
              <div className="mt-2 flex justify-between border-t border-surface-border pt-2 font-semibold"><span>Total</span><span>{formatINR(booking.totalAmount)}</span></div>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
