import type { Metadata } from "next";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/states";
import { LoginFlow } from "@/components/auth/login-flow";
import { getCurrentCustomer } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { markAllNotificationsRead } from "./actions";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

export default async function NotificationsPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return <Container className="py-12 sm:py-16"><LoginFlow redirectTo="/account/notifications" /></Container>;

  const items = await db.notification.findMany({ where: { customerId: customer.id }, orderBy: { createdAt: "desc" }, take: 50 });
  const unread = items.filter((n) => !n.isRead).length;

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: "Account", href: "/account" }, { label: "Notifications" }]} />
      <div className="mt-4 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Notifications{unread > 0 && <span className="ml-2 rounded-full bg-brand-blue px-2 py-0.5 align-middle text-sm font-bold text-white">{unread}</span>}
        </h1>
        {unread > 0 && (
          <form action={markAllNotificationsRead}>
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-sm font-semibold text-ink-muted transition-colors hover:border-brand-blue hover:text-brand-blue">
              <CheckCheck className="h-4 w-4" /> Mark all read
            </button>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState className="mt-8" icon={<Bell className="h-5 w-5" />} title="You're all caught up" description="Booking, payment and document updates will show up here automatically." />
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((n) => {
            const inner = (
              <div className={`rounded-xl border p-4 transition-colors ${n.isRead ? "border-surface-border bg-white" : "border-brand-blue/25 bg-brand-blueLight/50"}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 font-semibold text-brand-navy">
                    {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-blue" aria-label="Unread" />}
                    {n.title}
                  </p>
                  <span className="shrink-0 text-xs text-ink-faint">{formatDate(n.createdAt)}</span>
                </div>
                {n.body && <p className="mt-1 text-sm text-ink-muted">{n.body}</p>}
              </div>
            );
            return n.href ? (
              <Link key={n.id} href={n.href} className="block hover:opacity-95">{inner}</Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </Container>
  );
}
