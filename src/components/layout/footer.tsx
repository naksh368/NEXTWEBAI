import Link from "next/link";
import { Facebook, Instagram, Youtube, Linkedin, Phone, Mail, MapPin, MessageCircle, Globe } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { GoogleRating } from "@/components/ui/google-rating";
import { Container } from "@/components/ui/container";
import { getSiteSettings, telLinkFor, whatsappLinkFor } from "@/lib/site-settings";
import { mapsHref } from "@/lib/brand";
import { getFeaturedPackages, getAndamanDestinations } from "@/lib/queries";
import { getSiteUrl } from "@/lib/utils";

const SOCIAL = [
  { key: "facebook", label: "Facebook", Icon: Facebook },
  { key: "instagram", label: "Instagram", Icon: Instagram },
  { key: "youtube", label: "YouTube", Icon: Youtube },
  { key: "linkedin", label: "LinkedIn", Icon: Linkedin },
] as const;

export async function Footer() {
  const [s, packages, destinations] = await Promise.all([
    getSiteSettings(),
    getFeaturedPackages(5),
    getAndamanDestinations(),
  ]);

  const tel = telLinkFor(s);
  const wa = whatsappLinkFor(s, `Hello ${s.brandName}, I would like to plan an Andaman holiday.`);
  const address = s.addressLines.filter(Boolean);
  const socials = SOCIAL.filter(({ key }) => (s.social as Record<string, string>)[key]);
  const siteUrl = getSiteUrl();
  const siteHost = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  // A dev or unset address is never shown to customers.
  const showSite = !/^(localhost|127\.0\.0\.1)(:|$)/.test(siteHost);

  return (
    <footer className="mt-20 border-t border-surface-border bg-brand-navy text-white/80 print:hidden">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-12">
          {/* Brand + contact */}
          <div className="md:col-span-4">
            <span className="inline-flex rounded-xl bg-white p-2.5">
              <Logo size="md" src={s.logoUrl} alt={s.brandName} />
            </span>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">{s.footerBlurb}</p>

            <ul className="mt-6 space-y-3 text-sm">
              {address.length > 0 && (
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-turquoise" />
                  <a href={mapsHref(address.join(", "))} target="_blank" rel="noopener noreferrer" className="not-italic hover:text-white">
                    <address className="not-italic">
                      {address.map((line) => (
                        <span key={line} className="block">{line}</span>
                      ))}
                    </address>
                  </a>
                </li>
              )}
              {tel && (
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-brand-turquoise" />
                  <a href={tel} className="font-semibold text-white hover:text-brand-turquoise">{s.phonePrimary}</a>
                  {s.phoneSecondary && <span className="text-white/50">·</span>}
                  {s.phoneSecondary && <span className="text-white/70">{s.phoneSecondary}</span>}
                </li>
              )}
              {s.email && (
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 shrink-0 text-brand-turquoise" />
                  <a href={`mailto:${s.email}`} className="hover:text-white">{s.email}</a>
                </li>
              )}
              {wa && (
                <li className="flex items-center gap-3">
                  <MessageCircle className="h-4 w-4 shrink-0 text-brand-turquoise" />
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="hover:text-white">Message us on WhatsApp</a>
                </li>
              )}
              {showSite && (
                <li className="flex items-center gap-3">
                  <Globe className="h-4 w-4 shrink-0 text-brand-turquoise" />
                  <a href={siteUrl} className="hover:text-white">{siteHost}</a>
                </li>
              )}
              {s.officeHours && <li className="pl-7 text-white/60">{s.officeHours}</li>}
            </ul>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 md:col-span-8 md:grid-cols-4">
            <FooterColumn
              title="Explore"
              links={[
                { label: "Home", href: "/" },
                { label: "Holiday packages", href: "/packages" },
                { label: "Destinations", href: "/destinations" },
                { label: "Gallery", href: "/gallery" },
                { label: "About us", href: "/about" },
                { label: "Contact", href: "/contact" },
              ]}
            />
            <FooterColumn
              title="Packages"
              links={
                packages.length
                  ? packages.map((p) => ({ label: p.name, href: `/packages/${p.slug}` }))
                  : [{ label: "All holiday packages", href: "/packages" }]
              }
            />
            <FooterColumn
              title="Andaman"
              links={destinations.slice(0, 6).map((d) => ({ label: d.name, href: `/destinations/${d.slug}` }))}
            />
            <FooterColumn
              title="Information"
              links={[
                { label: "FAQs", href: "/faq" },
                { label: "Privacy policy", href: "/privacy-policy" },
                { label: "Booking terms", href: "/terms" },
                { label: "Cancellation policy", href: "/terms#cancellation" },
              ]}
            />
          </div>
        </div>

        {socials.length > 0 && (
          <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
            <span className="text-sm font-semibold text-white/60">Follow us</span>
            {socials.map(({ key, label, Icon }) => (
              <a
                key={key}
                href={(s.social as Record<string, string>)[key]}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-brand-turquoise hover:bg-brand-turquoise hover:text-brand-navy"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-5 border-t border-white/10 pb-20 pt-6 text-sm text-white/55 sm:pb-0 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <p>© {new Date().getFullYear()} {s.brandName}. All rights reserved.</p>
            {s.poweredBy && (
              <p>
                Powered by <span className="font-bold uppercase tracking-wide text-white">{s.poweredBy}</span>
              </p>
            )}
            {(s.registrationInfo || s.tagline) && <p className="text-white/45">{s.registrationInfo || s.tagline}</p>}
          </div>
          <GoogleRating score={s.reviewScore} count={s.reviewCount} url={s.reviewUrl} tone="dark" className="self-start md:self-auto" />
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  if (!links.length) return null;
  return (
    <div>
      <h2 className="text-sm font-bold uppercase tracking-wider text-white">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={`${l.href}-${l.label}`}>
            <Link href={l.href} className="text-sm text-white/70 transition-colors hover:text-brand-turquoise">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
