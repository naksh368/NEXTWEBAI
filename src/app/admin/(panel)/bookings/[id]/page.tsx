import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin, hasPermission } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageHeader, Panel, Pill } from "@/components/admin/ui";
import { BookingStatusControl, ComponentStatusControl, AddNoteForm } from "@/components/admin/booking-actions";
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
      package: { select: { name: true, slug: true } },
      packageVersion: { select: { versionNumber: true } },
      items: { orderBy: { sortOrder: "asc" } },
      travellers: true,
      componentStatuses: { orderBy: { component: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
      refunds: true,
      events: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!booking) notFound();

  const meta = BOOKING_STATUS_META[booking.status] ?? { label: booking.status, tone: "neutral" as const };
  const allowed = BOOKING_TRANSITIONS[booking.status as BookingStatus] ?? [];

  return (
    <>
      <Link href="/admin/bookings" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-brand-blue"><ArrowLeft className="h-4 w-4" /> Bookings</Link>
      <PageHeader
        title={booking.package.name}
        subtitle={`Ref ${booking.reference} · v${booking.packageVersion.versionNumber} · ${booking.travellerCount} traveller${booking.travellerCount > 1 ? "s" : ""}`}
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
            </div>
          </Panel>

          <Panel title="Travellers">
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
