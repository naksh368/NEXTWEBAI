import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card, CardBody } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { LoginFlow } from "@/components/auth/login-flow";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getPackageBySlug } from "@/lib/queries";
import { reprice } from "@/lib/services/pricing-service";
import { getCurrentCustomer } from "@/lib/auth";
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

  // Price-review packages can't be checked out until a verified price is set.
  if (v.pricingStatus === "PRICE_REVIEW_REQUIRED") {
    return (
      <Container className="py-12">
        <Card><CardBody className="text-center">
          <h1 className="text-xl font-bold">Price on request</h1>
          <p className="mt-2 text-ink-muted">This holiday is confirmed by our travel experts before booking. Enquire and we&apos;ll send you a verified quote.</p>
          <div className="mt-5 flex justify-center gap-3">
            <Link href={`/packages/${slug}`} className={buttonVariants({ variant: "outline" })}><ArrowLeft className="h-4 w-4" /> Back to package</Link>
            <Link href="/support" className={buttonVariants({ variant: "orange" })}>Enquire</Link>
          </div>
        </CardBody></Card>
      </Container>
    );
  }

  const travellers = Math.max(1, Number(first(sp.travellers) ?? 2) || 2);
  const optionIds = (first(sp.options) ?? "").split(",").filter(Boolean);
  const departureId = first(sp.departure) ?? null;
  // No coupon codes — the best live offer auto-applies server-side.
  const couponCode = null;

  const result = await reprice({ versionId: v.id, travellerCount: travellers, selectedOptionIds: optionIds, departureId, couponCode });

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
  const customer = await getCurrentCustomer();

  const queryString = new URLSearchParams({
    travellers: String(travellers),
    ...(optionIds.length ? { options: optionIds.join(",") } : {}),
    ...(departureId ? { departure: departureId } : {}),
  }).toString();
  const redirectTo = `/packages/${slug}/checkout?${queryString}`;

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
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Review &amp; book</h1>
      <p className="mt-1 text-ink-muted">Everything below is priced and verified on our servers.</p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card><CardBody>
            <h2 className="text-lg font-bold">{pkg.name}</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {pkg.destination.name} · {v.durationNights}N / {v.durationDays}D · {travellers} traveller{travellers > 1 ? "s" : ""}
              {departure ? ` · Departs ${new Date(departure.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}
            </p>
            {selectedOptions.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {selectedOptions.filter((o) => o.priceDelta !== 0 || !o.isDefault).map((o) => (
                  <li key={o.id} className="rounded-full border border-surface-border bg-surface-muted px-3 py-1 text-xs text-ink">
                    {o.label}{o.priceDelta !== 0 ? ` · ${formatDelta(o.priceDelta * (o.perPerson ? travellers : 1))}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </CardBody></Card>

          {customer ? (
            <Card><CardBody>
              <h2 className="text-lg font-bold">Traveller details</h2>
              <p className="mt-1 text-sm text-ink-muted">Signed in as {customer.mobile}{customer.email ? ` · ${customer.email}` : ""}.</p>
              {!customer.email && (
                <p className="mt-3 rounded-lg bg-[#FDF7EC] px-3 py-2 text-xs text-warning">
                  Add your email in <Link href="/account/profile" className="font-semibold underline">your profile</Link> so we can send tickets and invoices.
                </p>
              )}
              <div className="mt-4">
                <CheckoutForm
                  versionId={v.id}
                  travellerCount={travellers}
                  selectedOptionIds={result.selectedOptionIds}
                  departureId={departureId}
                  couponCode={couponCode}
                  total={b.total}
                  prefillName={customer.fullName}
                />
              </div>
            </CardBody></Card>
          ) : (
            <Card><CardBody>
              <div className="mb-4 flex items-center gap-2 text-sm text-ink-muted">
                <Lock className="h-4 w-4 text-brand-blue" /> Sign in with your mobile to continue — it takes a few seconds.
              </div>
              <LoginFlow redirectTo={redirectTo} />
            </CardBody></Card>
          )}
        </div>

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
              <p className="mt-2 text-xs text-ink-muted">Per person on twin-sharing · incl. taxes &amp; fees.</p>
            </CardBody></Card>
          </div>
        </div>
      </div>
    </Container>
  );
}
