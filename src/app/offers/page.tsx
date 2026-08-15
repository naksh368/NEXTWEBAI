import type { Metadata } from "next";
import Link from "next/link";
import { Tag, Ticket } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SmartImage } from "@/components/ui/smart-image";
import { EmptyState } from "@/components/ui/states";
import { Card, CardBody } from "@/components/ui/card";
import { getActiveOffers } from "@/lib/queries";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Offers & deals",
  description: "Current holiday offers, seasonal sales and discount coupons from ExpertzTrip.",
};

export default async function OffersPage() {
  const [offers, coupons] = await Promise.all([
    getActiveOffers(),
    db.coupon.findMany({ where: { isActive: true }, orderBy: { value: "desc" }, take: 6 }),
  ]);

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Offers" }]} />
      <h1 className="mt-4 text-3xl font-bold">Offers & deals</h1>
      <p className="mt-1.5 text-ink-muted">Save more on your next holiday.</p>

      {offers.length ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((o) => (
            <Link key={o.id} href={o.ctaHref ?? "/packages"} className="group overflow-hidden rounded-2xl border border-surface-border">
              <div className="relative aspect-[16/10]">
                <SmartImage src={o.image} alt={o.title} sizes="(max-width:640px) 100vw, 33vw" imgClassName="transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" aria-hidden />
                <div className="absolute bottom-0 p-5 text-white">
                  {o.badge && <span className="mb-2 inline-block rounded-full bg-brand-orange px-2.5 py-0.5 text-xs font-semibold">{o.badge}</span>}
                  <h2 className="text-lg font-bold">{o.title}</h2>
                  <p className="text-sm text-white/85">{o.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState className="mt-8" icon={<Tag className="h-5 w-5" />} title="No offers right now" description="Check back soon for seasonal deals." />
      )}

      {coupons.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold">Coupon codes</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coupons.map((c) => (
              <Card key={c.id}>
                <CardBody className="flex items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orangeLight text-brand-orange">
                    <Ticket className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-mono text-lg font-bold text-brand-navy">{c.code}</p>
                    <p className="text-sm text-ink-muted">{c.description}</p>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-muted">Apply coupons during package customization. Discounts are validated on our servers.</p>
        </div>
      )}
    </Container>
  );
}
