"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Phone, CalendarPlus, Sparkles, X, Headset } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Floating "talk to us" button.
 *
 * A travel agency lives on conversations, so the quickest route to a human is
 * always one tap away. Hidden on admin and account routes where it would
 * compete with the page's own actions, and on the contact page itself.
 */
export function ContactFab({
  telHref,
  whatsappHref,
}: {
  telHref: string | null;
  whatsappHref: string | null;
}) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);

  const hidden =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname === "/contact" ||
    pathname === "/ai";
  if (hidden) return null;

  const actions = [
    whatsappHref && { label: "WhatsApp us", href: whatsappHref, Icon: MessageCircle, external: true, tone: "bg-[#1FA855]" },
    telHref && { label: "Call us", href: telHref, Icon: Phone, external: true, tone: "bg-brand-blue" },
    { label: "Plan my trip", href: "/contact", Icon: CalendarPlus, external: false, tone: "bg-brand-navy" },
    { label: "Ask the trip planner", href: "/ai", Icon: Sparkles, external: false, tone: "bg-brand-turquoiseDark" },
  ].filter(Boolean) as { label: string; href: string; Icon: typeof Phone; external: boolean; tone: string }[];

  return (
    <div className="fixed bottom-5 right-4 z-40 flex flex-col items-end gap-2.5 print:hidden sm:bottom-6 sm:right-6">
      {open &&
        actions.map(({ label, href, Icon, external, tone }) =>
          external ? (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="flex items-center gap-2.5 rounded-full bg-white py-2 pl-3 pr-4 text-sm font-bold text-brand-navy shadow-cardHover animate-fade-in"
            >
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-white", tone)}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              {label}
            </a>
          ) : (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-2.5 rounded-full bg-white py-2 pl-3 pr-4 text-sm font-bold text-brand-navy shadow-cardHover animate-fade-in"
            >
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-white", tone)}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              {label}
            </Link>
          )
        )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close contact options" : "Contact JST Andaman Travels"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-orange text-white shadow-lift transition-transform hover:scale-105 active:scale-95"
      >
        {open ? <X className="h-6 w-6" /> : <Headset className="h-6 w-6" />}
      </button>
    </div>
  );
}
