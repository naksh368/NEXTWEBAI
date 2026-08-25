import { Phone, Mail, MessageSquare, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";

export const metadata = { title: "Support" };

const FAQ = [
  {
    q: "How is my wallet amount protected during booking?",
    a: "Your wallet amount is held before the supplier is contacted and only becomes a final debit once the ticket is verified as issued. If ticketing fails, the hold is released automatically.",
  },
  {
    q: "When will my refund reach me?",
    a: "Approved refunds are credited back to your ExpertzWallet. Cancellation and supplier charges (shown transparently) are deducted from the original fare.",
  },
  {
    q: "Does ExpertzTrip support hotels or holidays?",
    a: "Not yet. V1 focuses only on flights. More travel products may be added in the future.",
  },
  {
    q: "How do I become eligible for ExpertzCredit?",
    a: "ExpertzCredit is a future feature. Agents who build a strong booking and payment history may become eligible, subject to eligibility and applicable requirements.",
  },
];

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">Support</h1>
        <p className="mt-1 text-ink-muted">
          Dedicated help for travel agents — we&apos;re here when you need us.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Phone, title: "Call Us", value: "+91 11 4000 0000", sub: "Mon–Sat, 9am–8pm" },
          { icon: Mail, title: "Email", value: "agents@expertztrip.com", sub: "Replies within 24h" },
          { icon: MessageSquare, title: "Live Chat", value: "Start a chat", sub: "During business hours" },
        ].map((c) => (
          <div key={c.title} className="rounded-xl border border-surface-border bg-white p-5 shadow-card">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-blue-50 text-blue">
              <c.icon size={20} />
            </span>
            <h3 className="mt-3 text-sm font-extrabold text-navy">{c.title}</h3>
            <p className="mt-1 text-sm font-bold text-blue">{c.value}</p>
            <p className="text-xs text-ink-faint">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        {/* Raise ticket */}
        <div className="rounded-xl border border-surface-border bg-white p-6 shadow-card">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-navy">
            <LifeBuoy size={18} className="text-orange" /> Raise a Support Ticket
          </h2>
          <form className="mt-4 space-y-4">
            <Field label="Subject" required>
              <Input placeholder="Booking issue, refund query…" />
            </Field>
            <Field label="Related Booking (optional)">
              <Input placeholder="ETB-XXXX" />
            </Field>
            <Field label="Category" required>
              <Select defaultValue="">
                <option value="" disabled>
                  Select a category
                </option>
                <option>Booking &amp; Ticketing</option>
                <option>Wallet &amp; Payments</option>
                <option>Cancellation &amp; Refunds</option>
                <option>KYC &amp; Account</option>
                <option>Other</option>
              </Select>
            </Field>
            <Field label="Message" required>
              <textarea
                rows={4}
                placeholder="Describe your issue…"
                className="w-full rounded-lg border border-surface-border bg-white px-3.5 py-2.5 text-sm font-semibold text-ink outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10"
              />
            </Field>
            <Button variant="accent" className="w-full">
              Submit Ticket
            </Button>
          </form>
        </div>

        {/* FAQ */}
        <div className="rounded-xl border border-surface-border bg-white p-6 shadow-card">
          <h2 className="text-base font-extrabold text-navy">Frequently Asked</h2>
          <div className="mt-4 divide-y divide-surface-border">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-3">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-bold text-navy">
                  {f.q}
                  <span className="text-blue transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
