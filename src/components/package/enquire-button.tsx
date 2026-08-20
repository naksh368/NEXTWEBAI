"use client";

import { useState } from "react";
import { MessageCircle, Phone, X, Send, Clock, ShieldCheck } from "lucide-react";
import { EXPERT_PHONE, whatsappLink, telLink } from "@/lib/contact";
import { cn } from "@/lib/utils";

interface EnquireButtonProps {
  packageName?: string;
  className?: string;
  variant?: "solid" | "outline" | "ghostWhite";
  label?: string;
  size?: "md" | "lg";
}

/**
 * Enquire — connects the customer to a travel expert on 8700650467 with no
 * login required. Opens a sheet offering WhatsApp (prefilled) or a call.
 * Works both for a specific package and as a generic "talk to an expert" CTA.
 */
export function EnquireButton({
  packageName,
  className,
  variant = "outline",
  label = "Enquire now",
  size = "md",
}: EnquireButtonProps) {
  const [open, setOpen] = useState(false);

  const message = packageName
    ? `Hi ExpertzTrip 👋\n\nI'm interested in the "${packageName}" holiday. Could you please help me with:\n• Available dates & pricing\n• What's included\n• Customization options\n\nThank you!`
    : `Hi ExpertzTrip 👋\n\nI'd like help planning a holiday. Could you please share some options and pricing? Thank you!`;

  const heading = packageName ? "Talk to a travel expert" : "Talk to a travel expert";
  const sub = packageName
    ? `Get help planning "${packageName}". No login needed — we'll reply fast.`
    : "Tell us where you'd like to go and we'll craft the perfect holiday. No login needed.";

  const base = "inline-flex w-full items-center justify-center gap-2 rounded-xl font-semibold transition-colors";
  const sizes = size === "lg" ? "h-12 px-6 text-base" : "h-11 px-4";
  const styles =
    variant === "solid"
      ? "bg-brand-blue text-white hover:bg-brand-blueDark"
      : variant === "ghostWhite"
        ? "border-2 border-white/70 bg-white/10 text-white backdrop-blur hover:bg-white/20"
        : "border-2 border-brand-blue bg-white text-brand-blue hover:bg-brand-blueLight";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn(base, sizes, styles, className)}>
        <MessageCircle className="h-4 w-4" /> {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl animate-fade-in sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-brand-navy">{heading}</h3>
                <p className="mt-1 text-sm text-ink-muted">{sub}</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="-mr-1 -mt-1 rounded-lg p-1 text-ink-muted hover:bg-surface-muted hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <a
                href={whatsappLink(message)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border-2 border-[#25D366]/40 bg-[#25D366]/[0.06] p-4 transition-colors hover:bg-[#25D366]/[0.12]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
                  <Send className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-bold text-brand-navy">Chat on WhatsApp</span>
                  <span className="block text-sm text-ink-muted">Fastest reply — usually within minutes</span>
                </span>
              </a>

              <a
                href={telLink()}
                className="flex items-center gap-3 rounded-2xl border-2 border-brand-blue/30 bg-brand-blueLight/50 p-4 transition-colors hover:bg-brand-blueLight"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-blue text-white">
                  <Phone className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-bold text-brand-navy">Call {EXPERT_PHONE}</span>
                  <span className="block text-sm text-ink-muted">Speak to a travel expert directly</span>
                </span>
              </a>
            </div>

            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-ink-muted">
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-brand-blue" /> Mon–Sun, 9am–9pm</span>
              <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-brand-blue" /> No spam, ever</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
