"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, MessageCircle, Luggage, User, Bell, Heart } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/lib/wishlist";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Holiday Packages", href: "/packages" },
  { label: "Destinations", href: "/destinations" },
  { label: "Gallery", href: "/gallery" },
  { label: "Trip Planner", href: "/ai" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

interface HeaderProps {
  isSignedIn: boolean;
  unreadCount?: number;
  brandName: string;
  logoUrl: string;
  phoneDisplay: string;
  telHref: string | null;
  whatsappHref: string | null;
}

export function Header({
  isSignedIn,
  unreadCount = 0,
  brandName,
  logoUrl,
  phoneDisplay,
  telHref,
  whatsappHref,
}: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const savedCount = useWishlist().length;

  // Subtle elevation once the page scrolls — the bar itself never moves.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-white/95 backdrop-blur transition-shadow supports-[backdrop-filter]:bg-white/85 print:hidden",
        scrolled ? "border-transparent shadow-card" : "border-surface-border"
      )}
    >
      <div className="mx-auto flex h-[76px] w-full max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6 lg:gap-4 lg:px-8">
        <Logo size="md" src={logoUrl} alt={brandName} />

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "relative rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                isActive(item.href)
                  ? "text-brand-blue"
                  : "text-ink-muted hover:bg-surface-muted hover:text-brand-navy"
              )}
            >
              {item.label}
              {isActive(item.href) && (
                <span aria-hidden className="absolute inset-x-3 -bottom-0.5 h-[3px] rounded-full bg-brand-turquoise" />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          {telHref && (
            <a
              href={telHref}
              className="hidden items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-bold text-brand-navy transition-colors hover:bg-surface-muted xl:inline-flex"
            >
              <Phone className="h-4 w-4 text-brand-turquoiseDark" />
              {phoneDisplay}
            </a>
          )}

          <Link
            href="/saved"
            aria-label={`Saved packages${savedCount ? ` (${savedCount})` : ""}`}
            className="relative hidden h-10 w-10 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted hover:text-brand-navy sm:inline-flex"
          >
            <Heart className={cn("h-5 w-5", savedCount > 0 && "fill-brand-orange text-brand-orange")} />
            {savedCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-bold text-white">
                {savedCount > 9 ? "9+" : savedCount}
              </span>
            )}
          </Link>

          {isSignedIn && (
            <Link
              href="/account/notifications"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
              className="relative hidden h-10 w-10 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted hover:text-brand-navy sm:inline-flex"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}

          <Link href="/contact" className={buttonVariants({ variant: "orange", size: "sm", className: "hidden sm:inline-flex" })}>
            Plan My Trip
          </Link>

          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-brand-navy lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-nav" className="border-t border-surface-border bg-white lg:hidden">
          <nav className="mx-auto flex max-w-[1200px] flex-col gap-0.5 px-4 py-3" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-3 text-[15px] font-semibold",
                  isActive(item.href) ? "bg-brand-blueLight text-brand-blueDark" : "text-ink hover:bg-surface-muted"
                )}
              >
                {item.label}
              </Link>
            ))}

            <div className="my-2 h-px bg-surface-border" />

            <Link href="/saved" className="flex items-center gap-2.5 rounded-lg px-3 py-3 text-[15px] font-medium text-ink hover:bg-surface-muted">
              <Heart className="h-4 w-4" /> Saved packages
              {savedCount > 0 && <span className="ml-auto rounded-full bg-brand-orange px-2 text-xs font-bold text-white">{savedCount}</span>}
            </Link>
            <Link href={isSignedIn ? "/account" : "/sign-in"} className="flex items-center gap-2.5 rounded-lg px-3 py-3 text-[15px] font-medium text-ink hover:bg-surface-muted">
              {isSignedIn ? <><User className="h-4 w-4" /> My account</> : <><Luggage className="h-4 w-4" /> My trips</>}
            </Link>

            <div className="mt-2 grid gap-2">
              <Link href="/contact" className={buttonVariants({ variant: "orange", className: "w-full" })}>
                Plan My Trip
              </Link>
              <div className="grid grid-cols-2 gap-2">
                {telHref && (
                  <a href={telHref} className={buttonVariants({ variant: "outline", size: "sm", className: "w-full" })}>
                    <Phone className="h-4 w-4" /> Call
                  </a>
                )}
                {whatsappHref && (
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm", className: "w-full" })}>
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
