import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, CreditCard, Info, ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card, CardBody } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { getPackageBySlug } from "@/lib/queries";
import { reprice } from "@/lib/services/pricing-service";
import { formatINR, formatDelta } from "@/lib/utils";

export const metadata: Metadata = { title: "Review & checkout", robots: { index: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function CheckoutPage({
  params, searchParams,
}: { params: Promise<{ slug: string }>; searchParams: SearchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const pkg = await getPackageBySlug(slug);
  if (!pkg) notFound();
  const v = pkg.currentVersion!;

  const travellers = Math.max(1, Number(first(sp.travellers) ?? 2) || 2);
  const optionIds = (first(sp.options) ?? "").split(",").filter(Boolean);
  const departureId = first(sp.departure) ?? null;
  const couponCode = first(sp.coupon) ?? null;

  // Reprice on the SERVER — this is the authoritative number (Phase 10/15).
  const result = await reprice({
    versionId: v.id, travellerCount: travellers,
    selectedOptionIds: optionIds, departureId, couponCode,
  });

  const razorpayConfigured = Boolean(process.env.RAZORPAY_KEY_ID);

  if (!result.ok) {
    return (
      <Container className="py-12">
        <Card><CardBody>
          <h1 className="text-xl font-bold text-danger">{result.error}</h1>
          <Link href={`/packages/${slug}`} className={buttonVariants({ variant: "outline", className: "mt-4" })}>
            <ArrowLeft className="h-4 w-4" /> Back to package
          </Link>
        </CardBody></Card>
      </Container>
    );
  }

  const b = result.breakdown;
  const selectedOptions = v.options.filter((o) => result.selectedOptionIds.includes(o.id));
  const departure = v.departures.find((d) => d.id === departureId);

  return (
    <Container className="py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Packages", href: "/packages" },
          { label: pkg.name, href: `/packages/${slug}` },
          { label: "Checkout" },
        ]}
      />
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Review your holiday</h1>
      <p className="mt-1 text-ink-muted">Everything below is priced and verified on our servers.</p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Trip */}
          <Card><CardBody>
            <h2 className="text-lg font-bold">{pkg.name}</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {pkg.destination.name} · {v.durationNights}N / {v.durationDays}D · {travellers} traveller{travellers > 1 ? "s" : ""}
              {departure ? ` · Departs ${new Date(departure.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}
            </p>
          </CardBody></Card>

          {/* Selected options */}
          <Card><CardBody>
            <h2 className="text-lg font-bold">Your selections</h2>
            <ul className="mt-3 divide-y divide-surface-border">
              {selectedOptions.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="text-ink">
                    <span className="text-xs uppercase tracking-wide text-ink-faint">{o.category}</span>
                    <br />
                    {o.label}
                  </span>
                  <span className="font-medium">{o.priceDelta === 0 ? "Included" : formatDelta(o.priceDelta * (o.perPerson ? travellers : 1))}</span>
                </li>
              ))}
            </ul>
          </CardBody></Card>

          {/* Traveller details note */}
          <Card><CardBody>
            <h2 className="text-lg font-bold">Traveller details</h2>
            <p className="mt-1 text-sm text-ink-muted">
              You&apos;ll add each traveller&apos;s name and passport details after verifying your mobile number.
            </p>
            <div className="mt-4 rounded-xl border border-dashed border-surface-border bg-surface-muted/50 p-4 text-sm text-ink-muted">
              <div className="flex items-start gap-2">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
                <span>
                  Sign in with your mobile number and OTP to continue. Your details are only ever collected over a
                  secure, verified session.
                </span>
              </div>
            </div>
          </CardBody></Card>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-20">
            <Card><CardBody>
              <h2 className="text-lg font-bold">Price summary</h2>
              <div className="mt-4 space-y-2">
                {b.items.map((it, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-ink-muted">{it.label}</span>
                    <span className={it.amount < 0 ? "font-medium text-success" : "font-medium text-ink"}>
                      {it.kind === "BASE" ? formatINR(it.amount) : formatDelta(it.amount)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-surface-border pt-3">
                <span className="font-semibold">Total payable</span>
                <span className="text-2xl font-bold text-brand-navy">{formatINR(b.total)}</span>
              </div>

              <div className="mt-5 space-y-3">
                <Link href="/account" className={buttonVariants({ variant: "orange", size: "lg", className: "w-full" })}>
                  <ShieldCheck className="h-4 w-4" /> Verify mobile & continue
                </Link>
                <div className="flex items-center justify-center gap-1.5 text-xs text-ink-muted">
                  <CreditCard className="h-3.5 w-3.5" /> Secure payment via Razorpay
                </div>
              </div>

              {!razorpayConfigured && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-brand-orangeLight/60 p-3 text-xs text-brand-orangeDark">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Live payment is not enabled in this environment. Add <code className="font-mono">RAZORPAY_KEY_ID</code> and{" "}
                    <code className="font-mono">RAZORPAY_KEY_SECRET</code> to turn on Razorpay checkout with server-side
                    signature &amp; webhook verification.
                  </span>
                </div>
              )}
            </CardBody></Card>
          </div>
        </div>
      </div>
    </Container>
  );
}
