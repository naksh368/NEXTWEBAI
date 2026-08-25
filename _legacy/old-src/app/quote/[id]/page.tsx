import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, CheckCircle2, Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { LoginFlow } from "@/components/auth/login-flow";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { db } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/auth";
import { formatINR, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Your holiday quote", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await db.quote.findUnique({ where: { id }, include: { items: { orderBy: { sortOrder: "asc" } } } });
  if (!quote) notFound();

  const pkg = quote.packageId
    ? await db.package.findUnique({ where: { id: quote.packageId }, select: { slug: true, destination: { select: { country: true } } } })
    : null;
  const isDomestic = pkg?.destination.country === "India";
  const expired = quote.validUntil ? quote.validUntil < new Date() : false;
  const booked = Boolean(quote.bookingId);
  const acceptable = !booked && !expired && Boolean(quote.packageVersionId) && ["SENT", "DRAFT", "ACCEPTED"].includes(quote.status);
  const customer = await getCurrentCustomer();

  return (
    <Container className="py-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold sm:text-3xl">Your holiday quote</h1>
          <Badge tone={booked ? "success" : expired ? "warning" : "info"}>{booked ? "Booked" : expired ? "Expired" : quote.status}</Badge>
        </div>
        <p className="mt-1 text-ink-muted">Quote {quote.reference} · for {quote.customerName}</p>

        <Card className="mt-6"><CardBody>
          <h2 className="text-lg font-bold">{quote.title}</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-ink-faint">Travellers</dt><dd className="font-medium">{quote.travellerCount}</dd></div>
            {quote.travelDate && <div><dt className="text-ink-faint">Travel date</dt><dd className="font-medium">{quote.travelDate}</dd></div>}
            {quote.departureCity && <div><dt className="text-ink-faint">Departure city</dt><dd className="font-medium">{quote.departureCity}</dd></div>}
            {quote.validUntil && <div><dt className="text-ink-faint">Valid until</dt><dd className="font-medium">{formatDate(quote.validUntil)}</dd></div>}
          </dl>

          <div className="mt-4 space-y-1.5 border-t border-surface-border pt-4">
            {quote.items.map((it) => (
              <div key={it.id} className="flex justify-between text-sm"><span className="text-ink-muted">{it.label}</span><span className="tabular-nums">{formatINR(it.amount)}</span></div>
            ))}
            <div className="flex items-center justify-between border-t border-surface-border pt-2 font-semibold">
              <span>Total</span><span className="text-2xl font-extrabold text-brand-navy">{formatINR(quote.amount)}</span>
            </div>
          </div>

          {quote.notes && <p className="mt-4 rounded-xl bg-surface-muted/60 p-4 text-sm text-ink-muted">{quote.notes}</p>}
        </CardBody></Card>

        {booked ? (
          <Card className="mt-6"><CardBody className="text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
            <h2 className="mt-3 text-xl font-bold">This quote is already booked 🎉</h2>
            <p className="mt-1 text-ink-muted">You can track it any time in My Trips.</p>
            <Link href={`/account/trips/${quote.bookingId}`} className={buttonVariants({ variant: "orange", className: "mt-4" })}>View my trip</Link>
          </CardBody></Card>
        ) : expired ? (
          <Card className="mt-6"><CardBody className="text-center">
            <Clock className="mx-auto h-10 w-10 text-warning" />
            <h2 className="mt-3 text-xl font-bold">This quote has expired</h2>
            <p className="mt-1 text-ink-muted">Ask your ExpertzTrip specialist for a fresh quote — prices and availability may have changed.</p>
          </CardBody></Card>
        ) : acceptable ? (
          <Card className="mt-6"><CardBody>
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand-blue" />
              <h2 className="text-lg font-bold">Accept &amp; book — {formatINR(quote.amount)}</h2>
            </div>
            {customer ? (
              <CheckoutForm
                quoteId={quote.id}
                versionId={quote.packageVersionId!}
                travellerCount={quote.travellerCount}
                selectedOptionIds={[]}
                travelDate={quote.travelDate ?? null}
                departureCity={quote.departureCity}
                couponCode={null}
                total={quote.amount}
                prefillName={customer.fullName}
                isDomestic={isDomestic}
              />
            ) : (
              <>
                <div className="mb-4 flex items-center gap-2 text-sm text-ink-muted">
                  <Lock className="h-4 w-4 text-brand-blue" /> Sign in to accept this quote and pay securely.
                </div>
                <LoginFlow redirectTo={`/quote/${quote.id}`} />
              </>
            )}
          </CardBody></Card>
        ) : (
          <Card className="mt-6"><CardBody className="text-center text-ink-muted">
            This quote isn&apos;t available for online booking right now. Please contact your ExpertzTrip specialist to proceed.
          </CardBody></Card>
        )}
      </div>
    </Container>
  );
}
