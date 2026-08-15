import type { Metadata } from "next";
import { LifeBuoy, Mail, Phone, MessageSquare } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card, CardBody } from "@/components/ui/card";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Support", description: "Get help with your ExpertzTrip booking." };

export default async function SupportPage() {
  const brand = await db.businessSetting.findUnique({ where: { key: "brand" } });
  const contact = (brand?.value ?? {}) as { supportEmail?: string; supportPhone?: string };

  return (
    <Container className="max-w-3xl py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Support" }]} />
      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue"><LifeBuoy className="h-5 w-5" /></span>
        <div>
          <h1 className="text-2xl font-bold">How can we help?</h1>
          <p className="text-sm text-ink-muted">Our travel experts are here for you before, during and after your trip.</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card><CardBody className="flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orangeLight text-brand-orange"><Mail className="h-5 w-5" /></span>
          <div>
            <p className="text-sm font-semibold">Email us</p>
            <a href={`mailto:${contact.supportEmail ?? "support@expertztrip.com"}`} className="text-sm text-brand-blue hover:underline">{contact.supportEmail ?? "support@expertztrip.com"}</a>
          </div>
        </CardBody></Card>
        <Card><CardBody className="flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue"><Phone className="h-5 w-5" /></span>
          <div>
            <p className="text-sm font-semibold">Call us</p>
            <p className="text-sm text-ink-muted">{contact.supportPhone ?? "+91 90000 00000"}</p>
          </div>
        </CardBody></Card>
      </div>

      <Card className="mt-4"><CardBody className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue"><MessageSquare className="h-5 w-5" /></span>
        <div>
          <p className="font-semibold">Raise a support ticket</p>
          <p className="mt-1 text-sm text-ink-muted">
            Signed-in customers can open and track tickets against a booking from <a href="/account" className="text-brand-blue hover:underline">My Account</a>.
            Ticket categories include booking, payment, modification, cancellation and documents.
          </p>
        </div>
      </CardBody></Card>
    </Container>
  );
}
