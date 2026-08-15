import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/states";
import { LoginFlow } from "@/components/auth/login-flow";
import { getCurrentCustomer } from "@/lib/auth";

export const metadata: Metadata = { title: "Documents", robots: { index: false } };

export default async function DocumentsPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return <Container className="py-12 sm:py-16"><LoginFlow redirectTo="/account/documents" /></Container>;

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: "Account", href: "/account" }, { label: "Documents" }]} />
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Documents</h1>
      <EmptyState
        className="mt-8"
        icon={<FileText className="h-5 w-5" />}
        title="No documents yet"
        description="E-tickets, hotel vouchers, invoices and your final itinerary appear here once a booking is confirmed. Documents are access-controlled to your account."
        action={{ label: "Explore packages", href: "/packages" }}
      />
    </Container>
  );
}
