import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/states";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatINR, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Payments", robots: { index: false } };

export default async function PaymentsPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/sign-in?redirect_url=/account/payments");

  const payments = await db.payment.findMany({
    where: { booking: { customerId: customer.id } },
    orderBy: { createdAt: "desc" },
    include: { booking: { select: { reference: true } } },
  });

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: "Account", href: "/account" }, { label: "Payments" }]} />
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Payments</h1>
      {payments.length === 0 ? (
        <EmptyState className="mt-8" icon={<Receipt className="h-5 w-5" />} title="No payments yet" description="Your payment history will appear here after your first booking." action={{ label: "Explore packages", href: "/packages" }} />
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-surface-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-left text-ink-muted">
              <tr><th className="px-4 py-3 font-medium">Booking</th><th className="px-4 py-3 font-medium">Amount</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Date</th></tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium">{p.booking.reference}</td>
                  <td className="px-4 py-3">{formatINR(p.amount)}</td>
                  <td className="px-4 py-3">{p.status}</td>
                  <td className="px-4 py-3 text-ink-muted">{formatDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
}
