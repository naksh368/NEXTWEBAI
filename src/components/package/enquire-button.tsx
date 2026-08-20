"use client";

import { useState } from "react";
import { MessageCircle, Phone, X, Send } from "lucide-react";
import { EXPERT_PHONE, whatsappLink, telLink } from "@/lib/contact";
import { cn } from "@/lib/utils";

interface EnquireButtonProps {
  packageName: string;
  className?: string;
  variant?: "solid" | "outline";
  label?: string;
}

/**
 * Enquire — connects the customer to a travel expert on 8700650467 with no
 * login required. Opens a small sheet offering WhatsApp (prefilled) or a call.
 */
export function EnquireButton({ packageName, className, variant = "outline", label = "Enquire now" }: EnquireButtonProps) {
  const [open, setOpen] = useState(false);
  const message = `Hi ExpertzTrip, I'm interested in the "${packageName}" holiday. Please help me plan it.`;

  const base =
    "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl font-semibold transition-colors";
  const styles =
    variant === "solid"
      ? "bg-brand-blue text-white hover:bg-brand-blueDark"
      : "border-2 border-brand-blue bg-white text-brand-blue hover:bg-brand-blueLight";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn(base, styles, className)}>
        <MessageCircle className="h-4 w-4" /> {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-brand-navy">Talk to a travel expert</h3>
                <p className="mt-1 text-sm text-ink-muted">Get help planning {packageName}. No login needed.</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="text-ink-muted hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <a
                href={whatsappLink(message)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border-2 border-[#25D366]/40 bg-[#25D366]/5 p-4 transition-colors hover:bg-[#25D366]/10"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white">
                  <Send className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold text-brand-navy">Chat on WhatsApp</span>
                  <span className="block text-sm text-ink-muted">Fastest — we usually reply within minutes</span>
                </span>
              </a>

              <a
                href={telLink()}
                className="flex items-center gap-3 rounded-xl border-2 border-brand-blue/30 bg-brand-blueLight/40 p-4 transition-colors hover:bg-brand-blueLight"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-blue text-white">
                  <Phone className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold text-brand-navy">Call {EXPERT_PHONE}</span>
                  <span className="block text-sm text-ink-muted">Speak to an expert directly</span>
                </span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
