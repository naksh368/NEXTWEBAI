import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, Map, Download, AlertCircle, CreditCard, Phone, MessageCircle, CheckCircle2, Circle, Headset } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/auth";
import { db } from "@/lib/db";
import { BOOKING_STATUS_META, DOCUMENT_TYPE_LABEL } from "@/lib/constants";
import { formatINR, formatDate } from "@/lib/utils";
import { BookingStatusWatcher } from "@/components/account/booking-status-watcher";
import { TripProgress } from "@/components/account/trip-progress";
import { WhatHappensNext } from "@/components/account/what-happens-next";
import { isRazorpayTestMode } from "@/lib/services/razorpay-service";

export const metadata: Metadata = { title: "Trip details", robots: { index: false } };
export const dynamic = "force-dynamic";
export const revalidate = 0;

const COMPONENT_TONE: Record<string, "success" | "warning" | "danger"> = {
  CONFIRMED: "success", PENDING: "warning", FAILED: "danger",
};

/**
 * Single source of truth for the customer-facing status banner. Everything is
 * derived from the backend booking.status — never from URL params — so the page
 * can never show two contradictory statuses at once.
 */
type BannerTone = "warning" | "info" | "success" | "danger" | "neutral";
const STATUS_VIEW: Record<string, { tone: BannerTone; title: string; body: string; needsPayment?: boolean }> = {
  DRAFT: { tone: "warning", title: "Payment pending", body: "Complete the payment to secure your trip.", needsPayment: true },
  PAYMENT_PENDING: { tone: "warning", title: "Payment pending", body: "Complete the payment to secure your trip. You'll receive confirmation and documents once verified.", needsPayment: true },
  PAYMENT_PROCESSING: { tone: "info", title: "Payment received", body: "We're verifying your payment — this only takes a moment." },
  PAYMENT_RECEIVED: { tone: "info", title: "Payment received", body: "Payment verified. We're now confirming your travel components." },
  BOOKING_PROCESSING: { tone: "info", title: "Booking in progress", body: "Your booking is being confirmed. We'll email your documents as each component is secured." },
  SUPPLIER_CONFIRMATION_PENDING: { tone: "info", title: "Booking in progress", body: "Your booking is being confirmed with our travel partners." },
  CONFIRMED: { tone: "success", title: "Your holiday is confirmed 🎉", body: "Everything is booked. Your tickets, vouchers and invoice appear under Documents." },
  MODIFICATION_REQUESTED: { tone: "info", title: "Update in progress", body: "We're updating your booking as requested." },
  CANCELLATION_REQUESTED: { tone: "warning", title: "Cancellation requested", body: "Your cancellation request is being reviewed by our team." },
  CANCELLED: { tone: "neutral", title: "Booking cancelled", body: "This booking has been cancelled." },
  REFUND_PENDING: { tone: "info", title: "Refund in progress", body: "Your refund is being processed as per the cancellation policy." },
  PARTIAL_REFUND: { tone: "neutral", title: "Partial refund processed", body: "A partial refund has been processed to your original payment method." },
  REFUNDED: { tone: "neutral", title: "Refunded", body: "This booking has been refunded to your original payment method." },
  FAILED: { tone: "danger", title: "We're reviewing your booking", body: "We couldn't confirm one or more components. Our team is reviewing your booking and will be in touch — no action needed from you." },
  COMPLETED: { tone: "success", title: "Trip completed", body: "We hope you had a wonderful holiday. We'd love a review!" },
};

const BANNER_STYLE: Record<BannerTone, string> = {
  warning: "border-warning/40 bg-[#FFFBF0] text-warning",
  info: "border-brand-blue/20 bg-brand-blueLight text-brand-blue",
  success: "border-success/30 bg-[#E7F6EC] text-success",
  danger: "border-danger/30 bg-[#FCE9E9] text-danger",
  neutral: "border-surface-border bg-surface-muted/60 text-ink",
};

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/sign-in");

  const { id } = await params;
  const booking = await db.booking.findFirst({
    where: { id, customerId: customer.id }, // ownership enforced
    include: {
      package: { select: { name: true, slug: true } },
      assignedTo: { select: { fullName: true, mobile: true } },
      packageVersion: { select: { _count: { select: { days: true } } } },
      items: { orderBy: { sortOrder: "asc" } },
      componentStatuses: true,
      events: { orderBy: { createdAt: "desc" } },
      documents: true,
      travellers: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } },
    },
  });
  if (!booking) notFound();

  const meta = BOOKING_STATUS_META[booking.status] ?? { label: booking.status, tone: "neutral" as const };
  let view = STATUS_VIEW[booking.status] ?? { tone: "neutral" as BannerTone, title: meta.label, body: "" };
  // Payment awaiting + last attempt failed → show a retry-focused payment-failed state.
  if (booking.status === "PAYMENT_PENDING" && booking.payments[0]?.status === "FAILED") {
    view = { tone: "danger", title: "Payment didn't go through", body: "Your last payment attempt failed or was cancelled. Please try again to secure your trip.", needsPayment: true };
  }

  // Trip-ready checklist — real backend signals only (never a fake %).
  const paid = ["PAYMENT_RECEIVED", "BOOKING_PROCESSING", "SUPPLIER_CONFIRMATION_PENDING", "CONFIRMED", "COMPLETED"].includes(booking.status) || booking.payments[0]?.status === "PAID";
  const comps = booking.componentStatuses;
  const readySteps = [
    { label: "Payment received", done: paid },
    { label: "Traveller details", done: booking.travellers.length > 0 },
    { label: "Travel components confirmed", done: comps.length > 0 && comps.every((c) => c.status === "CONFIRMED") },
    { label: "Documents ready", done: booking.documents.length > 0 },
  ];
  const readyDone = readySteps.filter((s) => s.done).length;
  const readyPct = Math.round((readyDone / readySteps.length) * 100);
  const readyRemaining = readySteps.length - readyDone;
  const showTripReady = paid && booking.status !== "CANCELLED" && booking.status !== "REFUNDED";

  // Assigned specialist WhatsApp/call links (their own number).
  const expert = booking.assignedTo;
  const expertDigits = (expert?.mobile ?? "").replace(/[^\d]/g, "");
  const expertWa = expertDigits ? `https://wa.me/${expertDigits.length === 10 ? `91${expertDigits}` : expertDigits}?text=${encodeURIComponent(`Hi, I'm ${customer.fullName ?? "a customer"} — regarding my booking ${booking.reference}.`)}` : null;

  return (
    <Container className="py-8">
      <BookingStatusWatcher bookingId={booking.id} currentStatus={booking.status} />
      <Breadcrumbs items={[{ label: "Account", href: "/account" }, { label: "My Trips", href: "/account/trips" }, { label: booking.reference }]} />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">{booking.package.name}</h1>
        <Badge tone={meta.tone}>{meta.label}</Badge>
        {isRazorpayTestMode() && <Badge tone="warning">TEST MODE</Badge>}
      </div>
      <p className="mt-1 text-ink-muted">Ref {booking.reference} · {booking.travellerCount} traveller{booking.travellerCount > 1 ? "s" : ""}{booking.departureCity ? ` · From ${booking.departureCity}` : ""}{booking.travelDate ? ` · ${formatDate(booking.travelDate)}` : ""}</p>

      {/* One canonical status banner — always derived from backend booking.status */}
      <div className={`mt-5 rounded-xl border p-4 ${BANNER_STYLE[view.tone]}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold">{view.title}</h3>
            {view.body && <p className="mt-1 text-sm opacity-90">{view.body}</p>}
            {view.needsPayment && (
              <div className="mt-4">
                <Link href={`/packages/${booking.package.slug}/checkout?edit=${booking.id}`}>
                  <Button variant="orange" size="sm" className="w-full sm:w-auto">
                    <CreditCard className="h-4 w-4" /> Pay {formatINR(booking.totalAmount)}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <TripProgress status={booking.status} documentCount={booking.documents.length} />
      <WhatHappensNext status={booking.status} />

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
          {showTripReady && (
            <Card><CardBody>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Trip ready</h2>
                <span className="text-lg font-extrabold text-brand-blue">{readyPct}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted">
                <div className="h-full rounded-full bg-brand-blue transition-all" style={{ width: `${readyPct}%` }} />
              </div>
              <ul className="mt-3 space-y-1.5">
                {readySteps.map((s) => (
                  <li key={s.label} className="flex items-center gap-2 text-sm">
                    {s.done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> : <Circle className="h-4 w-4 shrink-0 text-ink-faint" />}
                    <span className={s.done ? "text-ink" : "text-ink-muted"}>{s.label}</span>
                  </li>
                ))}
              </ul>
              {readyRemaining > 0 && <p className="mt-3 text-xs font-semibold text-ink-muted">{readyRemaining} thing{readyRemaining > 1 ? "s" : ""} remaining — we&apos;ll keep you posted.</p>}
            </CardBody></Card>
          )}

          {expert && (
            <Card><CardBody>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-orangeLight text-brand-orange"><Headset className="h-4 w-4" /></span>
                <h2 className="text-lg font-bold">Your ExpertzTrip specialist</h2>
              </div>
              <p className="mt-3 text-base font-bold text-brand-navy">{expert.fullName}</p>
              <p className="text-sm text-ink-muted">Looking after your booking — reach out any time.</p>
              {expert.mobile && (
                <div className="mt-3 flex gap-2">
                  {expertWa && (
                    <a href={expertWa} target="_blank" rel="noreferrer" className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] text-sm font-semibold text-white transition-colors hover:brightness-95">
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                  )}
                  <a href={`tel:+${expertDigits.length === 10 ? `91${expertDigits}` : expertDigits}`} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-brand-blue/30 text-sm font-semibold text-brand-blue transition-colors hover:bg-brand-blueLight">
                    <Phone className="h-4 w-4" /> Call
                  </a>
                </div>
              )}
            </CardBody></Card>
          )}

          <Card><CardBody>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blueLight text-brand-blue"><Map className="h-4 w-4" /></span>
              <h2 className="text-lg font-bold">Itinerary</h2>
            </div>
            <p className="mt-2 text-sm text-ink-muted">
              {booking.packageVersion._count.days > 0
                ? "Your personalised day-by-day itinerary, inclusions and price — branded and ready to download."
                : "Your itinerary with inclusions and price summary — branded and ready to download."}
            </p>
            <Link
              href={`/account/trips/${booking.id}/itinerary`}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-blueDark"
            >
              <Download className="h-4 w-4" /> View &amp; download itinerary
            </Link>
          </CardBody></Card>

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
