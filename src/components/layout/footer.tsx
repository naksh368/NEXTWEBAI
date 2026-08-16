import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Container } from "@/components/ui/container";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Destinations",
    links: [
      { label: "Dubai", href: "/destinations/dubai" },
      { label: "Bali", href: "/destinations/bali" },
      { label: "Maldives", href: "/destinations/maldives" },
      { label: "Thailand", href: "/destinations/thailand" },
      { label: "Singapore", href: "/destinations/singapore" },
      { label: "Europe", href: "/destinations/europe" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Why ExpertzTrip", href: "/#why" },
      { label: "Offers", href: "/offers" },
      { label: "ExpertzTrip AI", href: "/ai" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help & FAQs", href: "/#faq" },
      { label: "My Trips", href: "/account/trips" },
      { label: "Contact us", href: "/support" },
      { label: "Manage booking", href: "/account/trips" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of service", href: "/legal/terms" },
      { label: "Privacy policy", href: "/legal/privacy" },
      { label: "Cancellation policy", href: "/legal/cancellation" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-surface-border bg-surface-muted/60 print:hidden">
      <Container className="py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          <div className="col-span-2">
            <Logo size="md" />
            <p className="mt-3 max-w-xs text-sm text-ink-muted">
              Real holiday packages. Clear pricing. Expert support. Your holiday, your way.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-brand-navy">{col.title}</h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-ink-muted hover:text-brand-blue">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-surface-border pt-6 text-sm text-ink-muted sm:flex-row">
          <p>© {new Date().getFullYear()} ExpertzTrip. All rights reserved.</p>
          <p>Made for travellers who want it done right.</p>
        </div>
      </Container>
    </footer>
  );
}
