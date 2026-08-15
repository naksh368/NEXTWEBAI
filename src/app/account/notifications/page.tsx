import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/states";
import { LoginFlow } from "@/components/auth/login-flow";
import { getCurrentCustomer } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

export default async function NotificationsPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return <Container className="py-12 sm:py-16"><LoginFlow redirectTo="/account/notifications" /></Container>;

  const items = await db.notification.findMany({ where: { customerId: customer.id }, orderBy: { createdAt: "desc" }, take: 50 });

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: "Account", href: "/account" }, { label: "Notifications" }]} />
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Notifications</h1>
      {items.length === 0 ? (
        <EmptyState className="mt-8" icon={<Bell className="h-5 w-5" />} title="You're all caught up" description="Booking and payment updates will show up here." />
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((n) => (
            <div key={n.id} className="rounded-xl border border-surface-border bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-brand-navy">{n.title}</p>
                <span className="text-xs text-ink-faint">{formatDate(n.createdAt)}</span>
              </div>
              {n.body && <p className="mt-1 text-sm text-ink-muted">{n.body}</p>}
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}
