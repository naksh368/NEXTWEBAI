"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Phone, X } from "lucide-react";
import { PlannerAvatar } from "@/components/ai/planner-avatar";
import { PlannerChat } from "@/components/ai/planner-chat";
import { PLANNER_EVENT, type PlannerEventDetail } from "@/components/ai/planner-events";
import { cn } from "@/lib/utils";

/** WhatsApp-style chat glyph, drawn here so no third-party asset is needed. */
function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        d="M16 3.5C9.1 3.5 3.5 9 3.5 15.9c0 2.4.7 4.7 1.9 6.6L3.6 28.5l6.2-1.7c1.8 1 3.9 1.6 6.2 1.6 6.9 0 12.5-5.6 12.5-12.5S22.9 3.5 16 3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M12.2 10.2c-.3-.7-.6-.7-.9-.7h-.8c-.3 0-.7.1-1 .5-.4.4-1.3 1.3-1.3 3.1s1.4 3.6 1.5 3.8c.2.2 2.7 4.3 6.6 5.8 3.3 1.3 3.9 1 4.6 1 .7-.1 2.3-.9 2.6-1.9.3-.9.3-1.7.2-1.9-.1-.2-.4-.3-.8-.5s-2.3-1.1-2.6-1.3c-.4-.1-.6-.2-.9.2-.3.4-1 1.3-1.2 1.5-.2.3-.4.3-.8.1-.4-.2-1.7-.6-3.2-2-1.2-1-2-2.3-2.2-2.7-.2-.4 0-.6.2-.8l.6-.7c.2-.2.3-.4.4-.7.1-.3.1-.5 0-.7-.1-.2-.8-2.1-1.2-2.9Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Always-in-reach contact actions:
 *  · left  — call and WhatsApp buttons, like the agency's own phone line;
 *  · right — Asha, the AI trip planner, opening as a chat panel.
 *
 * Hidden on admin, account and sign-in screens. On a package page the mobile
 * buttons sit above the sticky "Enquire" bar instead of covering it.
 */
export function FloatingActions({
  telHref,
  phoneDisplay,
  whatsappHref,
  whatsappE164,
}: {
  telHref: string | null;
  phoneDisplay: string;
  whatsappHref: string | null;
  whatsappE164: string | null;
}) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [teaser, setTeaser] = useState(false);

  const hiddenAll =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up");
  const onPlannerPage = pathname === "/ai";
  // Package detail pages have a sticky enquiry bar on mobile.
  const raised = /^\/packages\/[^/]+$/.test(pathname);

  // Anything on the page can open the planner (e.g. a place on the map).
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<PlannerEventDetail>).detail;
      if (onPlannerPage) return;
      setPrompt(detail?.prompt ?? null);
      setOpen(true);
    };
    window.addEventListener(PLANNER_EVENT, onOpen);
    return () => window.removeEventListener(PLANNER_EVENT, onOpen);
  }, [onPlannerPage]);

  // A gentle one-time nudge after a few seconds on the page.
  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem("jst_planner_teaser") === "1";
    } catch {
      /* storage unavailable */
    }
    if (dismissed || hiddenAll || onPlannerPage) return;
    const t = setTimeout(() => setTeaser(true), 6000);
    return () => clearTimeout(t);
  }, [hiddenAll, onPlannerPage]);

  const dismissTeaser = () => {
    setTeaser(false);
    try {
      sessionStorage.setItem("jst_planner_teaser", "1");
    } catch {
      /* storage unavailable */
    }
  };

  // Close on Escape; lock background scroll while the full-screen sheet is open on phones.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const small = window.matchMedia("(max-width: 639px)").matches;
    const prev = document.body.style.overflow;
    if (small) document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  if (hiddenAll) return null;

  const bottom = raised ? "bottom-[88px] lg:bottom-6" : "bottom-5 sm:bottom-6";

  return (
    <>
      {/* ── Left: call + WhatsApp ───────────────────────── */}
      <div className={cn("fixed left-4 z-40 flex flex-col gap-3 print:hidden sm:left-6", bottom)}>
        {telHref && (
          <a
            href={telHref}
            aria-label={`Call us on ${phoneDisplay}`}
            className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-brand-orange text-white shadow-lift transition-transform hover:scale-105 sm:h-14 sm:w-14"
          >
            <Phone className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg bg-brand-navy px-3 py-1.5 text-sm font-bold text-white opacity-0 shadow-card transition-opacity group-hover:opacity-100 sm:block">
              {phoneDisplay}
            </span>
          </a>
        )}
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us on WhatsApp"
            className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lift transition-transform hover:scale-105 sm:h-14 sm:w-14"
          >
            <WhatsAppGlyph className="h-6 w-6 sm:h-7 sm:w-7" />
            <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg bg-brand-navy px-3 py-1.5 text-sm font-bold text-white opacity-0 shadow-card transition-opacity group-hover:opacity-100 sm:block">
              WhatsApp us
            </span>
          </a>
        )}
      </div>

      {/* ── Right: Asha, the AI trip planner ────────────── */}
      {!onPlannerPage && (
        <div className={cn("fixed right-4 z-40 flex items-end gap-3 print:hidden sm:right-6", bottom, open && "hidden sm:flex")}>
          {teaser && !open && (
            <div className="relative mb-1 hidden max-w-[240px] rounded-2xl rounded-br-md bg-white p-3.5 pr-8 text-sm shadow-lift animate-fade-in sm:block">
              <button
                type="button"
                onClick={dismissTeaser}
                aria-label="Dismiss"
                className="absolute right-2 top-2 rounded p-0.5 text-ink-faint hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <p className="font-extrabold text-brand-navy">Hi, I&apos;m Asha 👋</p>
              <p className="mt-0.5 leading-snug text-ink-muted">Want a customised Andaman plan for your dates and budget?</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              dismissTeaser();
              setOpen((v) => !v);
            }}
            aria-expanded={open}
            aria-controls="planner-panel"
            aria-label={open ? "Close the AI trip planner" : "Plan your Andaman trip with Asha, our AI planner"}
            className="group relative flex items-center gap-2.5 rounded-full bg-white p-1.5 shadow-lift ring-1 ring-surface-border transition-transform hover:scale-[1.03] sm:pr-5"
          >
            <span className="relative">
              <PlannerAvatar size={48} />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 items-center rounded-full bg-brand-orange px-1 text-[9px] font-extrabold uppercase text-white">
                AI
              </span>
              <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#25D366]" aria-hidden="true" />
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-[13px] font-extrabold leading-tight text-brand-navy">
                {open ? "Close planner" : "Plan your trip"}
              </span>
              <span className="block text-[11px] font-semibold text-ink-muted">Ask Asha · AI planner</span>
            </span>
          </button>
        </div>
      )}

      {/* ── Planner panel ───────────────────────────────── */}
      {open && !onPlannerPage && (
        <div
          id="planner-panel"
          role="dialog"
          aria-modal="false"
          aria-label="AI trip planner"
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden bg-white shadow-lift animate-fade-in print:hidden",
            "inset-0 sm:inset-auto sm:right-6 sm:h-[min(620px,calc(100vh-140px))] sm:w-[400px] sm:rounded-3xl sm:ring-1 sm:ring-surface-border",
            raised ? "sm:bottom-[96px] lg:bottom-24" : "sm:bottom-24"
          )}
          style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="flex items-center gap-3 bg-brand-navy px-4 py-3 text-white">
            <PlannerAvatar size={42} />
            <div className="min-w-0 flex-1">
              <p className="font-extrabold leading-tight">Asha</p>
              <p className="flex items-center gap-1.5 text-xs text-white/70">
                <span className="h-2 w-2 rounded-full bg-[#25D366]" aria-hidden="true" /> AI trip planner · replies in seconds
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close the AI trip planner"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <PlannerChat
            whatsappE164={whatsappE164}
            initialPrompt={prompt}
            onPromptConsumed={() => setPrompt(null)}
            autoFocus
            className="flex-1"
          />
        </div>
      )}
    </>
  );
}
