import type { Metadata } from "next";
import { FileText, Download } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { LoginFlow } from "@/components/auth/login-flow";
import { getCurrentCustomer } from "@/lib/auth";
import { db } from "@/lib/db";
import { DOCUMENT_TYPE_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Documents", robots: { index: false } };

export default async function DocumentsPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return <Container className="py-12 sm:py-16"><LoginFlow redirectTo="/account/documents" /></Container>;

  const docs = await db.document.findMany({
    where: { booking: { customerId: customer.id } },
    orderBy: { createdAt: "desc" },
    include: { booking: { select: { reference: true, package: { select: { name: true } } } } },
  });

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: "Account", href: "/account" }, { label: "Documents" }]} />
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Documents</h1>
      <p className="mt-1 text-ink-muted">E-tickets, vouchers and invoices — access-controlled to your account.</p>

      {docs.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<FileText className="h-5 w-5" />}
          title="No documents yet"
          description="Once your booking is confirmed, your travel documents appear here to view and download."
          action={{ label: "Explore packages", href: "/packages" }}
        />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {docs.map((d) => (
            <Card key={d.id}>
              <CardBody className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-blueLight text-brand-blue"><FileText className="h-5 w-5" /></span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-brand-navy">{d.title}</span>
                    <span className="text-xs text-ink-muted">{DOCUMENT_TYPE_LABEL[d.type] ?? d.type} · {d.booking.reference} · {formatDate(d.createdAt)}</span>
                  </span>
                </span>
                <a href={`/api/documents/${d.id}`} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 font-semibold text-brand-blue hover:underline"><Download className="h-4 w-4" /> Open</a>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}
