import { cache } from "react";
import { z } from "zod";
import { db } from "./db";
import type { SiteSettings } from "./site-settings";

/**
 * Editable page copy: the homepage sections, the About page, and the legal
 * pages. Each page is stored as one BusinessSetting row ("page:<key>") and
 * edited in Admin → Pages. Anything missing falls back to the defaults below,
 * which are the site's original text — so the site reads the same until an
 * administrator changes something.
 *
 * Text may use {brand}, {contact}, {phone}, {email} and {address}; they are
 * filled from Website Content when the page is shown.
 */

const block = z.object({ title: z.string().max(120), body: z.string().max(600) });
const text = (fallback: string, max = 600) => z.string().max(max).catch(fallback).default(fallback);

export const DEFAULT_HOME = {
  "planEyebrow": "Plan my trip",
  "planTitle": "Tell us your dates. We'll plan the rest.",
  "planText": "Hotels, ferries, sightseeing and transfers arranged by a team based in Port Blair. You get a written itinerary and quotation — nothing is booked until you say yes.",
  "features": [
    {
      "title": "Personalised holiday planning",
      "body": "Every itinerary is built around your dates, your group and your budget."
    },
    {
      "title": "Accommodation options",
      "body": "Budget guesthouses to 4-star resorts, across all three islands."
    },
    {
      "title": "Island sightseeing",
      "body": "The beaches, the reef and the heritage sites, arranged end to end."
    },
    {
      "title": "Transfers & travel assistance",
      "body": "Airport pick-up, ferries and a team on the ground while you are here."
    }
  ],
  "packagesEyebrow": "Holiday packages",
  "packagesTitle": "Find your perfect Andaman escape",
  "packagesText": "Five nights, six days across Port Blair, Havelock and Neil — pick the hotel category that suits your group.",
  "islandsEyebrow": "Explore the islands",
  "islandsTitle": "Where your Andaman holiday takes you",
  "islandsText": "Three islands, a handful of unforgettable beaches, and the heritage that made these islands matter.",
  "servicesEyebrow": "What we arrange",
  "servicesTitle": "Everything an island holiday needs",
  "servicesText": "These are the services we plan and coordinate. What is included in your trip depends on the package you choose — each package page lists its own inclusions in full.",
  "services": [
    {
      "title": "Beautiful beaches",
      "body": "Radhanagar, Kalapathar, Bharatpur and Laxmanpur — the sand the islands are known for."
    },
    {
      "title": "Snorkelling & water sports",
      "body": "Reef snorkelling, glass-bottom boats, sea walking and scuba, through licensed operators."
    },
    {
      "title": "Island hopping",
      "body": "Port Blair, Havelock and Neil on one trip, with every connection planned for you."
    },
    {
      "title": "Resort & hotel stays",
      "body": "Budget guesthouses through to 4-star beach resorts, chosen to fit your group."
    },
    {
      "title": "Sightseeing",
      "body": "Cellular Jail and the Light & Sound Show, Ross Island, North Bay and Corbyn's Cove."
    },
    {
      "title": "Inter-island transfers",
      "body": "Ferry seats booked and re-booked for you when the sea changes the schedule."
    }
  ],
  "galleryEyebrow": "Gallery",
  "galleryTitle": "The Andamans, as you will find them",
  "testimonialsEyebrow": "Traveller stories",
  "testimonialsTitle": "What our guests say",
  "faqEyebrow": "Good to know",
  "faqTitle": "Frequently asked questions",
  "ctaTitle": "Tell us when you want to travel",
  "ctaText": "Send us your dates and group size and we will come back with an itinerary and a written quotation — no obligation."
};

export const DEFAULT_ABOUT = {
  "heading": "An Andaman specialist, and only Andaman",
  "body": "{brand} plans holidays in one place: the Andaman & Nicobar Islands. Everything we know is about getting the ferry timings right between Port Blair, Havelock and Neil, which beach is worth the drive in the late afternoon, and which hotel actually delivers what its photographs promise.\n\nThat focus is the whole point. An agency selling forty destinations is reading the same listings you are. We are on the islands, so we book the sailings, confirm the rooms and send someone to the airport — and when a sailing is cancelled, we are rearranging your day before you have finished reading the message.\n\nOur packages start at five nights and six days across all three islands, in hotel categories from budget guesthouses to 4-star resorts. Each one is a starting point we will happily rebuild around your dates, your group and your budget.",
  "principlesEyebrow": "How we work",
  "principlesTitle": "What you can expect from us",
  "principlesText": "Six things we hold ourselves to on every booking.",
  "principles": [
    {
      "title": "We are based here",
      "body": "Our office is in Sri Vijaya Puram (Port Blair), not on the mainland. When a ferry is cancelled or a hotel changes a room, someone local is already on it."
    },
    {
      "title": "Written quotations, no surprises",
      "body": "Every quotation sets out what is included and what is not, before you pay anything. If a cost changes, we tell you before it is incurred."
    },
    {
      "title": "Itineraries built around you",
      "body": "The packages on this site are a starting point. We change the nights, the islands and the hotel category to suit your group."
    },
    {
      "title": "The logistics are ours, not yours",
      "body": "Airport pick-up, ferry seats, hotel check-ins and sightseeing are booked and re-booked by us, so you are not managing it from the jetty."
    },
    {
      "title": "A person on the ground",
      "body": "You travel with a number that reaches someone on the islands, for the whole of your stay."
    },
    {
      "title": "Honest about what we control",
      "body": "We do not promise weather, sea conditions or a sailing that has not been allotted. What we promise is a plan, and a team that fixes it when it moves."
    }
  ],
  "ctaTitle": "Come and see them",
  "ctaText": "Send us your dates and we will come back with an itinerary and a written quotation."
};

export const DEFAULT_TERMS = {
  "title": "Booking terms & conditions",
  "intro": "How {brand} quotes, confirms and runs your Andaman holiday — and what happens when the islands have other ideas.",
  "contactLine": "Anything here you would like explained before you book? Ask us on {contact} — we would rather answer it now than after you have paid.",
  "sections": [
    {
      "heading": "1. These terms",
      "body": "These terms apply to holiday packages, transfers, accommodation and sightseeing arranged by {brand}. They sit alongside your written quotation: where the two differ, your written quotation wins, because it describes your specific trip.\n\nAn enquiry is not a booking. Nothing is reserved, held or confirmed until we confirm it to you in writing and you have paid what the quotation asks for."
    },
    {
      "heading": "2. Prices shown on this website",
      "body": "Every price on this site is a starting rate per person, on the stated occupancy and minimum group size. It is indicative — it tells you roughly what a trip of that shape costs, not what yours will cost.\n\nYour actual price depends on your dates, your group, the hotels available when you book and the season. We confirm it in writing before you pay anything. If a cost changes after that, we tell you before it is incurred — we do not quietly increase a confirmed price.\n\nPromotional rates apply only within the validity window shown on the package. Once that window closes the promotion no longer applies, and we will quote you the current rate."
    },
    {
      "heading": "3. What is and is not included",
      "body": "Each package page lists its own inclusions and exclusions, and they differ between packages — a package without air-conditioned transport says so. Do not assume an inclusion carries across from one package to another.\n\nUnless your quotation says otherwise, airfare to and from Port Blair, meals other than the stated breakfasts, optional water sports and activities, camera fees at monuments and personal expenses are not included."
    },
    {
      "heading": "4. Payments",
      "body": "An advance is required to confirm hotels and ferry seats. The amount and the balance due date are stated in your quotation.\n\nYour booking is confirmed only once the advance has been received and we have sent you a written confirmation. A payment on its own does not confirm a booking if the supplier cannot deliver — in that case we offer an alternative or refund the amount in full."
    },
    {
      "id": "cancellation",
      "heading": "5. Cancellation and refunds",
      "body": "Cancellation terms are set out in writing in your quotation before you pay, because they depend on the hotels and ferry operators your itinerary uses. In general:\n\n- Ferry tickets, air tickets and certain discounted hotel rates are non-refundable once issued. Those amounts are deducted from any refund.\n- Cancellations close to arrival may attract the full accommodation charge, depending on each property's own terms.\n- Refunds are returned to the original payment method; bank processing usually takes 5–7 working days after we release them.\n- Where you cut a trip short after it has started, unused services are generally not refundable, because the supplier has already been paid."
    },
    {
      "heading": "6. Ferries, weather and things outside our control",
      "body": "Inter-island sailings are allotted by the operators and are regularly changed or cancelled at short notice because of sea conditions. This is normal in the Andamans and is not something any agency controls.\n\nIf a sailing is cancelled we rearrange your itinerary and your nights at no charge for our own time. Any unavoidable supplier cost — a changed hotel night, a re-issued ticket — is advised to you before it is incurred.\n\nWe are not liable for losses caused by weather, sea conditions, flight delays, strikes, government restrictions or other events beyond our reasonable control. We will always do what we can to get your holiday back on track."
    },
    {
      "heading": "7. Accommodation",
      "body": "Hotels are confirmed by category until your booking is confirmed. If a named property becomes unavailable, we substitute one of the same or a higher category and tell you.\n\nStandard check-in and check-out times apply and are set by each property, not by us. Early check-in and late check-out are requests, never guarantees."
    },
    {
      "heading": "8. Activities and water sports",
      "body": "Snorkelling, scuba diving, sea walking, glass-bottom boats and similar activities are operated by independently licensed providers. They run subject to sea conditions, operator availability and the operator's own safety rules, including health and age restrictions.\n\nUnless your quotation states otherwise, these are paid directly to the operator on site and are not part of your package price. You take part in them under the operator's terms."
    },
    {
      "heading": "9. Your responsibilities",
      "body": "A holiday runs smoothly when the basics are right. Please make sure that:\n\n- Every traveller carries valid photo identification. It is required at airport check-in, at the ferry jetties and at hotel check-in.\n- The names you give us exactly match those documents. A mismatch can mean a denied boarding, and reissuing a ticket costs money.\n- You tell us about medical conditions, mobility needs, dietary requirements or anything else that affects the plan, before we book.\n- You arrive at pick-up points and jetties at the times your itinerary gives. A missed sailing is not refundable.\n- Foreign nationals check the current permit requirements for the islands before booking."
    },
    {
      "heading": "10. Travel insurance",
      "body": "Travel insurance is not included in our packages. We strongly recommend it — it is what covers you for a cancelled flight, a medical problem or a missed connection, and it is far cheaper than the alternative."
    },
    {
      "heading": "11. Complaints",
      "body": "If something goes wrong while you are on the islands, tell us immediately — while we can still fix it. Most problems are solvable on the day and almost impossible to put right a week later.\n\nReach us on {contact}."
    },
    {
      "heading": "12. Liability",
      "body": "We arrange services provided by independent hotels, transport operators and activity providers, and we select them with care. We are responsible for arranging your holiday properly; we are not liable for the acts or omissions of those independent suppliers, or for events beyond our reasonable control.\n\nNothing in these terms limits any liability that cannot be limited by law."
    },
    {
      "heading": "13. Governing law",
      "body": "These terms are governed by the laws of India, and the courts at Sri Vijaya Puram (Port Blair), Andaman & Nicobar Islands have jurisdiction over any dispute."
    }
  ],
  "updatedAt": "2026-10-09"
};

export const DEFAULT_PRIVACY = {
  "title": "Privacy policy",
  "intro": "What {brand} does with the information you give us, and what you can ask us to do with it.",
  "contactLine": "Questions about your data, or want it corrected or deleted? Contact us on {contact} and we will respond.",
  "sections": [
    {
      "heading": "Who we are",
      "body": "{brand} is a travel agency arranging holidays in the Andaman & Nicobar Islands. In this policy, \"we\" and \"us\" mean {brand}, and \"you\" means anyone who uses this website or sends us an enquiry.\n\nOur office is at {address}."
    },
    {
      "heading": "What we collect",
      "body": "We only ask for what we need to answer your enquiry and run your holiday.\n\n- Enquiry details you type into a form: your name, phone number, optional email address, travel dates, group size, preferred package and anything you write in the message box.\n- Booking details, if you go on to book: traveller names, ages where a supplier requires them, and the identity document numbers that hotels, ferry operators and airlines are legally required to record.\n- Technical information your browser sends automatically, such as your IP address and device type. We use it to keep the site working and to stop automated form abuse.\n- We do not collect card or bank details through this website. Where an online payment is offered, it is handled by a licensed payment provider and the card data never reaches our servers."
    },
    {
      "heading": "Why we use it, and on what basis",
      "body": "We use your enquiry details to prepare an itinerary and quotation and to contact you about it — by phone, WhatsApp, SMS or email, using the details you gave us. That is the whole purpose of the form, and the tick-box on it is your consent.\n\nIf you book, we use your details to make the reservations: passing the names and document numbers to the hotels, ferry operators and activity providers who need them to issue your tickets and check you in. We share the minimum each one requires, and nothing more.\n\nWe keep a record of enquiries and bookings so that we can answer later questions, handle refunds and disputes, and meet our accounting and tax obligations."
    },
    {
      "heading": "Who we share it with",
      "body": "We never sell your personal information, and we never pass it to anyone for their own marketing.\n\n- Travel suppliers — the hotels, ferry operators, transport providers and activity operators your itinerary requires, with only the details they need.\n- Service providers who run this website on our behalf: our hosting platform, our database host, and the email and SMS providers that deliver your confirmations. They act on our instructions and may not use your data for anything else.\n- Authorities, where the law requires it — for example the identity records that island accommodation providers must keep."
    },
    {
      "heading": "Internal notes",
      "body": "Our team keeps internal notes against an enquiry — a reminder to call back, a note of what you are looking for. These are for our staff only. They are never shown on this website and never included in anything we send you."
    },
    {
      "heading": "How long we keep it",
      "body": "Enquiries that do not become bookings are kept while they are still useful to you and us, and are reviewed periodically and removed when they are not.\n\nBooking records are kept for as long as our accounting and tax obligations require, and then deleted."
    },
    {
      "heading": "Your choices",
      "body": "You can ask us at any time to:\n\n- Tell you what personal information we hold about you.\n- Correct anything that is wrong.\n- Delete your enquiry and your details, where we are not required to keep them for accounting or legal reasons.\n- Stop contacting you. Reply STOP to a message, or simply tell us, and we will close the enquiry."
    },
    {
      "heading": "Security",
      "body": "This site is served over HTTPS, enquiry data is stored in an access-controlled database, and the administration area requires an authenticated, authorised staff account — there is no public sign-up for it. No system is perfect, but we take reasonable technical and organisational measures to protect what you give us."
    },
    {
      "heading": "Cookies",
      "body": "This website uses only what it needs to function: a session cookie if you sign in, and your browser's local storage to remember things like the packages you saved. We do not run third-party advertising or cross-site tracking cookies. Where a page embeds a Google map, Google may set its own cookies under its own policy."
    },
    {
      "heading": "Children",
      "body": "This website is not aimed at children. We only hold a child's details when a parent or guardian gives them to us as part of a family booking."
    },
    {
      "heading": "Changes to this policy",
      "body": "If we change how we handle your information we will update this page and change the date at the top. Material changes will be explained here rather than made quietly."
    }
  ],
  "updatedAt": "2026-10-09"
};

export const homeSchema = z.object({
  planEyebrow: text(DEFAULT_HOME.planEyebrow, 60),
  planTitle: text(DEFAULT_HOME.planTitle, 120),
  planText: text(DEFAULT_HOME.planText),
  features: z.array(block).max(8).catch(DEFAULT_HOME.features).default(DEFAULT_HOME.features),
  packagesEyebrow: text(DEFAULT_HOME.packagesEyebrow, 60),
  packagesTitle: text(DEFAULT_HOME.packagesTitle, 120),
  packagesText: text(DEFAULT_HOME.packagesText),
  islandsEyebrow: text(DEFAULT_HOME.islandsEyebrow, 60),
  islandsTitle: text(DEFAULT_HOME.islandsTitle, 120),
  islandsText: text(DEFAULT_HOME.islandsText),
  servicesEyebrow: text(DEFAULT_HOME.servicesEyebrow, 60),
  servicesTitle: text(DEFAULT_HOME.servicesTitle, 120),
  servicesText: text(DEFAULT_HOME.servicesText),
  services: z.array(block).max(12).catch(DEFAULT_HOME.services).default(DEFAULT_HOME.services),
  galleryEyebrow: text(DEFAULT_HOME.galleryEyebrow, 60),
  galleryTitle: text(DEFAULT_HOME.galleryTitle, 120),
  testimonialsEyebrow: text(DEFAULT_HOME.testimonialsEyebrow, 60),
  testimonialsTitle: text(DEFAULT_HOME.testimonialsTitle, 120),
  faqEyebrow: text(DEFAULT_HOME.faqEyebrow, 60),
  faqTitle: text(DEFAULT_HOME.faqTitle, 120),
  ctaTitle: text(DEFAULT_HOME.ctaTitle, 120),
  ctaText: text(DEFAULT_HOME.ctaText),
});

export const aboutSchema = z.object({
  heading: text(DEFAULT_ABOUT.heading, 120),
  body: text(DEFAULT_ABOUT.body, 6000),
  principlesEyebrow: text(DEFAULT_ABOUT.principlesEyebrow, 60),
  principlesTitle: text(DEFAULT_ABOUT.principlesTitle, 120),
  principlesText: text(DEFAULT_ABOUT.principlesText),
  principles: z.array(block).max(12).catch(DEFAULT_ABOUT.principles).default(DEFAULT_ABOUT.principles),
  ctaTitle: text(DEFAULT_ABOUT.ctaTitle, 120),
  ctaText: text(DEFAULT_ABOUT.ctaText),
});

const legalSchema = (d: typeof DEFAULT_TERMS) =>
  z.object({
    title: text(d.title, 120),
    intro: text(d.intro),
    contactLine: text(d.contactLine),
    updatedAt: text(d.updatedAt, 20),
    sections: z
      .array(z.object({ id: z.string().max(40).optional(), heading: z.string().min(1).max(160), body: z.string().max(8000) }))
      .max(40)
      .catch(d.sections)
      .default(d.sections),
  });

export const termsSchema = legalSchema(DEFAULT_TERMS);
export const privacySchema = legalSchema(DEFAULT_PRIVACY);

export const PAGE_SCHEMAS = { home: homeSchema, about: aboutSchema, terms: termsSchema, privacy: privacySchema } as const;
export type PageKey = keyof typeof PAGE_SCHEMAS;
export type PageContent<K extends PageKey> = z.infer<(typeof PAGE_SCHEMAS)[K]>;
export type LegalContent = PageContent<"terms">;

export const pageSettingKey = (key: PageKey) => `page:${key}`;

/** Read one page's content, falling back to the defaults for anything missing. */
export const getPageContent = cache(async <K extends PageKey>(key: K): Promise<PageContent<K>> => {
  const schema = PAGE_SCHEMAS[key];
  try {
    const row = await db.businessSetting.findUnique({ where: { key: pageSettingKey(key) } });
    return schema.parse(row?.value ?? {}) as PageContent<K>;
  } catch {
    return schema.parse({}) as PageContent<K>;
  }
});

/** Fill {brand}, {contact}, {phone}, {email} and {address} from the site settings. */
export function fillTokens(value: string, s: Pick<SiteSettings, "brandName" | "email" | "phonePrimary" | "addressLines">): string {
  const contact = [s.email, s.phonePrimary].filter(Boolean).join(" or ");
  const address = s.addressLines.filter(Boolean).join(", ");
  return value
    .replaceAll("{brand}", s.brandName)
    .replaceAll("{contact}", contact || "the details on our contact page")
    .replaceAll("{phone}", s.phonePrimary || "our phone number")
    .replaceAll("{email}", s.email || "our email address")
    .replaceAll("{address}", address || "the address on our contact page");
}

export type TextBlock = { type: "p"; text: string } | { type: "ul"; items: string[] };

/**
 * Split edited text into paragraphs and bullet lists. A blank line starts a new
 * paragraph; lines beginning with "-", "•" or "*" become a bulleted list.
 */
export function toBlocks(body: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  for (const chunk of body.replace(/\r/g, "").split(/\n\s*\n/)) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    let para: string[] = [];
    let list: string[] = [];
    const flushPara = () => { if (para.length) blocks.push({ type: "p", text: para.join(" ") }); para = []; };
    const flushList = () => { if (list.length) blocks.push({ type: "ul", items: list }); list = []; };
    for (const line of lines) {
      const bullet = line.match(/^[-•*]\s+(.*)$/);
      if (bullet) { flushPara(); list.push(bullet[1]); }
      else { flushList(); para.push(line); }
    }
    flushPara();
    flushList();
  }
  return blocks;
}
