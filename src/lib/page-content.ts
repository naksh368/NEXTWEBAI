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
  "title": "Terms & Conditions",
  "intro": "How JST Andaman Travels, powered by Jai Sritha Tours & Travels, quotes, confirms and runs your Andaman holiday — including cancellations, refunds and what happens when the weather or a ferry changes the plan.",
  "contactLine": "Questions about these terms? Contact us on 9434284365 / 9933265482 / 9474203128 or jaiaditya24@gmail.com, with your booking reference if you have one.",
  "updatedAt": "2026-10-11",
  "sections": [
    {
      "heading": "1.1 About us",
      "body": "JST Andaman Travels is the travel brand powered by Jai Sritha Tours & Travels, Port Blair, South Andaman, Andaman & Nicobar Islands, India.\n\nThese Terms & Conditions govern the use of our website, enquiries, tour packages and travel-booking services. By making a booking, you agree to the conditions disclosed in your quotation and booking confirmation."
    },
    {
      "heading": "1.2 Enquiries and booking confirmation",
      "body": "All tour packages, hotel listings, itineraries, photographs and prices displayed on the website are subject to availability and confirmation.\n\nAn enquiry or quotation does not constitute a confirmed reservation. A booking becomes confirmed only after the required advance payment, availability checks and written booking confirmation, subject to the applicable hotel, ferry and service-provider conditions.\n\nCustomers should verify the passenger details, travel dates, hotel arrangements, inclusions and final price before confirming a booking."
    },
    {
      "heading": "1.3 Package prices and offers",
      "body": "All prices are communicated in Indian Rupees (INR), unless otherwise stated.\n\nPackage prices may vary according to travel dates, passenger count, room occupancy, hotel availability, ferry availability, seasonal demand and the services selected.\n\nSpecial offers, including WhatsApp booking offers, apply only to the dates, passengers and services specified in the relevant quotation. An offer is not guaranteed for future bookings.\n\nAny change in the agreed package price must be communicated to the customer before confirmation of the affected services.\n\nTaxes or other charges, where applicable, will be disclosed in the quotation or invoice."
    },
    {
      "heading": "1.4 Payment terms",
      "body": "Unless different terms are confirmed in writing or required by the applicable hotel or service-provider policy:\n- 30% advance payment is required at the time of booking.\n- The remaining 70% is payable on arrival.\n\nCertain hotels, ferries or other suppliers may require different payment schedules. Such requirements will be communicated before booking confirmation.\n\nCustomers must use only payment details or payment links officially provided by Jai Sritha Tours & Travels. Customers should retain their payment receipts and transaction references."
    },
    {
      "heading": "1.5 Hotel accommodation",
      "body": "For applicable Andaman packages, the proposed hotels may include:\n- Hotel Ariees Grand — Port Blair\n- El Dorado Beach Resort — Havelock Island\n- Coral Garden Resort — Neil Island\n\nThe actual hotel allocation will be stated in the confirmed itinerary or booking voucher.\n\nHotel reservations are subject to availability. If a listed property is unavailable, a similar alternative property may be offered. Any known change in price must be communicated before the alternative is confirmed.\n\nHotel facilities, room categories, check-in and check-out times, meal plans and other services are subject to the respective property's policies. Early check-out may apply; the itinerary brochure specifies a 9:00 AM check-out arrangement for the listed island stays, so customers should reconfirm timings for their particular booking."
    },
    {
      "heading": "1.6 Itinerary and transportation",
      "body": "Airport transfers, sightseeing, private AC vehicle services, entry tickets and inter-island ferry or cruise transfers are included only to the extent expressly stated in the confirmed itinerary.\n\nThe itinerary may need to be adjusted because of ferry schedules, weather, government instructions, local operating conditions or other circumstances beyond reasonable control.\n\nAirfare to and from Port Blair, optional water sports, personal expenses, additional vehicle usage and services not listed in the confirmed inclusions are excluded unless expressly agreed in writing.\n\nJai Sritha Tours & Travels will communicate material itinerary changes and available alternatives as reasonably practicable."
    },
    {
      "heading": "1.7 Meals and optional services",
      "body": "Meal arrangements are determined by the confirmed package.\n\nWhere specified in the relevant package quotation:\n- Breakfast: included in the package.\n- Lunch: ₹300 per person per day.\n- Dinner: ₹400 per person per day.\n\nLunch and dinner should be requested and confirmed in advance. The applicable meal charges and arrangements will be recorded in the booking confirmation.\n\nNo additional service, excursion or add-on is included unless it is expressly listed in the quotation or confirmation."
    },
    {
      "heading": "1.8 Optional activities and water sports",
      "body": "Activities such as scuba diving, sea walking, kayaking, parasailing, jet skiing and other water sports are not included unless expressly stated in the confirmed package.\n\nActivities are subject to availability, weather, sea conditions, safety requirements, operator rules and any applicable age, health or fitness restrictions.\n\nActivity prices must be reconfirmed before booking. Customers should follow the activity operator's safety instructions and disclose any information requested for safe participation."
    },
    {
      "id": "cancellation",
      "heading": "2.1 Cancellation requests",
      "body": "Customers requesting cancellation must contact Jai Sritha Tours & Travels using the official contact details in section 7.\n\nCancellation requests should be submitted in writing by email or through the official booking communication channel. Customers should include their booking reference, name, travel dates and requested cancellation details.\n\nA cancellation will be treated as received when it has been acknowledged by our booking team."
    },
    {
      "heading": "2.2 Cancellation charges",
      "body": "Cancellation charges depend on the terms applicable to the confirmed booking, including the policies of the hotels, ferry or cruise operators, transport providers and activity operators.\n\nAny supplier cancellation charges and other applicable deductions will be assessed against the customer's confirmed booking terms. Where a supplier requires non-refundable payment, the applicable condition should be disclosed to the customer before confirmation or payment.\n\nThe cancellation conditions provided in the customer's written quotation or booking confirmation will apply, subject to applicable law."
    },
    {
      "heading": "2.3 Refund processing",
      "body": "If a refund is due, the refundable amount will be calculated after applicable and properly disclosed cancellation charges or non-refundable supplier costs.\n\nThe customer will be informed of the refund calculation and the expected processing period once the relevant supplier and payment details have been confirmed.\n\nProcessing time may depend on the hotel, ferry operator, payment provider or banking system involved. Refunds will be made using the original payment method wherever reasonably practicable, or another mutually agreed method."
    },
    {
      "heading": "2.4 Changes, postponements and no-shows",
      "body": "Requests to change travel dates, passenger names, hotels or package services are subject to availability and supplier approval.\n\nAdditional charges may apply where a supplier imposes amendment fees or where the change increases the cost of the booking. The revised cost will be communicated before the change is confirmed.\n\nFailure to arrive on time, failure to board a scheduled ferry or flight, or failure to use a booked service may result in the loss of that service or applicable supplier charges. Any refund will depend on the relevant booking terms and applicable law."
    },
    {
      "heading": "2.5 Refunds for disrupted services",
      "body": "Where a cancellation or interruption is caused by a service provider or an event beyond reasonable control, any refund or rebooking will be assessed according to the relevant supplier's terms, the services actually delivered and applicable law.\n\nNo refund amount or timeline is guaranteed until the relevant supplier's position has been established."
    },
    {
      "heading": "3. Weather, ferry and force majeure policy",
      "body": "Ferry and cruise operations in the Andaman & Nicobar Islands are subject to government clearance, weather conditions, sea conditions, operational restrictions and the decisions of the relevant authorities and operators.\n\nSevere weather, vessel breakdowns, government restrictions, political unrest, strikes, natural events or other circumstances beyond reasonable control may cause delays, cancellations, schedule changes or itinerary modifications.\n\nWhere available and permitted, passengers may be transferred to an alternative government-operated ferry or another suitable service.\n\nJai Sritha Tours & Travels will assist with communication and reasonable alternative arrangements. Additional expenses, rebooking and refunds will depend on supplier decisions, applicable booking terms and applicable law.\n\nCustomers are advised to allow sufficient flexibility in their travel plans, particularly when connecting with flights or other onward journeys."
    },
    {
      "heading": "4. Customer responsibilities",
      "body": "Customers are responsible for:\n- Providing accurate passenger names, contact details and booking information.\n- Carrying valid government-issued photo identification and any documents required for the journey.\n- Following local laws, applicable travel restrictions, hotel rules and instructions issued by authorised personnel.\n- Arriving at airports, ferry terminals and meeting points at the times communicated.\n- Checking the final itinerary, accommodation, meal arrangements and exclusions before departure.\n- Informing the booking team promptly of any errors or requested changes.\n\nCustomers should keep copies of their booking confirmation, tickets, identification documents and payment receipts available during the trip."
    },
    {
      "heading": "5. Privacy",
      "body": "How we collect, use and protect personal information is set out in our Privacy Policy, which forms part of these terms."
    },
    {
      "heading": "6. Third-party services and website disclaimer",
      "body": "Hotels, ferry operators, transport providers and activity operators may independently control their operating schedules, availability, facilities and service conditions.\n\nDescriptions and photographs on the website are provided to help customers understand the available travel experiences. Actual room layouts, views, facilities and operating conditions may vary by property and date.\n\nWe will take reasonable care when communicating package details, but information supplied by third-party operators may change. Material changes affecting a confirmed booking will be communicated where reasonably practicable.\n\nNothing in these terms excludes or limits a customer's rights or remedies that cannot lawfully be excluded under applicable law."
    },
    {
      "heading": "7. Complaints and customer support",
      "body": "Customers may contact us regarding bookings, cancellations, refunds, itinerary changes or privacy concerns using the following official contact details:\n- JST Andaman Travels, powered by Jai Sritha Tours & Travels\n- Port Blair, South Andaman, Andaman & Nicobar Islands, India\n- Phone: 9434284365 / 9933265482 / 9474203128\n- Email: jaiaditya24@gmail.com\n- Website: www.jstandamantravels.com\n\nPlease include your booking reference and relevant details so our team can review the matter.\n\nComplaints will be reviewed and addressed as reasonably practicable. This policy does not restrict any rights available under applicable consumer protection or other laws."
    },
    {
      "heading": "8. Governing law and updates",
      "body": "These terms are governed by the laws of India, subject to applicable consumer protection requirements and the jurisdiction of competent authorities and courts.\n\nJST Andaman Travels may update these policies when its services, supplier arrangements or legal obligations change. Updated policies will be published on the website with a revised effective date.\n\nFor a confirmed booking, any material change to the agreed services or booking terms will be handled in accordance with the booking confirmation and applicable law."
    }
  ]
};

export const DEFAULT_PRIVACY = {
  "title": "Privacy Policy",
  "intro": "What JST Andaman Travels, powered by Jai Sritha Tours & Travels, collects when you enquire or book, how it is used and protected, and the requests you can make.",
  "contactLine": "Privacy questions or requests: contact us on 9434284365 / 9933265482 / 9474203128 or jaiaditya24@gmail.com.",
  "updatedAt": "2026-10-11",
  "sections": [
    {
      "heading": "5.1 Information we may collect",
      "body": "To respond to enquiries and coordinate travel services, JST Andaman Travels may collect information such as:\n- Customer name and contact details.\n- Passenger details needed for reservations.\n- Travel dates, itinerary preferences and accommodation requests.\n- Identification details where required by a supplier or applicable law.\n- Payment status, transaction references and booking history.\n- Information submitted through forms, email or other official communication channels.\n\nCustomers should provide only information reasonably required for their enquiry or booking."
    },
    {
      "heading": "5.2 How we use information",
      "body": "Customer information may be used to:\n- Respond to enquiries and prepare quotations.\n- Confirm and manage reservations.\n- Arrange accommodation, ferry transfers, transport and sightseeing.\n- Send booking updates and travel-related communications.\n- Process payments, cancellations and refunds.\n- Address complaints, prevent fraud and comply with legal obligations.\n\nMarketing communications, where offered, will be handled in accordance with applicable consent and communication requirements."
    },
    {
      "heading": "5.3 Sharing of information",
      "body": "We may share the minimum information reasonably necessary with relevant hotels, ferry and cruise operators, transport providers, activity operators, booking partners, payment providers and authorised representatives to deliver the booked services.\n\nInformation may also be disclosed to competent authorities where required by law.\n\nWe do not sell customer personal information to third parties for their own marketing purposes."
    },
    {
      "heading": "5.4 Payments and security",
      "body": "Payments may be processed through the payment method or provider specified during booking. Payment credentials should be handled through authorised and secure payment channels.\n\nWe take reasonable measures to protect the personal information we handle. However, no website, electronic communication channel or data transmission can be guaranteed to be completely secure.\n\nCustomers should not share banking passwords, payment PINs or one-time passwords with anyone claiming to represent the travel business."
    },
    {
      "heading": "5.5 Data retention",
      "body": "Personal information will be retained for as long as reasonably required for booking administration, customer support, financial records, legal obligations and dispute resolution, subject to applicable law.\n\nWhere information is no longer required, it will be securely deleted or anonymised where appropriate and legally permitted."
    },
    {
      "heading": "5.6 Privacy requests",
      "body": "Customers may contact us to request correction of inaccurate personal information, raise a privacy concern or make another request available under applicable law.\n\nWe may need to verify the customer's identity before acting on such a request."
    },
    {
      "heading": "5.7 Cookies and website technologies",
      "body": "This website uses only essential cookies and browser storage needed for it to work — for example to keep an administrator signed in and to remember the packages you saved. It does not use advertising or cross-site tracking cookies.\n\nWhere a page shows an embedded Google map, Google may set its own cookies under its own policy. Any non-essential tracking added in future will be disclosed here first."
    }
  ]
};

export const DEFAULT_PLANNER = {
  title: "Plan my trip",
  subtitle: "Tell us the basics and we will send you an itinerary and a written quotation.",
  destinationLabel: "Destination",
  destinationPlaceholder: "Select a destination",
  destinations: [
    "Port Blair",
    "Havelock Island (Swaraj Dweep)",
    "Neil Island (Shaheed Dweep)",
    "Ross & North Bay",
    "Baratang Island",
    "Rangat",
    "Long Island",
    "Diglipur Island",
    "Ross & Smith Island",
    "Little Andaman",
    "Barren Island",
    "Not sure yet — help me choose",
  ],
  travellersLabel: "Travellers",
  travellersPlaceholder: "Select travellers",
  maxTravellers: 30,
  packageLabel: "Preferred package",
  submitLabel: "Send enquiry",
  footnote: "We reply with an itinerary and a written quotation. Sending an enquiry does not book or hold anything.",
};

export const plannerSchema = z.object({
  title: text(DEFAULT_PLANNER.title, 80),
  subtitle: text(DEFAULT_PLANNER.subtitle, 300),
  destinationLabel: text(DEFAULT_PLANNER.destinationLabel, 40),
  destinationPlaceholder: text(DEFAULT_PLANNER.destinationPlaceholder, 60),
  destinations: z.array(z.string().max(80)).max(40).catch(DEFAULT_PLANNER.destinations).default(DEFAULT_PLANNER.destinations),
  travellersLabel: text(DEFAULT_PLANNER.travellersLabel, 40),
  travellersPlaceholder: text(DEFAULT_PLANNER.travellersPlaceholder, 60),
  maxTravellers: z.number().int().min(1).max(200).catch(DEFAULT_PLANNER.maxTravellers).default(DEFAULT_PLANNER.maxTravellers),
  packageLabel: text(DEFAULT_PLANNER.packageLabel, 40),
  submitLabel: text(DEFAULT_PLANNER.submitLabel, 40),
  footnote: text(DEFAULT_PLANNER.footnote, 300),
});
export type PlannerContent = z.infer<typeof plannerSchema>;

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

export const PAGE_SCHEMAS = { home: homeSchema, about: aboutSchema, terms: termsSchema, privacy: privacySchema, planner: plannerSchema } as const;
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
