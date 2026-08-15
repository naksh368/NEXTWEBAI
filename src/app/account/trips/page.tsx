import type { Metadata } from "next";
import Link from "next/link";
import { Luggage, MapPin, Calendar } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { LoginFlow } from "@/components/auth/login-flow";
import { getCurrentCustomer } from "@/lib/auth";
import { db } from "@/lib/db";
import { BOOKING_STATUS_META } from "@/lib/constants";
import { formatINR, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My Trips", robots: { index: false } };

export default async function MyTripsPage() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return (
      <Container className="py-12 sm:py-16">
        <LoginFlow redirectTo="/account/trips" />
      </Container>
    );
  }

  // Real bookings only — no decorative/fake dashboard (Phase 19).
  const bookings = await db.booking.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: { package: { select: { name: true, slug: true } } },
  });

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: "Account", href: "/account" }, { label: "My Trips" }]} />
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">My Trips</h1>

      {bookings.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<Luggage className="h-5 w-5" />}
          title="No trips yet"
          description="When you book a holiday it'll show up here with your itinerary, documents and status."
          action={{ label: "Explore packages", href: "/packages" }}
        />
      ) : (
        <div className="mt-8 space-y-4">
          {bookings.map((bk) => {
            const meta = BOOKING_STATUS_META[bk.status] ?? { label: bk.status, tone: "neutral" as const };
            return (
              <Card key={bk.id}>
                <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-brand-navy">{bk.package.name}</h2>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Ref {bk.reference}</span>
                      {bk.travelDate && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(bk.travelDate)}</span>}
                      <span>{formatINR(bk.totalAmount)}</span>
                    </div>
                  </div>
                  <Link href={`/account/trips/${bk.id}`} className="shrink-0 text-sm font-semibold text-brand-blue hover:underline">
                    View details
                  </Link>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </Container>
  );
}
