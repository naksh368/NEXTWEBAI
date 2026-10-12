/**
 * JST Andaman Travels — catalogue seed.
 *
 * Creates the initial, EDITABLE content an administrator then owns:
 * destinations, the five promotional holiday packages with their full 6-day
 * itinerary, the travel gallery, global FAQs, RBAC + a super-admin, and the
 * website content settings.
 *
 * Honesty rules this seed follows:
 *  · The only reviews seeded are the business's real Google reviews, copied
 *    by the owner from its Google Business Profile (prisma/google-reviews.ts).
 *  · No review score, traveller count or registration number is invented —
 *    those settings start empty and the trust strip hides each missing figure.
 *  · Prices are the agency's own advertised starting rates and are flagged as
 *    indicative (`pricingStatus = "INDICATIVE"`), never as a confirmed quote.
 *  · Seed photography is licensed stock that matches the scene described in
 *    each alt text. It is a placeholder for the agency's own Andaman
 *    photography, replaceable from Admin → Media Library / Gallery.
 */
import { PrismaClient } from "@prisma/client";
import { GOOGLE_REVIEWS } from "./google-reviews";
import { ADMIN_ROLES } from "../src/lib/constants";
import { DEFAULT_SITE_SETTINGS, SITE_SETTINGS_KEY } from "../src/lib/site-settings";

const db = new PrismaClient();

const img = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=72`;

/**
 * Verified stock photography. Each `alt` describes what the photograph
 * actually shows — it never claims a specific Andaman landmark the image does
 * not depict. Replace with the agency's own shots from the Media Library.
 */
const PHOTO = {
  islandJetty: { id: "photo-1505881502353-a1986add3762", alt: "A wooden jetty running out to a small tree-covered island in clear turquoise shallows" },
  sunsetBeach: { id: "photo-1507525428034-b723cf961d3e", alt: "Soft waves washing a wide sandy beach at sunset" },
  palmsOverSea: { id: "photo-1509233725247-49e657c54213", alt: "Coconut palms leaning out over a bright turquoise sea" },
  palmShoreline: { id: "photo-1512343879784-a960bf40e7f2", alt: "A green palm-fringed shoreline curving around calm turquoise water" },
  boatsCliff: { id: "photo-1552465011-b4e21bf6e79a", alt: "Wooden boats moored on a beach beneath a tall limestone cliff" },
  resortPool: { id: "photo-1566073771259-6a8506099945", alt: "A resort pool deck with sun loungers beside the water" },
  beachUmbrella: { id: "photo-1589979481223-deb893043163", alt: "A white beach umbrella and a palm frond against a clear blue sky" },
  coralReef: { id: "photo-1583212292454-1fe6229603b7", alt: "Shoals of small tropical fish above a shallow coral reef" },
  rockyCove: { id: "photo-1518509562904-e7ef99cdcc86", alt: "Small boats anchored in a sheltered rocky cove of clear green water" },
  covePalms: { id: "photo-1573790387438-4da905039392", alt: "Palm trees above a rocky cove looking down on turquoise water" },
  sandSpit: { id: "photo-1586500036706-41963de24d8b", alt: "A narrow white sand spit reaching out into pale turquoise shallows" },
} as const;

type PhotoKey = keyof typeof PHOTO;
const photoUrl = (k: PhotoKey) => img(PHOTO[k].id);
const photoAlt = (k: PhotoKey) => PHOTO[k].alt;

// ─────────────────────────────────────────────────────────────
// DESTINATIONS — the places JST sells, all within Andaman & Nicobar
// ─────────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: "Beaches", slug: "beaches" },
  { name: "Islands", slug: "islands" },
  { name: "Sightseeing", slug: "sightseeing" },
  { name: "Water Sports", slug: "water-sports" },
  { name: "Heritage", slug: "heritage" },
  { name: "Honeymoon", slug: "honeymoon" },
  { name: "Family", slug: "family" },
];

type DestData = {
  slug: string;
  name: string;
  hero: PhotoKey;
  thumb: PhotoKey;
  shortSummary: string;
  overview: string;
  bestTime: string;
  popular?: boolean;
  categories: string[];
  /**
   * The island base a stay on this spot runs from. Used to show relevant
   * packages on sights that are visited on a day trip rather than slept at.
   */
  hub: string;
  travelInfo: Record<string, string>;
};

const DESTINATIONS: DestData[] = [
  {
    slug: "port-blair",
    name: "Port Blair",
    hero: "palmShoreline",
    thumb: "sunsetBeach",
    popular: true,
    hub: "port-blair",
    shortSummary: "The island capital — your arrival point, and the gateway to every Andaman itinerary.",
    overview:
      "Port Blair is where almost every Andaman holiday begins and ends. Veer Savarkar International Airport sits minutes from the town, the inter-island ferry jetties are here, and the capital holds the islands' most significant heritage sites — the Cellular Jail, Corbyn's Cove and the harbour that links Ross and North Bay. Most of our packages spend the first and last nights here.",
    bestTime: "October to May",
    categories: ["sightseeing", "heritage", "family"],
    travelInfo: {
      gettingThere: "Direct flights from Chennai, Kolkata, Delhi, Bengaluru and Hyderabad",
      ferry: "Inter-island ferries to Havelock and Neil depart from Haddo and Phoenix Bay jetties",
      permits: "No permit is required by Indian nationals for Port Blair, Havelock or Neil",
      currency: "INR",
      language: "Hindi, English, Bengali, Tamil",
      timezone: "IST (UTC+5:30)",
    },
  },
  {
    slug: "havelock-island",
    name: "Havelock Island",
    hero: "palmsOverSea",
    thumb: "palmsOverSea",
    popular: true,
    hub: "havelock-island",
    shortSummary: "Swaroop Dweep — the Andamans' best-known island, and home to Radhanagar Beach.",
    overview:
      "Officially Swaroop Dweep, Havelock is the island most travellers picture when they picture the Andamans: long stretches of white sand, shallow turquoise water and a relaxed pace. Radhanagar on the west coast catches the sunset; Kalapathar on the east catches the sunrise. It is also the base for most snorkelling, diving and water-sports in the islands.",
    bestTime: "October to May",
    categories: ["beaches", "islands", "water-sports", "honeymoon"],
    travelInfo: {
      gettingThere: "Approximately 1.5–2 hours by private ferry from Port Blair",
      ferry: "Private ferry operators sail several times daily; sailings are weather dependent",
      staying: "Beach resorts and guesthouses concentrated around Beach No. 3 and Govind Nagar",
      bestFor: "Beaches, snorkelling, scuba diving, sunsets",
    },
  },
  {
    slug: "neil-island",
    name: "Neil Island",
    hero: "rockyCove",
    thumb: "covePalms",
    popular: true,
    hub: "neil-island",
    shortSummary: "Shaheed Dweep — a small, quiet island of coral shallows, paddy fields and bicycles.",
    overview:
      "Officially Shaheed Dweep, Neil is the calm counterpoint to Havelock: a compact island you can cross by bicycle in an afternoon, with three main beaches, a natural coral bridge and some of the clearest shallow water in the group. Most itineraries give it a night, or visit it on the way back from Havelock to Port Blair.",
    bestTime: "October to May",
    categories: ["beaches", "islands", "honeymoon"],
    travelInfo: {
      gettingThere: "About 1 hour by ferry from Havelock, or 1–1.5 hours from Port Blair",
      beaches: "Bharatpur, Laxmanpur and Sitapur",
      bestFor: "Quiet beaches, glass-bottom boat rides, snorkelling",
    },
  },
  {
    slug: "radhanagar-beach",
    name: "Radhanagar Beach",
    hero: "sandSpit",
    thumb: "sandSpit",
    popular: true,
    hub: "havelock-island",
    shortSummary: "Havelock's famous west-coast beach — a long white crescent facing the sunset.",
    overview:
      "Radhanagar (Beach No. 7) is the beach the Andamans are known for: a wide arc of pale sand backed by rainforest, with shallow, gently shelving water and an uninterrupted western horizon for sunset. There are no watersports here — it is a swimming and walking beach, and the lifeguard flags are worth respecting.",
    bestTime: "October to May · late afternoon for the sunset",
    categories: ["beaches", "honeymoon", "family"],
    travelInfo: {
      location: "West coast of Havelock Island, about 12 km from the jetty",
      gettingThere: "Around 25–30 minutes by road from Havelock jetty",
      note: "Swimming only — no motorised water sports operate at Radhanagar",
    },
  },
  {
    slug: "kalapathar-beach",
    name: "Kalapathar Beach",
    hero: "palmsOverSea",
    thumb: "beachUmbrella",
    hub: "havelock-island",
    shortSummary: "The sunrise side of Havelock, named for the black rocks along its shoreline.",
    overview:
      "Kalapathar sits on Havelock's eastern shore, a quieter beach of white sand framed by the dark rocks that give it its name and a road lined with tall tropical trees. It faces east, so it is the island's sunrise beach, and it is usually far less busy than Radhanagar.",
    bestTime: "October to May · early morning for the sunrise",
    categories: ["beaches", "honeymoon"],
    travelInfo: {
      location: "East coast of Havelock Island",
      gettingThere: "About 10 minutes by road from Havelock jetty",
      note: "Shallow and rocky in places — footwear is useful",
    },
  },
  {
    slug: "ross-island",
    name: "Ross Island",
    hero: "covePalms",
    thumb: "rockyCove",
    hub: "port-blair",
    shortSummary: "Netaji Subhas Chandra Bose Dweep — colonial ruins slowly reclaimed by the forest.",
    overview:
      "Renamed Netaji Subhas Chandra Bose Dweep, Ross Island was the administrative headquarters of the British settlement until an earthquake and the Second World War emptied it. What is left — a church, a bakery, the chief commissioner's residence — stands half-swallowed by banyan roots, with deer and peacocks wandering between them. It is a short boat ride from Port Blair and usually paired with North Bay.",
    bestTime: "October to May",
    categories: ["heritage", "sightseeing", "islands"],
    travelInfo: {
      gettingThere: "About 20 minutes by boat from Rajiv Gandhi Water Sports Complex, Port Blair",
      note: "The island is closed to visitors on some days — your final itinerary confirms the day",
    },
  },
  {
    slug: "north-bay-island",
    name: "North Bay Island",
    hero: "coralReef",
    thumb: "coralReef",
    hub: "port-blair",
    shortSummary: "The coral reef closest to Port Blair — snorkelling, glass-bottom boats and sea walks.",
    overview:
      "North Bay sits across the harbour from Port Blair and is where most travellers get their first look at a living reef. Glass-bottom boat rides, snorkelling and — for those who want it — sea walking and scuba introductions all run from the beach here. Activities are operated by licensed local providers and are charged separately unless your package says otherwise.",
    bestTime: "October to May",
    categories: ["water-sports", "islands", "family"],
    travelInfo: {
      gettingThere: "About 20–30 minutes by boat from Port Blair, usually combined with Ross Island",
      activities: "Glass-bottom boat, snorkelling, sea walking, jet ski, parasailing (operator rates apply)",
      note: "Water sports run subject to sea conditions and operator availability on the day",
    },
  },
  {
    slug: "cellular-jail",
    name: "Cellular Jail",
    hero: "sunsetBeach",
    thumb: "palmShoreline",
    hub: "port-blair",
    shortSummary: "Kala Pani — the colonial prison in Port Blair, and its evening Light & Sound Show.",
    overview:
      "The Cellular Jail is the most important site in the islands: the colonial prison where hundreds of Indian freedom fighters were held in solitary confinement, now a national memorial. Three of the original seven wings survive, along with the central tower and the gallows. The evening Light & Sound Show tells the jail's story in the courtyard and is included in most of our Port Blair itineraries.",
    bestTime: "October to May · the show runs in the evening",
    categories: ["heritage", "sightseeing"],
    travelInfo: {
      location: "Atlanta Point, Port Blair",
      show: "Light & Sound Show in the evening; the English and Hindi showings run at different times",
      note: "The museum and show have separate closing days — your final itinerary confirms the schedule",
    },
  },
];

// ─────────────────────────────────────────────────────────────
// PACKAGES — the agency's five promotional tiers
// ─────────────────────────────────────────────────────────────

type Has = {
  breakfast: boolean;
  acTransport: boolean;
  hotel: boolean;
  sightseeing: boolean;
  islandTransfers: boolean;
  travelAssistance: boolean;
};

/** A quality tier. The same tier is sold at three trip lengths. */
type Tier = {
  theme: string;      // doubles as the public category filter
  tierLabel: string;  // "Budget" / "3 Star" ...
  codeSuffix: string;
  slugBase: string;
  hotelCategory: string;
  accommodation: string;
  transport: string;
  ferryClass: string;
  images: PhotoKey[]; // cover first
  has: Has;
  extras: string[];
  /** Starting price per person, per trip length — taken from the agency posters. */
  prices: { "4N5D": number; "5N6D": number; "6N7D": number };
};

type DurKey = "4N5D" | "5N6D" | "6N7D";

/** The three trip lengths the agency advertises, with their island nights. */
const DUR: Record<DurKey, { nights: number; days: number; label: string; short: string; route: { city: string; nights: number }[]; baratang: boolean }> = {
  "4N5D": { nights: 4, days: 5, label: "4 Nights / 5 Days", short: "4N/5D", baratang: false,
    route: [{ city: "Port Blair", nights: 2 }, { city: "Havelock Island", nights: 1 }, { city: "Neil Island", nights: 1 }] },
  "5N6D": { nights: 5, days: 6, label: "5 Nights / 6 Days", short: "5N/6D", baratang: false,
    route: [{ city: "Port Blair", nights: 2 }, { city: "Havelock Island", nights: 2 }, { city: "Neil Island", nights: 1 }] },
  "6N7D": { nights: 6, days: 7, label: "6 Nights / 7 Days", short: "6N/7D", baratang: true,
    route: [{ city: "Port Blair", nights: 3 }, { city: "Havelock Island", nights: 2 }, { city: "Neil Island", nights: 1 }] },
};
const DUR_ORDER: DurKey[] = ["4N5D", "5N6D", "6N7D"];

const MIN_PAX = 2;

/**
 * The five quality tiers. Each is offered at all three trip lengths, so the
 * catalogue is 5 tiers × 3 lengths = 15 packages. Prices per person come from
 * the agency's own seasonal posters. Photography is placeholder stock — the
 * agency replaces each package's images from Admin → Packages.
 */
const TIERS: Tier[] = [
  {
    theme: "BUDGET", tierLabel: "Budget", codeSuffix: "BUD", slugBase: "andaman-budget",
    hotelCategory: "Budget hotels & guesthouses",
    accommodation: "Clean, simple budget hotels and guesthouses in Port Blair, Havelock and Neil, on twin-sharing.",
    transport: "Shared/seat-in-coach road transfers and sightseeing",
    ferryClass: "Standard-class private ferry between the islands",
    images: ["sunsetBeach", "palmsOverSea", "islandJetty", "coralReef", "rockyCove", "palmShoreline"],
    has: { breakfast: true, acTransport: false, hotel: true, sightseeing: true, islandTransfers: true, travelAssistance: true },
    extras: ["Airport pick-up and drop", "Entry tickets for the sights listed in the itinerary"],
    prices: { "4N5D": 14600, "5N6D": 15600, "6N7D": 16800 },
  },
  {
    theme: "STANDARD", tierLabel: "Standard", codeSuffix: "STD", slugBase: "andaman-standard",
    hotelCategory: "Standard hotels",
    accommodation: "Comfortable standard-category hotels in Port Blair, Havelock and Neil, on twin-sharing.",
    transport: "Private air-conditioned vehicle for transfers and sightseeing",
    ferryClass: "Standard-class private ferry between the islands",
    images: ["palmShoreline", "sandSpit", "boatsCliff", "palmsOverSea", "coralReef", "sunsetBeach"],
    has: { breakfast: true, acTransport: true, hotel: true, sightseeing: true, islandTransfers: true, travelAssistance: true },
    extras: ["Airport pick-up and drop", "Entry tickets for the sights listed in the itinerary"],
    prices: { "4N5D": 16400, "5N6D": 17400, "6N7D": 18600 },
  },
  {
    theme: "TWO_STAR", tierLabel: "2 Star", codeSuffix: "2ST", slugBase: "andaman-2-star",
    hotelCategory: "2-star hotels",
    accommodation: "2-star category hotels across Port Blair, Havelock and Neil, on twin-sharing.",
    transport: "Private air-conditioned vehicle for transfers and sightseeing",
    ferryClass: "Standard-class private ferry between the islands",
    images: ["rockyCove", "covePalms", "islandJetty", "sandSpit", "coralReef", "beachUmbrella"],
    has: { breakfast: true, acTransport: true, hotel: true, sightseeing: true, islandTransfers: true, travelAssistance: true },
    extras: ["Airport pick-up and drop", "Entry tickets for the sights listed in the itinerary", "Dedicated island representative"],
    prices: { "4N5D": 18900, "5N6D": 20600, "6N7D": 22600 },
  },
  {
    theme: "THREE_STAR", tierLabel: "3 Star", codeSuffix: "3ST", slugBase: "andaman-3-star",
    hotelCategory: "3-star hotels & resorts",
    accommodation: "3-star hotels and beach resorts in Port Blair, Havelock and Neil, on twin-sharing.",
    transport: "Private air-conditioned vehicle for transfers and sightseeing",
    ferryClass: "Premium-class private ferry between the islands",
    images: ["sandSpit", "palmsOverSea", "coralReef", "covePalms", "resortPool", "sunsetBeach"],
    has: { breakfast: true, acTransport: true, hotel: true, sightseeing: true, islandTransfers: true, travelAssistance: true },
    extras: ["Airport pick-up and drop", "Entry tickets for the sights listed in the itinerary", "Dedicated island representative"],
    prices: { "4N5D": 20800, "5N6D": 22600, "6N7D": 24600 },
  },
  {
    theme: "FOUR_STAR", tierLabel: "4 Star", codeSuffix: "4ST", slugBase: "andaman-4-star",
    hotelCategory: "4-star resorts",
    accommodation: "4-star resorts in Port Blair, Havelock and Neil, on twin-sharing.",
    transport: "Private air-conditioned vehicle throughout, at your disposal on sightseeing days",
    ferryClass: "Premium-class private ferry between the islands",
    images: ["resortPool", "beachUmbrella", "sandSpit", "palmsOverSea", "covePalms", "coralReef"],
    has: { breakfast: true, acTransport: true, hotel: true, sightseeing: true, islandTransfers: true, travelAssistance: true },
    extras: ["Airport pick-up and drop", "Entry tickets for the sights listed in the itinerary", "Dedicated island representative", "Priority ferry seat allocation, subject to availability"],
    prices: { "4N5D": 28900, "5N6D": 32800, "6N7D": 36800 },
  },
];

/** A concrete package = one tier at one trip length. */
type PkgSpec = {
  code: string;
  slug: string;
  name: string;
  theme: string;
  tierLabel: string;
  price: number;
  nights: number;
  days: number;
  label: string;
  short: string;
  route: { city: string; nights: number }[];
  baratang: boolean;
  featured: boolean;
  hotelCategory: string;
  accommodation: string;
  transport: string;
  ferryClass: string;
  images: PhotoKey[];
  has: Has;
  extras: string[];
};

const PACKAGES: PkgSpec[] = TIERS.flatMap((t) =>
  DUR_ORDER.map((key): PkgSpec => {
    const d = DUR[key];
    return {
      code: `JST-AND-${t.codeSuffix}-${key}`,
      slug: `${t.slugBase}-${key.toLowerCase()}`,
      name: `Andaman ${t.tierLabel} Package — ${d.label}`,
      theme: t.theme, tierLabel: t.tierLabel, price: t.prices[key],
      nights: d.nights, days: d.days, label: d.label, short: d.short, route: d.route, baratang: d.baratang,
      // Feature the two mid-tiers at the most popular length so the home grid leads with them.
      featured: key === "5N6D" && (t.theme === "STANDARD" || t.theme === "THREE_STAR"),
      hotelCategory: t.hotelCategory, accommodation: t.accommodation,
      transport: t.transport, ferryClass: t.ferryClass,
      images: t.images, has: t.has, extras: t.extras,
    };
  })
);

/** Inclusion list built from the package's own switches — never assumed. */
function inclusionsFor(p: PkgSpec): string[] {
  const out: string[] = [];
  if (p.has.hotel) out.push(`${p.nights} nights' accommodation — ${p.hotelCategory}, twin-sharing`);
  if (p.has.breakfast) out.push("Daily breakfast at the hotel");
  out.push(p.has.acTransport ? `${p.transport}` : `${p.transport} (non air-conditioned)`);
  if (p.has.islandTransfers) out.push(`Inter-island ferry tickets — ${p.ferryClass}`);
  if (p.has.sightseeing) out.push("Sightseeing as listed in the day-by-day itinerary");
  if (p.has.travelAssistance) out.push("On-ground travel assistance throughout your stay");
  return [...out, ...p.extras];
}

const COMMON_EXCLUSIONS = [
  "Airfare to and from Port Blair",
  "Lunches, dinners and anything not listed under inclusions",
  "Water sports, scuba diving, sea walking and other optional activities (payable to the operator on site)",
  "Camera and video fees at monuments",
  "Personal expenses, tips, laundry and telephone charges",
  "Any cost arising from a ferry cancellation, flight change or weather disruption",
  "Goods and Services Tax, unless stated otherwise in your written quotation",
];

// ── Day builders. Each returns one day; durations compose them below, so the
//    wording stays identical across tiers and lengths and is fully editable.
type DayT = { title: string; summary: string; items: { timeslot: string; kind: string; title: string; description: string }[] };
const acWord = (p: PkgSpec) => (p.has.acTransport ? "air-conditioned " : "");
const breakfastItem = (p: PkgSpec) => ({
  timeslot: "MORNING", kind: "MEAL", title: "Breakfast at the hotel",
  description: p.has.breakfast ? "Breakfast is included at your hotel." : "Breakfast is not included in this package.",
});

function dayArrival(p: PkgSpec): DayT {
  return {
    title: "Arrive in Port Blair",
    summary: "Airport pick-up, hotel check-in and the Cellular Jail Light & Sound Show in the evening.",
    items: [
      { timeslot: "MORNING", kind: "TRANSFER", title: "Arrival at Veer Savarkar International Airport", description: `Our representative meets you outside the terminal and transfers you to your hotel by private ${acWord(p)}vehicle.` },
      { timeslot: "AFTERNOON", kind: "HOTEL", title: "Check in and rest", description: "Check in at your Port Blair hotel. The afternoon is free to settle in after the flight." },
      { timeslot: "EVENING", kind: "ACTIVITY", title: "Cellular Jail & Light and Sound Show", description: "Visit the Cellular Jail national memorial, then stay for the evening Light & Sound Show in the courtyard. The show runs subject to the day's schedule and weather." },
      { timeslot: "EVENING", kind: "NOTE", title: "Overnight in Port Blair", description: "Overnight at your hotel in Port Blair." },
    ],
  };
}

function dayBaratang(p: PkgSpec): DayT {
  return {
    title: "Baratang Island day trip",
    summary: "An early start for the limestone caves, mangrove creek and the drive through the reserve forest.",
    items: [
      breakfastItem(p),
      { timeslot: "MORNING", kind: "TRANSFER", title: "Drive to Baratang", description: `Early-morning drive north from Port Blair by ${acWord(p)}vehicle along the Andaman Trunk Road, crossing the reserve forest in the regulated convoy.` },
      { timeslot: "AFTERNOON", kind: "ACTIVITY", title: "Limestone Caves & mangrove creek", description: "A speedboat through the mangrove creek to the natural limestone caves at Baratang. Timings depend on the tide and the convoy schedule for the day." },
      { timeslot: "EVENING", kind: "NOTE", title: "Return to Port Blair", description: "Drive back to Port Blair and overnight at your hotel." },
    ],
  };
}

function dayToHavelock(p: PkgSpec): DayT {
  return {
    title: "Port Blair to Havelock Island — Radhanagar and Kalapathar",
    summary: "Morning ferry to Havelock, then Kalapathar and sunset at Radhanagar Beach.",
    items: [
      breakfastItem(p),
      { timeslot: "MORNING", kind: "TRANSFER", title: "Ferry to Havelock Island", description: `Transfer to the jetty for your morning sailing to Havelock. ${p.ferryClass}. Ferry timings are allotted by the operator and can change with sea conditions.` },
      { timeslot: "AFTERNOON", kind: "HOTEL", title: "Check in on Havelock", description: `Check in at your Havelock hotel and continue by ${acWord(p)}vehicle for the afternoon's sightseeing.` },
      { timeslot: "AFTERNOON", kind: "ACTIVITY", title: "Kalapathar Beach", description: "The quieter eastern shore of Havelock, named for the black rocks along the waterline and lined with tall tropical trees." },
      { timeslot: "EVENING", kind: "ACTIVITY", title: "Radhanagar Beach at sunset", description: "Radhanagar (Beach No. 7) faces west, so the late afternoon is the time to be there. A swimming and walking beach — please follow the lifeguard flags." },
      { timeslot: "EVENING", kind: "NOTE", title: "Overnight on Havelock", description: "Overnight at your hotel on Havelock Island." },
    ],
  };
}

function dayHavelockLeisure(p: PkgSpec): DayT {
  return {
    title: "Havelock at leisure — Elephant Beach",
    summary: "A relaxed island day: Elephant Beach by boat, with optional snorkelling and water sports.",
    items: [
      breakfastItem(p),
      { timeslot: "MORNING", kind: "ACTIVITY", title: "Elephant Beach", description: "A short boat ride to Elephant Beach, the island's best-known spot for snorkelling over a shallow reef. The boat ride and water sports are paid directly to the licensed operator and depend on the day's sea conditions." },
      { timeslot: "AFTERNOON", kind: "FREE_TIME", title: "Free afternoon", description: "The rest of the day is free for the beach, an optional scuba dive, or simply resting at your resort." },
      { timeslot: "EVENING", kind: "NOTE", title: "Overnight on Havelock", description: "Overnight at your hotel on Havelock Island." },
    ],
  };
}

function dayToNeil(p: PkgSpec): DayT {
  return {
    title: "Havelock to Neil Island",
    summary: "Ferry across to Neil, then Bharatpur, Laxmanpur and the natural coral bridge.",
    items: [
      { timeslot: "MORNING", kind: "MEAL", title: "Breakfast and check-out", description: p.has.breakfast ? "Breakfast at the hotel, then check out for the ferry." : "Check out for the ferry. Breakfast is not included in this package." },
      { timeslot: "MORNING", kind: "TRANSFER", title: "Ferry to Neil Island (Shaheed Dweep)", description: `Sail across to Neil Island. ${p.ferryClass}.` },
      { timeslot: "AFTERNOON", kind: "HOTEL", title: "Check in on Neil", description: `Check in at your Neil Island hotel and continue by ${acWord(p)}vehicle for the island's beaches.` },
      { timeslot: "AFTERNOON", kind: "ACTIVITY", title: "Bharatpur and Laxmanpur beaches", description: "Bharatpur sits beside the jetty with shallow, glass-clear water and glass-bottom boat rides; Laxmanpur is the long western beach, best in the late afternoon." },
      { timeslot: "AFTERNOON", kind: "ACTIVITY", title: "Natural Coral Bridge", description: "The natural rock arch near Laxmanpur. It is only reachable at low tide, so the visit depends on the tide table for the day." },
      { timeslot: "EVENING", kind: "NOTE", title: "Overnight on Neil Island", description: "Overnight at your hotel on Neil Island." },
    ],
  };
}

function dayBackToPortBlair(p: PkgSpec): DayT {
  return {
    title: "Neil Island to Port Blair — Ross and North Bay",
    summary: "Morning ferry back to the capital, then colonial Ross Island and the North Bay reef.",
    items: [
      { timeslot: "MORNING", kind: "MEAL", title: "Breakfast and check-out", description: p.has.breakfast ? "Breakfast at the hotel, then check out for the ferry." : "Check out for the ferry. Breakfast is not included in this package." },
      { timeslot: "MORNING", kind: "TRANSFER", title: "Ferry to Port Blair", description: `Sail back to Port Blair and transfer to your hotel by ${acWord(p)}vehicle.` },
      { timeslot: "AFTERNOON", kind: "ACTIVITY", title: "Ross Island (Netaji Subhas Chandra Bose Dweep)", description: "A short boat ride across the harbour to the former British administrative headquarters — the church, bakery and residences now held together by banyan roots, with deer and peacocks around them." },
      { timeslot: "AFTERNOON", kind: "ACTIVITY", title: "North Bay Island", description: "Continue to North Bay, the reef closest to Port Blair. Glass-bottom boat rides, snorkelling, sea walking and jet ski are available here and are paid directly to the licensed operator unless your package states otherwise." },
      { timeslot: "EVENING", kind: "NOTE", title: "Overnight in Port Blair", description: "Return to Port Blair and overnight at your hotel." },
    ],
  };
}

function dayDeparture(p: PkgSpec): DayT {
  return {
    title: "Departure",
    summary: "Check out and transfer to the airport for your flight home.",
    items: [
      breakfastItem(p),
      { timeslot: "MORNING", kind: "TRANSFER", title: "Transfer to Veer Savarkar International Airport", description: `Check out and transfer to the airport by private ${acWord(p)}vehicle in time for your flight.` },
      { timeslot: "MORNING", kind: "NOTE", title: "Tour ends", description: "Your Andaman holiday with JST Andaman Travels ends here." },
    ],
  };
}

/** Compose the right day-by-day plan for this package's trip length. */
function itineraryDays(p: PkgSpec): DayT[] {
  const days: DayT[] = [dayArrival(p)];
  if (p.baratang) days.push(dayBaratang(p));
  days.push(dayToHavelock(p));
  if (p.nights >= 5) days.push(dayHavelockLeisure(p));
  days.push(dayToNeil(p));
  days.push(dayBackToPortBlair(p));
  days.push(dayDeparture(p));
  return days;
}

const IMPORTANT_INFO = [
  "Inter-island ferry timings are allotted by the operators and can be changed or cancelled at short notice because of sea conditions. Where a sailing is cancelled we rearrange the itinerary; any unavoidable supplier charge is advised to you before it is incurred.",
  "Water sports, scuba diving and sea walking are run by independently licensed operators and depend on the weather and sea conditions on the day. They are not included unless your written quotation says so.",
  "Ross Island, the Cellular Jail museum and the Light & Sound Show each have their own closing days; your confirmed itinerary states the days that apply to your dates.",
  "Hotels are subject to availability. If a listed property is unavailable, a similar alternative is offered, and any change in price is told to you before it is confirmed. Check-in and check-out times follow each hotel's own policy.",
  "A valid photo ID is required for every traveller at airport check-in, the ferry jetties and hotel check-in.",
].join("\n");

const CANCELLATION_POLICY = [
  "Cancellations must be requested in writing and take effect once our booking team acknowledges them.",
  "Charges follow the hotel, ferry, transport and activity operators' own terms for your booking; any non-refundable supplier cost is disclosed before you pay.",
  "Any refund is calculated after those disclosed charges and returned to the original payment method where practicable; the processing time depends on the supplier and the bank.",
  "See section 2 of our Terms & Conditions for the full cancellation and refund policy.",
].join(" ");

// ─────────────────────────────────────────────────────────────
// GALLERY
// ─────────────────────────────────────────────────────────────

const GALLERY: { key: PhotoKey; category: string; caption: string; location?: string }[] = [
  { key: "sandSpit", category: "BEACHES", caption: "Shallow turquoise water over a white sand spit", location: "Andaman Islands" },
  { key: "palmsOverSea", category: "BEACHES", caption: "Coconut palms leaning out over the sea" },
  { key: "sunsetBeach", category: "BEACHES", caption: "Sunset over a quiet stretch of sand" },
  { key: "beachUmbrella", category: "BEACHES", caption: "An easy afternoon in the shade" },
  { key: "islandJetty", category: "ISLANDS", caption: "A jetty running out to a small forested island" },
  { key: "rockyCove", category: "ISLANDS", caption: "Boats anchored in a sheltered cove" },
  { key: "covePalms", category: "ISLANDS", caption: "Looking down on clear water from the headland" },
  { key: "boatsCliff", category: "SIGHTSEEING", caption: "Wooden boats drawn up below a limestone cliff" },
  { key: "palmShoreline", category: "SIGHTSEEING", caption: "A palm-fringed shoreline curving around calm water" },
  { key: "coralReef", category: "EXPERIENCES", caption: "Tropical fish over a shallow reef" },
  { key: "resortPool", category: "RESORTS", caption: "A pool deck a few steps from the sea" },
];

// ─────────────────────────────────────────────────────────────

async function reset() {
  await db.aiMessage.deleteMany(); await db.aiConversation.deleteMany();
  await db.supportMessage.deleteMany(); await db.supportTicket.deleteMany();
  await db.document.deleteMany(); await db.invoice.deleteMany(); await db.refund.deleteMany(); await db.payment.deleteMany();
  await db.bookingEvent.deleteMany(); await db.bookingTraveller.deleteMany(); await db.bookingComponentStatus.deleteMany();
  await db.bookingSnapshot.deleteMany(); await db.bookingItem.deleteMany(); await db.booking.deleteMany();
  await db.review.deleteMany(); await db.traveller.deleteMany(); await db.notification.deleteMany();
  await db.customerProfile.deleteMany(); await db.otpSession.deleteMany(); await db.customer.deleteMany();
  await db.packageDeparture.deleteMany(); await db.packageOption.deleteMany(); await db.packageDayItem.deleteMany();
  await db.packageDay.deleteMany(); await db.packageImage.deleteMany(); await db.packagePricingRule.deleteMany();
  await db.package.updateMany({ data: { currentVersionId: null } }); await db.packageVersion.deleteMany();
  await db.faq.deleteMany(); await db.travelGuide.deleteMany(); await db.package.deleteMany();
  await db.destinationOnCategory.deleteMany(); await db.destination.deleteMany(); await db.destinationCategory.deleteMany();
  await db.offer.deleteMany(); await db.coupon.deleteMany(); await db.supplierMapping.deleteMany(); await db.supplier.deleteMany();
  await db.galleryItem.deleteMany(); await db.testimonial.deleteMany();
  await db.rolePermission.deleteMany(); await db.adminUser.deleteMany(); await db.permission.deleteMany(); await db.role.deleteMany();
  await db.businessSetting.deleteMany(); await db.auditLog.deleteMany();
}

export const PERMISSIONS = [
  "dashboard.view", "booking.view", "booking.update", "booking.cancel", "booking.refund",
  "package.view", "package.create", "package.edit", "package.publish", "package.archive",
  "destination.manage", "supplier.manage", "customer.view", "payment.view", "refund.manage",
  "offer.manage", "coupon.manage", "review.moderate", "content.manage", "gallery.manage",
  "testimonial.manage", "enquiry.view", "enquiry.manage", "media.manage", "support.manage",
  "user.manage", "role.manage", "settings.manage", "audit.view", "report.view",
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: PERMISSIONS,
  OPERATIONS: ["dashboard.view", "booking.view", "booking.update", "booking.cancel", "enquiry.view", "enquiry.manage", "supplier.manage", "customer.view", "support.manage", "report.view"],
  PACKAGE_MANAGER: ["dashboard.view", "package.view", "package.create", "package.edit", "package.publish", "package.archive", "destination.manage", "media.manage", "gallery.manage"],
  FINANCE: ["dashboard.view", "payment.view", "refund.manage", "booking.refund", "report.view"],
  SUPPORT: ["dashboard.view", "booking.view", "customer.view", "enquiry.view", "enquiry.manage", "support.manage"],
  CONTENT_MANAGER: ["dashboard.view", "content.manage", "gallery.manage", "testimonial.manage", "media.manage", "offer.manage", "coupon.manage", "review.moderate", "destination.manage"],
  ANALYST: ["dashboard.view", "report.view", "audit.view"],
};

/**
 * Catalogue version. Bump this ONLY when the seeded catalogue itself changes
 * and should replace what is live. The deploy then reseeds the database ONCE,
 * on the next deploy, and skips on every deploy after that.
 *
 * ⚠️ A reseed wipes ALL data (packages, enquiries, bookings, edits). Only bump
 * this on a site that has no real data to lose. Routine catalogue edits should
 * be made in Admin → Packages, which is never overwritten.
 */
const SEED_VERSION = 2;

async function main() {
  // Production-safe: the deploy build runs this on every deploy. It populates
  // an EMPTY database, and otherwise reseeds only when SEED_VERSION has been
  // bumped since the database was last seeded — so real data is never wiped by
  // an ordinary deploy. FORCE_SEED=1 forces a reset + reseed regardless.
  const existing = await db.package.count().catch(() => 0);
  const seedState = await db.businessSetting.findUnique({ where: { key: "seed" } }).catch(() => null);
  const seededVersion = Number((seedState?.value as { version?: number } | null)?.version ?? 0);
  const force = process.env.FORCE_SEED === "1";
  if (existing > 0 && seededVersion >= SEED_VERSION && !force) {
    console.log(`✅ Database already seeded (catalogue v${seededVersion}, ${existing} packages) — skipping.`);
    return;
  }
  if (existing > 0) {
    console.log(`♻️  Reseeding catalogue v${seededVersion} → v${SEED_VERSION}${force ? " (FORCE_SEED)" : ""} — existing data will be replaced.`);
  }

  console.log("🌱 Reset…");
  await reset();

  console.log("🌱 Destination categories & destinations…");
  const catId = new Map<string, string>();
  for (const [i, c] of CATEGORIES.entries()) {
    catId.set(c.slug, (await db.destinationCategory.create({ data: { name: c.name, slug: c.slug, sortOrder: i } })).id);
  }

  const destId = new Map<string, string>();
  for (const [i, d] of DESTINATIONS.entries()) {
    const created = await db.destination.create({
      data: {
        slug: d.slug, name: d.name, country: "India", region: "Andaman & Nicobar Islands",
        heroImage: photoUrl(d.hero), thumbnail: photoUrl(d.thumb),
        shortSummary: d.shortSummary, overview: d.overview, bestTimeToVisit: d.bestTime,
        isPopular: !!d.popular, isPublished: true, sortOrder: i,
        travelInfo: { ...d.travelInfo, hubSlug: d.hub },
        categories: { create: d.categories.map((s) => ({ categoryId: catId.get(s)! })) },
      },
    });
    destId.set(d.slug, created.id);
  }

  console.log(`🌱 Holiday packages (${PACKAGES.length})…`);
  for (const p of PACKAGES) {
    const pkg = await db.package.create({
      data: {
        code: p.code, slug: p.slug, name: p.name, theme: p.theme,
        destinationId: destId.get("port-blair")!,
        status: "PUBLISHED", isFeatured: !!p.featured,
        // Lead-generation model: prices are starting rates confirmed by the
        // team, so the public UI offers "Enquire" rather than instant booking.
        enquiryOnly: true,
      },
    });

    const version = await db.packageVersion.create({
      data: {
        packageId: pkg.id, versionNumber: 1, isPublished: true, name: p.name,
        summary: `${p.short} across Port Blair, Havelock and Neil${p.baratang ? " with a Baratang day trip" : ""} — ${p.hotelCategory.toLowerCase()}, sightseeing and all island transfers.`,
        overview:
          `A complete ${p.days}-day Andaman holiday covering Port Blair, Havelock Island and Neil Island. ` +
          `The itinerary takes in the Cellular Jail and its Light & Sound Show, Ross Island and North Bay, ` +
          `Radhanagar and Kalapathar on Havelock, and Bharatpur, Laxmanpur and the natural coral bridge on Neil. ` +
          (p.baratang ? "It also includes a day trip to Baratang for the limestone caves and mangrove creek. " : "") +
          `Accommodation is ${p.hotelCategory.toLowerCase()} on twin-sharing, with ${p.transport.toLowerCase()} ` +
          `and ${p.ferryClass.toLowerCase()}. Minimum ${MIN_PAX} travellers.`,
        durationDays: p.days, durationNights: p.nights, currency: "INR",
        basePrice: p.price, perPersonPricing: true,
        minTravellers: MIN_PAX, maxTravellers: 30,
        // Honest status: the rate is the agency's advertised starting price and
        // is re-confirmed in writing before any booking. Availability is never
        // claimed in real time — every booking is confirmed by the team.
        pricingStatus: "INDICATIVE",
        availabilityStatus: "ON_REQUEST",
        category: p.theme, bestFor: `Groups of ${MIN_PAX} or more`,
        departureCities: ["Chennai", "Kolkata", "Delhi", "Bengaluru", "Hyderabad", "Visakhapatnam"],
        cityBreakdown: p.route,
        travelWindows: "Oct–May is the main season · Jun–Sep sees heavier seas and more ferry disruption",
        roomCategory: p.hotelCategory,
        mealPlan: p.has.breakfast ? "Breakfast included" : "Room only",
        flightSector: null,
        baggage: null,
        visaInfo: "Domestic travel — no visa required for Indian nationals. Foreign nationals should check the current permit rules before booking.",
        insuranceInfo: "Travel insurance is not included. We can suggest a provider on request.",
        seoTitle: `${p.name} — Andaman Tour | JST Andaman Travels`,
        seoDescription: `${p.name}: a ${p.nights} night, ${p.days} day Andaman holiday across Port Blair, Havelock and Neil with ${p.hotelCategory.toLowerCase()}, sightseeing and island transfers. From ₹${p.price.toLocaleString("en-IN")} per person, minimum ${MIN_PAX} travellers.`,
        highlights: [
          "Cellular Jail and the evening Light & Sound Show",
          "Ross Island and the North Bay reef",
          "Radhanagar Beach at sunset",
          "Kalapathar Beach on Havelock's sunrise coast",
          "Bharatpur, Laxmanpur and the natural coral bridge on Neil",
          ...(p.baratang ? ["Baratang limestone caves and mangrove creek"] : []),
        ],
        inclusions: inclusionsFor(p),
        exclusions: COMMON_EXCLUSIONS,
        cancellationPolicy: CANCELLATION_POLICY,
        importantInfo: IMPORTANT_INFO,
        // This is a planned, team-confirmed holiday — not a self-serve configurator.
        allowHotelChange: true, allowFlightChange: false, allowTransferChange: true,
        allowActivityChange: true, allowMealChange: false, allowAddons: true, allowDateChange: true,
        images: {
          create: p.images.map((k, idx) => ({
            url: photoUrl(k), alt: photoAlt(k), isCover: idx === 0, sortOrder: idx,
          })),
        },
        days: {
          create: itineraryDays(p).map((day, di) => ({
            dayNumber: di + 1, title: day.title, summary: day.summary,
            items: { create: day.items.map((it, ii) => ({ timeslot: it.timeslot, kind: it.kind, title: it.title, description: it.description, sortOrder: ii })) },
          })),
        },
      },
    });

    await db.package.update({ where: { id: pkg.id }, data: { currentVersionId: version.id } });

    await db.faq.createMany({
      data: [
        { scope: "PACKAGE", packageId: pkg.id, question: `What is the minimum group size for the ${p.tierLabel} package?`, answer: `This rate applies to a group of ${MIN_PAX} travellers or more sharing twin rooms. We are happy to quote for smaller groups — the per-person rate changes, so please send us an enquiry.`, sortOrder: 0 },
        { scope: "PACKAGE", packageId: pkg.id, question: "Are flights to Port Blair included?", answer: "No. Airfare to and from Port Blair is not included in this package. Tell us your departure city in your enquiry and we will quote flights alongside the land package.", sortOrder: 1 },
        { scope: "PACKAGE", packageId: pkg.id, question: "What happens if a ferry is cancelled?", answer: "Sailings are occasionally cancelled because of sea conditions. If that happens we rearrange the itinerary and the nights affected, and we tell you about any unavoidable supplier charge before it is incurred.", sortOrder: 2 },
      ],
    });
  }

  console.log("🌱 Gallery…");
  await db.galleryItem.createMany({
    data: GALLERY.map((g, i) => ({
      url: photoUrl(g.key), alt: photoAlt(g.key), caption: g.caption,
      location: g.location ?? null, category: g.category, isPublished: true, sortOrder: i,
    })),
  });

  console.log("🌱 FAQs…");
  await db.faq.createMany({
    data: [
      { scope: "GLOBAL", question: "When is the best time to visit the Andaman Islands?", answer: "October to May is the main season: calmer seas, reliable ferries and the clearest water. June to September is the monsoon — it is greener and quieter, but sailings are disrupted more often, so we build extra flexibility into monsoon itineraries.", sortOrder: 0 },
      { scope: "GLOBAL", question: "Do I need a permit to visit?", answer: "Indian nationals do not need a permit for Port Blair, Havelock (Swaroop Dweep) or Neil (Shaheed Dweep). Foreign nationals are issued a Restricted Area Permit on arrival for the permitted islands. Rules change from time to time, so please check the current position before you travel.", sortOrder: 1 },
      { scope: "GLOBAL", question: "How do I get to the Andaman Islands?", answer: "By air to Veer Savarkar International Airport in Port Blair, with direct flights from Chennai, Kolkata, Delhi, Bengaluru and Hyderabad. Airfare is not included in our land packages — tell us your departure city and we will quote it with your holiday.", sortOrder: 2 },
      { scope: "GLOBAL", question: "Are the prices on this website final?", answer: "No. The prices shown are starting rates per person for the stated group size and occupancy. Your final quote is confirmed in writing by our team once we know your dates, group and hotel preference, and it tells you exactly what is and is not included.", sortOrder: 3 },
      { scope: "GLOBAL", question: "Can you customise an itinerary?", answer: "Yes. Every package here is a starting point. We change the number of nights, the islands, the hotel category and the sightseeing to suit you — send us an enquiry with what you have in mind.", sortOrder: 4 },
      { scope: "GLOBAL", question: "How do I book with JST Andaman Travels?", answer: "Send an enquiry through this website, call us, or message us on WhatsApp. We reply with a written quotation and itinerary. To confirm, pay the 30% advance; we then confirm the hotels and ferries in writing, and the remaining 70% is payable on arrival unless your quotation says otherwise.", sortOrder: 5 },
      { scope: "GLOBAL", question: "Is scuba diving or snorkelling included?", answer: "Snorkelling at North Bay and the glass-bottom boat at Bharatpur are the usual optional activities, and scuba diving is available at Havelock and North Bay. These are run by independently licensed operators and are paid on site unless your written quotation says otherwise.", sortOrder: 6 },
      { scope: "GLOBAL", question: "How much luggage can I take on the inter-island ferry?", answer: "Private ferry operators generally allow one check-in bag and one cabin bag per passenger, with an excess charge beyond that. The exact allowance is set by the operator and we confirm it with your ferry tickets.", sortOrder: 7 },
    ],
  });

  console.log("🌱 RBAC, admin, settings…");
  const permId = new Map<string, string>();
  for (const key of PERMISSIONS) {
    permId.set(key, (await db.permission.create({ data: { key, name: key.replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) } })).id);
  }
  const roleId = new Map<string, string>();
  for (const key of ADMIN_ROLES) {
    roleId.set(key, (await db.role.create({
      data: {
        key, name: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        permissions: { create: (ROLE_PERMISSIONS[key] ?? []).map((pk) => ({ permissionId: permId.get(pk)! })) },
      },
    })).id);
  }

  /**
   * Initial super administrator. The login is a one-time code sent to this
   * inbox, so it MUST be an address the agency actually controls — set
   * ADMIN_EMAIL in the environment before the first deploy. No password is
   * stored and there is no public admin sign-up.
   */
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@jstandamantravels.com").toLowerCase();
  const adminMobile = (process.env.ADMIN_MOBILE || "9434284365").replace(/\D/g, "");
  await db.adminUser.create({
    data: { email: adminEmail, mobile: adminMobile, fullName: "JST Administrator", roleId: roleId.get("SUPER_ADMIN")! },
  });

  await db.businessSetting.createMany({
    data: [
      {
        key: SITE_SETTINGS_KEY,
        value: {
          ...DEFAULT_SITE_SETTINGS,
          // The Google rating of Jai Sritha Tours & Travels (4.8 from 54 reviews), as supplied by the business. The link lets
          // any visitor check it; replace it with the exact Google Business
          // profile link in Admin → Content, where the score is also edited.
          reviewScore: 4.8,
          reviewCount: 54,
          reviewUrl: "https://www.google.com/maps/search/?api=1&query=Jai+Sritha+Tours+and+Travels+Port+Blair",
        },
      },
      { key: "checkout", value: { taxRatePct: 5, currency: "INR" } },
      // Records which catalogue version is live, so the next deploy knows
      // whether a reseed is due (see SEED_VERSION).
      { key: "seed", value: { version: SEED_VERSION } },
    ],
  });

  // Real Google reviews supplied by the business (name and text only).
  await db.testimonial.createMany({
    data: GOOGLE_REVIEWS.map((r, i) => ({
      displayName: r.name, body: r.text, rating: null, source: "GOOGLE", status: "PUBLISHED", sortOrder: i,
    })),
  });

  console.log("✅ Seed complete:", {
    destinations: await db.destination.count(),
    packages: await db.package.count(),
    itineraryDays: await db.packageDay.count(),
    gallery: await db.galleryItem.count(),
    faqs: await db.faq.count(),
    testimonials: await db.testimonial.count(),
    admin: adminEmail,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
