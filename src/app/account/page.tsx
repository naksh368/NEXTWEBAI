import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Luggage, Receipt, FileText, LifeBuoy, Bell, User } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/auth/logout-button";
import { getCurrentCustomer } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

const TILES = [
  { href: "/account/trips", icon: Luggage, title: "My Trips", desc: "View bookings & itineraries" },
  { href: "/account/payments", icon: Receipt, title: "Payments", desc: "Payment history" },
  { href: "/account/documents", icon: FileText, title: "Documents", desc: "Tickets, vouchers & invoices" },
  { href: "/support", icon: LifeBuoy, title: "Support", desc: "Raise & track tickets" },
  { href: "/account/notifications", icon: Bell, title: "Notifications", desc: "Booking updates" },
  { href: "/account/profile", icon: User, title: "Profile", desc: "Your personal details" },
];

export default async function AccountPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/sign-in?redirect_url=/account");

  const unread = await db.notification.count({ where: { customerId: customer.id, isRead: false } });

  return (
    <Container className="py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Hi{customer.fullName ? `, ${customer.fullName.split(" ")[0]}` : ""} 👋</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-ink-muted">
            {customer.email && <span>{customer.email}</span>}
            {customer.mobile && <><span className="text-ink-faint">·</span><span>{customer.mobile}</span></>}
            {customer.isVerified && <Badge tone="success">Verified</Badge>}
          </div>
        </div>
        <LogoutButton />
      </div>

      {!customer.email && (
        <Card className="mt-6 border-warning/30 bg-[#FDF7EC]">
          <CardBody className="flex items-center justify-between gap-4">
            <p className="text-sm text-ink">Add your email to receive e-tickets and invoices.</p>
            <Link href="/account/profile" className="shrink-0 text-sm font-semibold text-brand-blue hover:underline">Add email</Link>
          </CardBody>
        </Card>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((t) => (
          <Link key={t.href} href={t.href}>
            <Card interactive className="h-full">
              <CardBody>
                <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue">
                  <t.icon className="h-5 w-5" />
                  {t.href === "/account/notifications" && unread > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-orange px-1 text-xs font-bold text-white">{unread}</span>
                  )}
                </span>
                <h2 className="mt-4 font-semibold text-brand-navy">{t.title}</h2>
                <p className="mt-0.5 text-sm text-ink-muted">{t.desc}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  );
}
