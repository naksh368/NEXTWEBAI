import { CheckCircle2, Users, FileText, Mail, MessageCircle, LayoutDashboard } from "lucide-react";

/**
 * Post-payment reassurance — shown while a paid booking is being confirmed.
 * Honest timing language only ("usually within 1–2 hours after confirmation"),
 * never a guaranteed promise, so suppliers/airlines/visa delays don't break trust.
 */
const CONFIRMING = new Set(["PAYMENT_RECEIVED", "BOOKING_PROCESSING", "SUPPLIER_CONFIRMATION_PENDING"]);

export function WhatHappensNext({ status }: { status: string }) {
  if (!CONFIRMING.has(status)) return null;

  return (
    <div className="mt-6 rounded-2xl border border-surface-border bg-white p-6">
      <h2 className="text-lg font-bold text-brand-navy">What happens next?</h2>
      <ol className="mt-4 space-y-4">
        <Step icon={<CheckCircle2 className="h-5 w-5 text-success" />} title="Payment received" done>
          Your booking and payment have been recorded.
        </Step>
        <Step icon={<Users className="h-5 w-5 text-brand-blue" />} title="Our team confirms your travel components">
          We verify the hotel, transfers, activities and other components with our travel partners.
        </Step>
        <Step icon={<FileText className="h-5 w-5 text-ink-faint" />} title="Your documents are prepared">
          Once confirmed, your tickets, vouchers and itinerary appear here in My Trips.
        </Step>
      </ol>

      <div className="mt-5 rounded-xl bg-surface-muted/60 p-4 text-sm text-ink-muted">
        <p className="font-semibold text-brand-navy">When will I receive my documents?</p>
        <ul className="mt-2 space-y-1.5">
          <li>✈️ <strong>Domestic trips:</strong> tickets &amp; documents are usually shared within 1–2 hours after confirmation.</li>
          <li>🌍 <strong>International trips:</strong> our expert may contact you within 1–2 hours if extra confirmation or traveller details are needed; vouchers follow once components are confirmed.</li>
          <li>🛂 <strong>Visa-required trips:</strong> visa processing is handled separately and depends on the consulate — timelines vary.</li>
        </ul>
        <p className="mt-3 text-xs">You don&apos;t need to contact us repeatedly — we&apos;ll notify you when your documents are ready.</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-brand-blue" /> Email: updates &amp; documents</span>
        <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5 text-brand-blue" /> WhatsApp: important notifications</span>
        <span className="inline-flex items-center gap-1.5"><LayoutDashboard className="h-3.5 w-3.5 text-brand-blue" /> My Trips: live status</span>
      </div>
    </div>
  );
}

function Step({ icon, title, children, done }: { icon: React.ReactNode; title: string; children: React.ReactNode; done?: boolean }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className={`font-semibold ${done ? "text-brand-navy" : "text-ink"}`}>{title}</p>
        <p className="text-sm text-ink-muted">{children}</p>
      </div>
    </li>
  );
}
