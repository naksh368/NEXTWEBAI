import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function SiteFooter() {
  return (
    <footer id="about" className="border-t border-surface-border bg-surface-muted">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo size="md" />
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              India&apos;s smarter B2B flight platform — powerful tools, competitive fares
              and transparent earnings, built for travel agents.
            </p>
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-blue">
              Flights first. More to come.
            </p>
          </div>

          <FooterCol
            title="Platform"
            links={[
              { label: "Why ExpertzTrip", href: "/#why" },
              { label: "For Travel Agents", href: "/#agents" },
              { label: "How It Works", href: "/#how" },
              { label: "ExpertzWallet", href: "/#wallet" },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { label: "About", href: "/#about" },
              { label: "Become an Agent", href: "/register" },
              { label: "Agent Login", href: "/login" },
              { label: "Support", href: "/#agents" },
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              { label: "Terms of Use", href: "/#about" },
              { label: "Privacy Policy", href: "/#about" },
              { label: "Agent Agreement", href: "/#about" },
              { label: "Refund Policy", href: "/#about" },
            ]}
          />
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-surface-border pt-6 text-xs text-ink-faint sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} ExpertzTrip. All rights reserved.</p>
          <p>
            A B2B travel technology platform. Indicative fares — not real-time availability.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-[0.72rem] font-extrabold uppercase tracking-wide text-navy">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-sm font-semibold text-ink-muted transition-colors hover:text-blue"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
