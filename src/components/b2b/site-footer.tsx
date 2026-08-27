import Link from "next/link";
import { Logo } from "@/components/ui/logo";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/support-center" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Flights", href: "/#flights" },
      { label: "Bookings", href: "/login" },
      { label: "Wallet", href: "/login" },
      { label: "Reports", href: "/login" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/legal/terms" },
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Refund Policy", href: "/legal/refund-policy" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/support-center" },
      { label: "Contact Support", href: "/support-center" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-surface-border bg-white">
      <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_repeat(4,1fr)] lg:px-8">
        <div>
          <Logo size="md" href="/" />
          <p className="mt-3 max-w-xs text-sm text-ink-muted">
            India&apos;s smarter B2B travel platform. Powerful tools, competitive fares and a simpler booking experience built for travel agents.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-bold text-ink">{col.title}</h4>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-ink-muted transition-colors hover:text-brand-blue">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-surface-border">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-ink-faint sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} ExpertzTrip. All rights reserved.</p>
          <p>Find Better Flights. Earn More. Grow Your Business.</p>
        </div>
      </div>
    </footer>
  );
}
