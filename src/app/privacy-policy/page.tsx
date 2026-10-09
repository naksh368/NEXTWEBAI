import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";
import { getSiteSettings } from "@/lib/site-settings";

export const revalidate = 3600;

const LAST_UPDATED = "2026-10-09";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    title: "Privacy policy",
    description: `How ${s.brandName} collects, uses and protects the personal information you give us when you send a travel enquiry or make a booking.`,
    alternates: { canonical: "/privacy-policy" },
    robots: { index: true, follow: true },
  };
}

export default async function PrivacyPolicyPage() {
  const s = await getSiteSettings();
  const contactBits = [s.email, s.phonePrimary].filter(Boolean).join(" or ");

  return (
    <LegalPage
      title="Privacy policy"
      intro={`What ${s.brandName} does with the information you give us, and what you can ask us to do with it.`}
      lastUpdated={LAST_UPDATED}
      crumbLabel="Privacy policy"
      crumbHref="/privacy-policy"
      contactLine={`Questions about your data, or want it corrected or deleted? Contact us${contactBits ? ` on ${contactBits}` : ""} and we will respond.`}
      sections={[
        {
          heading: "Who we are",
          paragraphs: [
            `${s.brandName} is a travel agency arranging holidays in the Andaman & Nicobar Islands. In this policy, "we" and "us" mean ${s.brandName}, and "you" means anyone who uses this website or sends us an enquiry.`,
            s.addressLines.filter(Boolean).length
              ? `Our office is at ${s.addressLines.filter(Boolean).join(", ")}.`
              : "Our office address is published on the contact page.",
          ],
        },
        {
          heading: "What we collect",
          paragraphs: ["We only ask for what we need to answer your enquiry and run your holiday."],
          bullets: [
            "Enquiry details you type into a form: your name, phone number, optional email address, travel dates, group size, preferred package and anything you write in the message box.",
            "Booking details, if you go on to book: traveller names, ages where a supplier requires them, and the identity document numbers that hotels, ferry operators and airlines are legally required to record.",
            "Technical information your browser sends automatically, such as your IP address and device type. We use it to keep the site working and to stop automated form abuse.",
            "We do not collect card or bank details through this website. Where an online payment is offered, it is handled by a licensed payment provider and the card data never reaches our servers.",
          ],
        },
        {
          heading: "Why we use it, and on what basis",
          paragraphs: [
            "We use your enquiry details to prepare an itinerary and quotation and to contact you about it — by phone, WhatsApp, SMS or email, using the details you gave us. That is the whole purpose of the form, and the tick-box on it is your consent.",
            "If you book, we use your details to make the reservations: passing the names and document numbers to the hotels, ferry operators and activity providers who need them to issue your tickets and check you in. We share the minimum each one requires, and nothing more.",
            "We keep a record of enquiries and bookings so that we can answer later questions, handle refunds and disputes, and meet our accounting and tax obligations.",
          ],
        },
        {
          heading: "Who we share it with",
          paragraphs: [
            "We never sell your personal information, and we never pass it to anyone for their own marketing.",
          ],
          bullets: [
            "Travel suppliers — the hotels, ferry operators, transport providers and activity operators your itinerary requires, with only the details they need.",
            "Service providers who run this website on our behalf: our hosting platform, our database host, and the email and SMS providers that deliver your confirmations. They act on our instructions and may not use your data for anything else.",
            "Authorities, where the law requires it — for example the identity records that island accommodation providers must keep.",
          ],
        },
        {
          heading: "Internal notes",
          paragraphs: [
            "Our team keeps internal notes against an enquiry — a reminder to call back, a note of what you are looking for. These are for our staff only. They are never shown on this website and never included in anything we send you.",
          ],
        },
        {
          heading: "How long we keep it",
          paragraphs: [
            "Enquiries that do not become bookings are kept while they are still useful to you and us, and are reviewed periodically and removed when they are not.",
            "Booking records are kept for as long as our accounting and tax obligations require, and then deleted.",
          ],
        },
        {
          heading: "Your choices",
          paragraphs: ["You can ask us at any time to:"],
          bullets: [
            "Tell you what personal information we hold about you.",
            "Correct anything that is wrong.",
            "Delete your enquiry and your details, where we are not required to keep them for accounting or legal reasons.",
            "Stop contacting you. Reply STOP to a message, or simply tell us, and we will close the enquiry.",
          ],
        },
        {
          heading: "Security",
          paragraphs: [
            "This site is served over HTTPS, enquiry data is stored in an access-controlled database, and the administration area requires an authenticated, authorised staff account — there is no public sign-up for it. No system is perfect, but we take reasonable technical and organisational measures to protect what you give us.",
          ],
        },
        {
          heading: "Cookies",
          paragraphs: [
            "This website uses only what it needs to function: a session cookie if you sign in, and your browser's local storage to remember things like the packages you saved. We do not run third-party advertising or cross-site tracking cookies. Where a page embeds a Google map, Google may set its own cookies under its own policy.",
          ],
        },
        {
          heading: "Children",
          paragraphs: [
            "This website is not aimed at children. We only hold a child's details when a parent or guardian gives them to us as part of a family booking.",
          ],
        },
        {
          heading: "Changes to this policy",
          paragraphs: [
            "If we change how we handle your information we will update this page and change the date at the top. Material changes will be explained here rather than made quietly.",
          ],
        },
      ]}
    />
  );
}
