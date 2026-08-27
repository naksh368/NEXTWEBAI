import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Container } from "@/components/ui/container";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Company",
    links: [
      { label: "About", href: "/#why" },
      { label: "Contact", href: "/support" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Flights", href: "/#flights" },
      { label: "Bookings", href: "/login" },
      { label: "Wallet", href: "/#wallet" },
      { label: "Reports", href: "/login" },
    ],
  },
  {
    title: "For Agents",
    links: [
      { label: "Register", href: "/register" },
      { label: "Login", href: "/login" },
      { label: "How It Works", href: "/#how-it-works" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/support" },
      { label: "Contact Support", href: "/support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/legal/terms" },
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Refund Policy", href: "/legal/cancellation" },
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
              India&apos;s smarter B2B travel platform. Powerful tools, smarter booking workflows and transparent business tools built for travel agents.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-brand-navy">{col.title}</h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={`${col.title}-${l.label}`}>
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
          <p>The public website sells the platform. The Partner Portal runs your business.</p>
        </div>
      </Container>
    </footer>
  );
}
