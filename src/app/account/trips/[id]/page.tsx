import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoginFlow } from "@/components/auth/login-flow";
import { getCurrentCustomer } from "@/lib/auth";
import { db } from "@/lib/db";
import { BOOKING_STATUS_META, DOCUMENT_TYPE_LABEL } from "@/lib/constants";
import { formatINR, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Trip details", robots: { index: false } };

const COMPONENT_TONE: Record<string, "success" | "warning" | "danger"> = {
  CONFIRMED: "success", PENDING: "warning", FAILED: "danger",
};

export default async function TripDetailPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const customer = await getCurrentCustomer();
  if (!customer) return <Container className="py-12 sm:py-16"><LoginFlow /></Container>;

  const { id } = await params;
  const sp = await searchParams;
  const justPaid = sp.paid === "1";
  const justCreated = sp.created === "1";
  const booking = await db.booking.findFirst({
    where: { id, customerId: customer.id }, // ownership enforced
    include: {
      package: { select: { name: true } },
      items: { orderBy: { sortOrder: "asc" } },
      componentStatuses: true,
      events: { orderBy: { createdAt: "desc" } },
      documents: true,
      travellers: true,
    },
  });
  if (!booking) notFound();

  const meta = BOOKING_STATUS_META[booking.status] ?? { label: booking.status, tone: "neutral" as const };

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: "Account", href: "/account" }, { label: "My Trips", href: "/account/trips" }, { label: booking.reference }]} />
      <div className="mt-4 flex items-center gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">{booking.package.name}</h1>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>
      <p className="mt-1 text-ink-muted">Ref {booking.reference} · {booking.travellerCount} traveller{booking.travellerCount > 1 ? "s" : ""}{booking.travelDate ? ` · ${formatDate(booking.travelDate)}` : ""}</p>

      {(justPaid || justCreated) && (
        <div className={`mt-5 rounded-xl border p-4 text-sm ${justPaid ? "border-success/30 bg-[#E7F6EC] text-success" : "border-brand-blue/20 bg-brand-blueLight text-brand-blue"}`}>
          {justPaid
            ? "Payment verified — your booking is now being processed. We'll confirm each component and email your documents."
            : "Booking created. Payment isn't enabled in this environment, so it's held as payment pending — add Razorpay keys to complete the charge."}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card><CardBody>
            <h2 className="text-lg font-bold">Component status</h2>
            {booking.componentStatuses.length ? (
              <ul className="mt-3 space-y-2">
                {booking.componentStatuses.map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{c.component}</span>
                    <Badge tone={COMPONENT_TONE[c.status] ?? "neutral"}>{c.status}</Badge>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-sm text-ink-muted">Component tracking will appear once your booking is processing.</p>}
          </CardBody></Card>

          <Card><CardBody>
            <h2 className="text-lg font-bold">Timeline</h2>
            {booking.events.length ? (
              <ol className="mt-3 space-y-3">
                {booking.events.map((e) => (
                  <li key={e.id} className="flex gap-3 text-sm">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-blue" />
                    <div>
                      <p className="font-medium">{BOOKING_STATUS_META[e.toStatus]?.label ?? e.toStatus}</p>
                      {e.message && <p className="text-ink-muted">{e.message}</p>}
                      <p className="text-xs text-ink-faint">{formatDate(e.createdAt, { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : <p className="mt-2 text-sm text-ink-muted">No updates yet.</p>}
          </CardBody></Card>
        </div>

        <div className="space-y-6">
          <Card><CardBody>
            <h2 className="text-lg font-bold">Documents</h2>
            {booking.documents.length === 0 ? (
              <p className="mt-2 text-sm text-ink-muted">Your tickets, vouchers and invoice will appear here once your booking is confirmed.</p>
            ) : (
              <ul className="mt-3 divide-y divide-surface-border">
                {booking.documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-brand-blue" />
                      <span className="min-w-0"><span className="block truncate font-medium">{d.title}</span><span className="text-xs text-ink-muted">{DOCUMENT_TYPE_LABEL[d.type] ?? d.type}</span></span>
                    </span>
                    <a href={`/api/documents/${d.id}`} target="_blank" rel="noreferrer" className="shrink-0 font-semibold text-brand-blue hover:underline">Open</a>
                  </li>
                ))}
              </ul>
            )}
          </CardBody></Card>

          <Card><CardBody>
            <h2 className="text-lg font-bold">Price</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {booking.items.map((it) => (
                <li key={it.id} className="flex justify-between"><span className="text-ink-muted">{it.label}</span><span>{formatINR(it.amount)}</span></li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-surface-border pt-3 font-semibold">
              <span>Total</span><span>{formatINR(booking.totalAmount)}</span>
            </div>
          </CardBody></Card>
        </div>
      </div>
    </Container>
  );
}
