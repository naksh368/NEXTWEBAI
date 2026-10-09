import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";
import { getSiteSettings } from "@/lib/site-settings";

export const revalidate = 3600;

const LAST_UPDATED = "2026-10-09";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    title: "Booking terms & conditions",
    description: `The terms on which ${s.brandName} quotes, confirms and operates Andaman holiday packages — pricing, payments, cancellations and what happens when a ferry or the weather changes your plan.`,
    alternates: { canonical: "/terms" },
  };
}

export default async function TermsPage() {
  const s = await getSiteSettings();
  const contactBits = [s.email, s.phonePrimary].filter(Boolean).join(" or ");

  return (
    <LegalPage
      title="Booking terms & conditions"
      intro={`How ${s.brandName} quotes, confirms and runs your Andaman holiday — and what happens when the islands have other ideas.`}
      lastUpdated={LAST_UPDATED}
      crumbLabel="Booking terms"
      crumbHref="/terms"
      contactLine={`Anything here you would like explained before you book? Ask us${contactBits ? ` on ${contactBits}` : ""} — we would rather answer it now than after you have paid.`}
      sections={[
        {
          heading: "1. These terms",
          paragraphs: [
            `These terms apply to holiday packages, transfers, accommodation and sightseeing arranged by ${s.brandName}. They sit alongside your written quotation: where the two differ, your written quotation wins, because it describes your specific trip.`,
            "An enquiry is not a booking. Nothing is reserved, held or confirmed until we confirm it to you in writing and you have paid what the quotation asks for.",
          ],
        },
        {
          heading: "2. Prices shown on this website",
          paragraphs: [
            "Every price on this site is a starting rate per person, on the stated occupancy and minimum group size. It is indicative — it tells you roughly what a trip of that shape costs, not what yours will cost.",
            "Your actual price depends on your dates, your group, the hotels available when you book and the season. We confirm it in writing before you pay anything. If a cost changes after that, we tell you before it is incurred — we do not quietly increase a confirmed price.",
            "Promotional rates apply only within the validity window shown on the package. Once that window closes the promotion no longer applies, and we will quote you the current rate.",
          ],
        },
        {
          heading: "3. What is and is not included",
          paragraphs: [
            "Each package page lists its own inclusions and exclusions, and they differ between packages — a package without air-conditioned transport says so. Do not assume an inclusion carries across from one package to another.",
            "Unless your quotation says otherwise, airfare to and from Port Blair, meals other than the stated breakfasts, optional water sports and activities, camera fees at monuments and personal expenses are not included.",
          ],
        },
        {
          heading: "4. Payments",
          paragraphs: [
            "An advance is required to confirm hotels and ferry seats. The amount and the balance due date are stated in your quotation.",
            "Your booking is confirmed only once the advance has been received and we have sent you a written confirmation. A payment on its own does not confirm a booking if the supplier cannot deliver — in that case we offer an alternative or refund the amount in full.",
          ],
        },
        {
          id: "cancellation",
          heading: "5. Cancellation and refunds",
          paragraphs: [
            "Cancellation terms are set out in writing in your quotation before you pay, because they depend on the hotels and ferry operators your itinerary uses. In general:",
          ],
          bullets: [
            "Ferry tickets, air tickets and certain discounted hotel rates are non-refundable once issued. Those amounts are deducted from any refund.",
            "Cancellations close to arrival may attract the full accommodation charge, depending on each property's own terms.",
            "Refunds are returned to the original payment method; bank processing usually takes 5–7 working days after we release them.",
            "Where you cut a trip short after it has started, unused services are generally not refundable, because the supplier has already been paid.",
          ],
        },
        {
          heading: "6. Ferries, weather and things outside our control",
          paragraphs: [
            "Inter-island sailings are allotted by the operators and are regularly changed or cancelled at short notice because of sea conditions. This is normal in the Andamans and is not something any agency controls.",
            "If a sailing is cancelled we rearrange your itinerary and your nights at no charge for our own time. Any unavoidable supplier cost — a changed hotel night, a re-issued ticket — is advised to you before it is incurred.",
            "We are not liable for losses caused by weather, sea conditions, flight delays, strikes, government restrictions or other events beyond our reasonable control. We will always do what we can to get your holiday back on track.",
          ],
        },
        {
          heading: "7. Accommodation",
          paragraphs: [
            "Hotels are confirmed by category until your booking is confirmed. If a named property becomes unavailable, we substitute one of the same or a higher category and tell you.",
            "Standard check-in and check-out times apply and are set by each property, not by us. Early check-in and late check-out are requests, never guarantees.",
          ],
        },
        {
          heading: "8. Activities and water sports",
          paragraphs: [
            "Snorkelling, scuba diving, sea walking, glass-bottom boats and similar activities are operated by independently licensed providers. They run subject to sea conditions, operator availability and the operator's own safety rules, including health and age restrictions.",
            "Unless your quotation states otherwise, these are paid directly to the operator on site and are not part of your package price. You take part in them under the operator's terms.",
          ],
        },
        {
          heading: "9. Your responsibilities",
          paragraphs: ["A holiday runs smoothly when the basics are right. Please make sure that:"],
          bullets: [
            "Every traveller carries valid photo identification. It is required at airport check-in, at the ferry jetties and at hotel check-in.",
            "The names you give us exactly match those documents. A mismatch can mean a denied boarding, and reissuing a ticket costs money.",
            "You tell us about medical conditions, mobility needs, dietary requirements or anything else that affects the plan, before we book.",
            "You arrive at pick-up points and jetties at the times your itinerary gives. A missed sailing is not refundable.",
            "Foreign nationals check the current permit requirements for the islands before booking.",
          ],
        },
        {
          heading: "10. Travel insurance",
          paragraphs: [
            "Travel insurance is not included in our packages. We strongly recommend it — it is what covers you for a cancelled flight, a medical problem or a missed connection, and it is far cheaper than the alternative.",
          ],
        },
        {
          heading: "11. Complaints",
          paragraphs: [
            "If something goes wrong while you are on the islands, tell us immediately — while we can still fix it. Most problems are solvable on the day and almost impossible to put right a week later.",
            contactBits ? `Reach us on ${contactBits}.` : "Our contact details are on the contact page.",
          ],
        },
        {
          heading: "12. Liability",
          paragraphs: [
            "We arrange services provided by independent hotels, transport operators and activity providers, and we select them with care. We are responsible for arranging your holiday properly; we are not liable for the acts or omissions of those independent suppliers, or for events beyond our reasonable control.",
            "Nothing in these terms limits any liability that cannot be limited by law.",
          ],
        },
        {
          heading: "13. Governing law",
          paragraphs: [
            "These terms are governed by the laws of India, and the courts at Sri Vijaya Puram (Port Blair), Andaman & Nicobar Islands have jurisdiction over any dispute.",
          ],
        },
      ]}
    />
  );
}
