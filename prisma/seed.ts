/**
 * Seed — sample CATALOGUE content only (Phase 2 / Phase 41 constraints).
 *
 * What we seed: destinations, categories, packages + versions + structured
 * itineraries + customization options + departures, offers/coupons, FAQs,
 * RBAC roles/permissions, a dev admin, and business settings.
 *
 * What we deliberately DO NOT seed: reviews, bookings, payments, "confirmed"
 * states — those must only ever come from real customer activity.
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import { ADMIN_ROLES } from "../src/lib/constants";

const db = new PrismaClient();

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=70`;

type DaySpec = { title: string; summary?: string; items: { timeslot: string; kind: string; title: string; description?: string }[] };
type OptionSpec = { category: string; groupKey: string; label: string; description?: string; meta?: any; priceDelta: number; perPerson?: boolean; isDefault?: boolean };
type PkgSpec = {
  slug: string;
  name: string;
  theme: string;
  destinationSlug: string;
  featured?: boolean;
  nights: number;
  basePrice: number;
  summary: string;
  overview: string;
  images: string[];
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  days: DaySpec[];
  options: OptionSpec[];
  faqs?: { question: string; answer: string }[];
};

async function reset() {
  // Order matters (FK). Wipe catalogue + system, keep it idempotent for dev.
  await db.aiMessage.deleteMany();
  await db.aiConversation.deleteMany();
  await db.supportMessage.deleteMany();
  await db.supportTicket.deleteMany();
  await db.document.deleteMany();
  await db.invoice.deleteMany();
  await db.refund.deleteMany();
  await db.payment.deleteMany();
  await db.bookingEvent.deleteMany();
  await db.bookingTraveller.deleteMany();
  await db.bookingComponentStatus.deleteMany();
  await db.bookingSnapshot.deleteMany();
  await db.bookingItem.deleteMany();
  await db.booking.deleteMany();
  await db.review.deleteMany();
  await db.traveller.deleteMany();
  await db.notification.deleteMany();
  await db.customerProfile.deleteMany();
  await db.otpSession.deleteMany();
  await db.customer.deleteMany();

  await db.packageDeparture.deleteMany();
  await db.packageOption.deleteMany();
  await db.packageDayItem.deleteMany();
  await db.packageDay.deleteMany();
  await db.packageImage.deleteMany();
  await db.packagePricingRule.deleteMany();
  // detach current version pointers before deleting versions
  await db.package.updateMany({ data: { currentVersionId: null } });
  await db.packageVersion.deleteMany();
  await db.faq.deleteMany();
  await db.travelGuide.deleteMany();
  await db.package.deleteMany();
  await db.destinationOnCategory.deleteMany();
  await db.destination.deleteMany();
  await db.destinationCategory.deleteMany();
  await db.offer.deleteMany();
  await db.coupon.deleteMany();
  await db.supplierMapping.deleteMany();
  await db.supplier.deleteMany();
  await db.rolePermission.deleteMany();
  await db.adminUser.deleteMany();
  await db.permission.deleteMany();
  await db.role.deleteMany();
  await db.businessSetting.deleteMany();
  await db.auditLog.deleteMany();
}

const CATEGORIES = [
  { name: "Beach", slug: "beach" },
  { name: "Honeymoon", slug: "honeymoon" },
  { name: "Family", slug: "family" },
  { name: "Luxury", slug: "luxury" },
  { name: "Adventure", slug: "adventure" },
  { name: "City Break", slug: "city-break" },
];

const DESTINATIONS = [
  {
    slug: "dubai", name: "Dubai", country: "United Arab Emirates", region: "Middle East",
    hero: img("photo-1512453979798-5ea266f8880c"), thumb: img("photo-1518684079-3c830dcef090"),
    shortSummary: "Futuristic skylines, golden deserts and world-class shopping.",
    overview: "Dubai blends ultramodern architecture with Arabian heritage. Ride to the top of the Burj Khalifa, drift over red dunes on a desert safari, and unwind on pristine beaches — all in one dazzling city.",
    bestTime: "November to March", popular: true,
    categories: ["luxury", "family", "city-break"],
    travelInfo: { visa: "Visa on arrival / e-visa for Indian passport holders", currency: "AED (UAE Dirham)", language: "Arabic, English", timezone: "GST (UTC+4)", flightTime: "~3.5 hrs from Delhi" },
    faqs: [
      { question: "Do I need a visa for Dubai?", answer: "Most Indian travellers need a tourist visa, which ExpertzTrip can arrange as an add-on. Processing typically takes 3–4 working days." },
      { question: "What is the best time to visit Dubai?", answer: "November to March offers pleasant weather ideal for outdoor sightseeing and desert safaris." },
    ],
  },
  {
    slug: "bali", name: "Bali", country: "Indonesia", region: "Asia",
    hero: img("photo-1537996194471-e657df975ab4"), thumb: img("photo-1518548419970-58e3b4079ab2"),
    shortSummary: "Emerald rice terraces, spiritual temples and surf-kissed beaches.",
    overview: "The Island of the Gods is a soulful mix of lush jungle, sacred temples, boutique beach clubs and warm hospitality. Perfect for honeymooners and explorers alike.",
    bestTime: "April to October", popular: true,
    categories: ["honeymoon", "beach", "adventure"],
    travelInfo: { visa: "Visa on arrival for Indian passport holders", currency: "IDR (Indonesian Rupiah)", language: "Indonesian, English", timezone: "WITA (UTC+8)", flightTime: "~7 hrs from Delhi" },
    faqs: [
      { question: "Is Bali good for honeymoons?", answer: "Absolutely — Bali offers private-pool villas, romantic dinners and stunning sunsets that make it one of our most-loved honeymoon destinations." },
    ],
  },
  {
    slug: "maldives", name: "Maldives", country: "Maldives", region: "Asia",
    hero: img("photo-1514282401047-d79a71a590e8"), thumb: img("photo-1573843981267-be1999ff37cd"),
    shortSummary: "Overwater villas above a glass-clear turquoise lagoon.",
    overview: "A scattering of coral islands where powder-white sand meets impossibly blue water. Snorkel with reef fish, dine over the ocean and stay in iconic overwater villas.",
    bestTime: "November to April", popular: true,
    categories: ["honeymoon", "luxury", "beach"],
    travelInfo: { visa: "Free visa on arrival (30 days) for Indian passport holders", currency: "MVR / USD widely accepted", language: "Dhivehi, English", timezone: "MVT (UTC+5)", flightTime: "~4.5 hrs from Delhi" },
    faqs: [
      { question: "Are meals included in Maldives resorts?", answer: "Most of our Maldives packages include breakfast; you can upgrade to half-board or all-inclusive during customization." },
    ],
  },
  {
    slug: "thailand", name: "Thailand", country: "Thailand", region: "Asia",
    hero: img("photo-1528181304800-259b08848526"), thumb: img("photo-1552465011-b4e21bf6e79a"),
    shortSummary: "Island beaches, buzzing street life and golden temples.",
    overview: "From the limestone cliffs of Krabi to the neon energy of Bangkok, Thailand delivers beaches, culture and value in equal measure.",
    bestTime: "November to March", popular: true,
    categories: ["beach", "family", "adventure"],
    travelInfo: { visa: "Visa on arrival / e-visa for Indian passport holders", currency: "THB (Thai Baht)", language: "Thai, English", timezone: "ICT (UTC+7)", flightTime: "~4 hrs from Delhi" },
  },
  {
    slug: "singapore", name: "Singapore", country: "Singapore", region: "Asia",
    hero: img("photo-1525625293386-3f8f99389edd"), thumb: img("photo-1565967511849-76a60a516170"),
    shortSummary: "A gleaming garden city of food, futuristic parks and family fun.",
    overview: "Compact, clean and endlessly entertaining — Marina Bay, Gardens by the Bay, Sentosa and hawker feasts make Singapore a family favourite.",
    bestTime: "Year-round", popular: true,
    categories: ["family", "city-break", "luxury"],
    travelInfo: { visa: "e-visa required for Indian passport holders", currency: "SGD (Singapore Dollar)", language: "English, Malay, Mandarin, Tamil", timezone: "SGT (UTC+8)", flightTime: "~5.5 hrs from Delhi" },
  },
  {
    slug: "europe", name: "Europe", country: "Multiple", region: "Europe",
    hero: img("photo-1502602898657-3e91760cbb34"), thumb: img("photo-1523906834658-6e24ef2386f9"),
    shortSummary: "Iconic cities, alpine scenery and centuries of culture.",
    overview: "Glide past the Eiffel Tower, cruise Swiss lakes beneath snow-capped peaks and wander Rome's ancient streets on a multi-country grand tour.",
    bestTime: "May to September", popular: true,
    categories: ["luxury", "city-break", "family"],
    travelInfo: { visa: "Schengen visa required — ExpertzTrip assists with documentation", currency: "EUR (Euro) / CHF", language: "French, German, Italian, English", timezone: "CET (UTC+1)", flightTime: "~9 hrs from Delhi" },
  },
];

/** Build a standard, realistic customization option set for a package. */
function standardOptions(opts: { hotelBase: string; hotelUp: string; upDelta: number; luxDelta: number; privateTransfer: number; activities: { label: string; price: number }[]; addons?: { label: string; price: number }[] }): OptionSpec[] {
  const o: OptionSpec[] = [
    // Hotel (exclusive group)
    { category: "HOTEL", groupKey: "hotel", label: `${opts.hotelBase} (4★)`, description: "Comfortable 4-star stay, centrally located.", meta: { stars: 4 }, priceDelta: 0, isDefault: true },
    { category: "HOTEL", groupKey: "hotel", label: `${opts.hotelUp} (5★)`, description: "Upgrade to a premium 5-star property.", meta: { stars: 5 }, priceDelta: opts.upDelta },
    { category: "HOTEL", groupKey: "hotel", label: `Luxury collection (5★ deluxe)`, description: "Top-tier suites and prime location.", meta: { stars: 5 }, priceDelta: opts.luxDelta },
    // Flight (exclusive)
    { category: "FLIGHT", groupKey: "flight", label: "Economy return flights", description: "Return economy airfare included.", meta: { cabin: "economy" }, priceDelta: 0, isDefault: true },
    { category: "FLIGHT", groupKey: "flight", label: "Premium economy upgrade", description: "Extra legroom and priority boarding.", meta: { cabin: "premium_economy" }, priceDelta: 14000 },
    // Transfer (exclusive)
    { category: "TRANSFER", groupKey: "transfer", label: "Shared airport transfers", description: "Comfortable shared shuttle.", meta: { private: false }, priceDelta: 0, isDefault: true },
    { category: "TRANSFER", groupKey: "transfer", label: "Private airport transfers", description: "Private car, door to door.", meta: { private: true }, priceDelta: opts.privateTransfer },
    // Meal (exclusive)
    { category: "MEAL", groupKey: "meal", label: "Breakfast included", description: "Daily breakfast at your hotel.", priceDelta: 0, isDefault: true },
    { category: "MEAL", groupKey: "meal", label: "Half board (breakfast + dinner)", description: "Add dinner daily.", priceDelta: 6500 },
    // Activities (additive)
    ...opts.activities.map((a, i): OptionSpec => ({ category: "ACTIVITY", groupKey: `activity-${i}`, label: a.label, priceDelta: a.price })),
    // Add-ons (additive)
    ...((opts.addons ?? [{ label: "Travel insurance", price: 1200 }, { label: "Visa assistance", price: 2500 }]).map((a): OptionSpec => ({ category: "ADDON", groupKey: `addon-${a.label}`, label: a.label, priceDelta: a.price, perPerson: a.label !== "Visa assistance" ? true : true }))),
  ];
  return o;
}

const PACKAGES: PkgSpec[] = [
  {
    slug: "dubai-extravaganza", name: "Dubai Extravaganza", theme: "LUXURY", destinationSlug: "dubai", featured: true,
    nights: 5, basePrice: 45000,
    summary: "Skyline views, desert thrills and a Marina cruise across 5 unforgettable nights.",
    overview: "Experience the best of Dubai — from the observation deck of the Burj Khalifa to a dune-bashing desert safari and a glittering dhow cruise on Dubai Marina. This package balances iconic sightseeing with time to relax.",
    images: [img("photo-1512453979798-5ea266f8880c"), img("photo-1518684079-3c830dcef090"), img("photo-1580674285054-bed31e145f59")],
    highlights: ["At the Top — Burj Khalifa (Level 124)", "Evening desert safari with BBQ dinner", "Dhow dinner cruise on Dubai Marina", "Full-day Abu Dhabi city tour"],
    inclusions: ["5 nights hotel accommodation", "Daily breakfast", "Return economy flights", "Airport transfers", "Half-day city tour", "Desert safari with dinner"],
    exclusions: ["UAE tourist visa (add-on available)", "Lunches & dinners unless specified", "Personal expenses & tips", "Anything not mentioned in inclusions"],
    days: [
      { title: "Arrival in Dubai", items: [ { timeslot: "AFTERNOON", kind: "FLIGHT", title: "Arrive at Dubai International Airport" }, { timeslot: "AFTERNOON", kind: "TRANSFER", title: "Transfer to your hotel" }, { timeslot: "EVENING", kind: "FREE_TIME", title: "Evening at leisure", description: "Settle in and explore the neighbourhood." } ] },
      { title: "City Tour & Burj Khalifa", items: [ { timeslot: "MORNING", kind: "ACTIVITY", title: "Half-day Dubai city tour", description: "Jumeirah Mosque, Dubai Museum, Gold & Spice Souks." }, { timeslot: "EVENING", kind: "ACTIVITY", title: "At the Top — Burj Khalifa", description: "Sunset views from Level 124." }, { timeslot: "EVENING", kind: "MEAL", title: "Dinner at Dubai Mall" } ] },
      { title: "Desert Safari", items: [ { timeslot: "MORNING", kind: "FREE_TIME", title: "Leisure morning / optional shopping" }, { timeslot: "AFTERNOON", kind: "ACTIVITY", title: "Desert safari with dune bashing", description: "Camel rides, sandboarding and cultural show." }, { timeslot: "EVENING", kind: "MEAL", title: "BBQ dinner in the desert camp" } ] },
      { title: "Abu Dhabi Day Trip", items: [ { timeslot: "MORNING", kind: "ACTIVITY", title: "Sheikh Zayed Grand Mosque" }, { timeslot: "AFTERNOON", kind: "ACTIVITY", title: "Ferrari World photo stop & Corniche drive" } ] },
      { title: "Marina Cruise", items: [ { timeslot: "AFTERNOON", kind: "FREE_TIME", title: "Beach time at JBR" }, { timeslot: "EVENING", kind: "ACTIVITY", title: "Dhow dinner cruise, Dubai Marina" } ] },
      { title: "Departure", items: [ { timeslot: "MORNING", kind: "TRANSFER", title: "Transfer to airport" }, { timeslot: "MORNING", kind: "FLIGHT", title: "Return flight home" } ] },
    ],
    options: standardOptions({ hotelBase: "Rove Downtown", hotelUp: "Address Dubai Mall", upDelta: 9000, luxDelta: 22000, privateTransfer: 3500, activities: [ { label: "IMG Worlds of Adventure ticket", price: 4200 }, { label: "Dubai Frame entry", price: 1200 }, { label: "Aquaventure Waterpark", price: 5600 } ] }),
  },
  {
    slug: "dubai-family-fun", name: "Dubai Family Fun", theme: "FAMILY", destinationSlug: "dubai",
    nights: 4, basePrice: 39000,
    summary: "Theme parks, aquariums and beaches — a 4-night Dubai holiday built for families.",
    overview: "A relaxed, kid-friendly Dubai itinerary featuring the biggest attractions and plenty of downtime, with easy transfers and family-friendly hotels.",
    images: [img("photo-1518684079-3c830dcef090"), img("photo-1512453979798-5ea266f8880c")],
    highlights: ["Dubai Aquarium & Underwater Zoo", "Desert safari with entertainment", "Beach day at JBR", "Optional theme-park add-ons"],
    inclusions: ["4 nights accommodation", "Daily breakfast", "Return economy flights", "Airport transfers", "Desert safari"],
    exclusions: ["UAE visa (add-on available)", "Theme-park tickets unless added", "Meals unless specified"],
    days: [
      { title: "Arrival & JBR Beach", items: [ { timeslot: "AFTERNOON", kind: "FLIGHT", title: "Arrive in Dubai" }, { timeslot: "AFTERNOON", kind: "TRANSFER", title: "Hotel transfer" }, { timeslot: "EVENING", kind: "FREE_TIME", title: "Stroll The Beach at JBR" } ] },
      { title: "Downtown & Aquarium", items: [ { timeslot: "MORNING", kind: "ACTIVITY", title: "Dubai Aquarium & Underwater Zoo" }, { timeslot: "EVENING", kind: "ACTIVITY", title: "Dubai Fountain show" } ] },
      { title: "Desert Safari", items: [ { timeslot: "AFTERNOON", kind: "ACTIVITY", title: "Family desert safari" }, { timeslot: "EVENING", kind: "MEAL", title: "BBQ dinner & live show" } ] },
      { title: "Leisure & Optional Parks", items: [ { timeslot: "MORNING", kind: "FREE_TIME", title: "Free morning / optional theme park" } ] },
      { title: "Departure", items: [ { timeslot: "MORNING", kind: "TRANSFER", title: "Airport transfer & departure" } ] },
    ],
    options: standardOptions({ hotelBase: "Hilton Garden Inn", hotelUp: "Atlantis The Palm", upDelta: 16000, luxDelta: 30000, privateTransfer: 3500, activities: [ { label: "Atlantis Aquaventure Waterpark", price: 5600 }, { label: "IMG Worlds of Adventure", price: 4200 } ] }),
  },
  {
    slug: "bali-honeymoon-bliss", name: "Bali Honeymoon Bliss", theme: "HONEYMOON", destinationSlug: "bali", featured: true,
    nights: 5, basePrice: 52000,
    summary: "Private-pool villas, romantic dinners and Bali's most beautiful sunsets.",
    overview: "A romance-first itinerary through Ubud and Seminyak with a private-pool villa night, a floating breakfast, and a cand-lelit dinner by the beach.",
    images: [img("photo-1537996194471-e657df975ab4"), img("photo-1518548419970-58e3b4079ab2"), img("photo-1573790387438-4da905039392")],
    highlights: ["Private-pool villa experience", "Ubud rice terraces & swing", "Uluwatu temple sunset & Kecak dance", "Romantic beachfront dinner"],
    inclusions: ["5 nights accommodation", "Daily breakfast", "Return economy flights", "Airport & inter-city transfers", "Ubud & Uluwatu tours", "One romantic dinner"],
    exclusions: ["Visa on arrival fee", "Lunches unless specified", "Optional water sports", "Personal expenses"],
    days: [
      { title: "Arrival in Bali", items: [ { timeslot: "AFTERNOON", kind: "FLIGHT", title: "Arrive at Denpasar" }, { timeslot: "AFTERNOON", kind: "TRANSFER", title: "Transfer to Seminyak" }, { timeslot: "EVENING", kind: "MEAL", title: "Welcome dinner by the beach" } ] },
      { title: "Ubud Culture & Rice Terraces", items: [ { timeslot: "MORNING", kind: "ACTIVITY", title: "Tegallalang rice terraces & Bali swing" }, { timeslot: "AFTERNOON", kind: "ACTIVITY", title: "Sacred Monkey Forest & Ubud market" } ] },
      { title: "Private Villa Day", items: [ { timeslot: "MORNING", kind: "ACTIVITY", title: "Floating breakfast in private pool" }, { timeslot: "AFTERNOON", kind: "FREE_TIME", title: "Couples spa (optional)" } ] },
      { title: "Uluwatu Sunset", items: [ { timeslot: "AFTERNOON", kind: "ACTIVITY", title: "Uluwatu Temple cliffside" }, { timeslot: "EVENING", kind: "ACTIVITY", title: "Kecak fire dance at sunset" } ] },
      { title: "Beach & Leisure", items: [ { timeslot: "MORNING", kind: "FREE_TIME", title: "Seminyak beach clubs" } ] },
      { title: "Departure", items: [ { timeslot: "MORNING", kind: "TRANSFER", title: "Airport transfer & departure" } ] },
    ],
    options: standardOptions({ hotelBase: "Seminyak boutique resort", hotelUp: "Ubud private-pool villa", upDelta: 12000, luxDelta: 26000, privateTransfer: 2800, activities: [ { label: "Couples spa package", price: 4500 }, { label: "Nusa Penida day trip", price: 5200 }, { label: "ATV jungle ride", price: 3800 } ] }),
  },
  {
    slug: "bali-explorer", name: "Bali Explorer", theme: "ADVENTURE", destinationSlug: "bali",
    nights: 6, basePrice: 49000,
    summary: "Waterfalls, volcanoes and island-hopping across a 6-night Bali adventure.",
    overview: "For active travellers — trek to hidden waterfalls, chase a Mount Batur sunrise and snorkel off Nusa Penida.",
    images: [img("photo-1518548419970-58e3b4079ab2"), img("photo-1537996194471-e657df975ab4")],
    highlights: ["Mount Batur sunrise trek", "Nusa Penida island hopping", "Sekumpul waterfall hike", "Snorkelling with manta rays"],
    inclusions: ["6 nights accommodation", "Daily breakfast", "Return economy flights", "Transfers", "Batur trek & Nusa Penida tour"],
    exclusions: ["Visa fee", "Adventure activity insurance", "Meals unless specified"],
    days: [
      { title: "Arrival", items: [ { timeslot: "AFTERNOON", kind: "FLIGHT", title: "Arrive at Denpasar" }, { timeslot: "EVENING", kind: "TRANSFER", title: "Transfer to Ubud" } ] },
      { title: "Mount Batur Sunrise", items: [ { timeslot: "MORNING", kind: "ACTIVITY", title: "Sunrise trek to Mount Batur summit" }, { timeslot: "AFTERNOON", kind: "ACTIVITY", title: "Natural hot springs" } ] },
      { title: "Waterfalls", items: [ { timeslot: "MORNING", kind: "ACTIVITY", title: "Sekumpul & Tibumana waterfalls" } ] },
      { title: "Nusa Penida", items: [ { timeslot: "MORNING", kind: "ACTIVITY", title: "Kelingking Beach & Broken Beach" }, { timeslot: "AFTERNOON", kind: "ACTIVITY", title: "Snorkelling at Manta Point" } ] },
      { title: "Beach & Surf", items: [ { timeslot: "MORNING", kind: "ACTIVITY", title: "Surf lesson at Canggu" } ] },
      { title: "Leisure", items: [ { timeslot: "MORNING", kind: "FREE_TIME", title: "Free day" } ] },
      { title: "Departure", items: [ { timeslot: "MORNING", kind: "TRANSFER", title: "Airport transfer & departure" } ] },
    ],
    options: standardOptions({ hotelBase: "Ubud eco-resort", hotelUp: "Canggu design hotel", upDelta: 9000, luxDelta: 20000, privateTransfer: 2800, activities: [ { label: "White-water rafting", price: 3500 }, { label: "Scuba discovery dive", price: 6200 } ] }),
  },
  {
    slug: "maldives-overwater-escape", name: "Maldives Overwater Escape", theme: "HONEYMOON", destinationSlug: "maldives", featured: true,
    nights: 4, basePrice: 95000,
    summary: "Four nights in an iconic overwater villa above a turquoise lagoon.",
    overview: "The ultimate barefoot-luxury escape: an overwater villa with direct lagoon access, a sunset dolphin cruise and snorkelling straight off your deck.",
    images: [img("photo-1514282401047-d79a71a590e8"), img("photo-1573843981267-be1999ff37cd"), img("photo-1590523277543-a94d2e4eb00b")],
    highlights: ["Overwater villa with lagoon access", "Sunset dolphin cruise", "House-reef snorkelling", "Optional all-inclusive dining"],
    inclusions: ["4 nights overwater villa", "Daily breakfast", "Return economy flights", "Speedboat/seaplane transfers", "Snorkelling gear"],
    exclusions: ["Lunches & dinners unless upgraded", "Premium excursions", "Personal expenses"],
    days: [
      { title: "Arrival in Paradise", items: [ { timeslot: "AFTERNOON", kind: "FLIGHT", title: "Arrive at Malé" }, { timeslot: "AFTERNOON", kind: "TRANSFER", title: "Speedboat transfer to resort" }, { timeslot: "EVENING", kind: "FREE_TIME", title: "Sunset from your villa deck" } ] },
      { title: "Reef & Relaxation", items: [ { timeslot: "MORNING", kind: "ACTIVITY", title: "House-reef snorkelling" }, { timeslot: "AFTERNOON", kind: "FREE_TIME", title: "Lagoon leisure" } ] },
      { title: "Dolphin Cruise", items: [ { timeslot: "AFTERNOON", kind: "ACTIVITY", title: "Sunset dolphin cruise" }, { timeslot: "EVENING", kind: "MEAL", title: "Dinner under the stars" } ] },
      { title: "Leisure", items: [ { timeslot: "MORNING", kind: "FREE_TIME", title: "Spa or water sports (optional)" } ] },
      { title: "Departure", items: [ { timeslot: "MORNING", kind: "TRANSFER", title: "Transfer to Malé & departure" } ] },
    ],
    options: standardOptions({ hotelBase: "Lagoon overwater villa", hotelUp: "Sunset overwater villa", upDelta: 18000, luxDelta: 42000, privateTransfer: 0, activities: [ { label: "All-inclusive dining upgrade", price: 22000 }, { label: "Private sandbank picnic", price: 12000 }, { label: "Scuba diving (2 dives)", price: 9800 } ] }),
  },
  {
    slug: "phuket-krabi-beaches", name: "Phuket & Krabi Beaches", theme: "BEACH", destinationSlug: "thailand", featured: true,
    nights: 5, basePrice: 38000,
    summary: "Island-hopping, limestone cliffs and beach time across Phuket and Krabi.",
    overview: "Two of Thailand's most beautiful coastlines in one trip — speedboat to the Phi Phi Islands, kayak through Krabi's caves and soak up beach-town nightlife.",
    images: [img("photo-1528181304800-259b08848526"), img("photo-1509233725247-49e657c54213")],
    highlights: ["Phi Phi Islands speedboat tour", "James Bond Island & sea caves", "Krabi four-island tour", "Patong nightlife"],
    inclusions: ["5 nights accommodation", "Daily breakfast", "Return economy flights", "Transfers", "Phi Phi & four-island tours"],
    exclusions: ["Visa on arrival fee", "Optional tours", "Meals unless specified"],
    days: [
      { title: "Arrival in Phuket", items: [ { timeslot: "AFTERNOON", kind: "FLIGHT", title: "Arrive at Phuket" }, { timeslot: "EVENING", kind: "FREE_TIME", title: "Patong Beach evening" } ] },
      { title: "Phi Phi Islands", items: [ { timeslot: "MORNING", kind: "ACTIVITY", title: "Speedboat to Phi Phi & Maya Bay" }, { timeslot: "AFTERNOON", kind: "ACTIVITY", title: "Snorkelling at Pileh Lagoon" } ] },
      { title: "Phang Nga Bay", items: [ { timeslot: "MORNING", kind: "ACTIVITY", title: "James Bond Island & canoeing" } ] },
      { title: "Transfer to Krabi", items: [ { timeslot: "MORNING", kind: "TRANSFER", title: "Scenic transfer to Krabi" }, { timeslot: "AFTERNOON", kind: "FREE_TIME", title: "Ao Nang beach" } ] },
      { title: "Four Islands Tour", items: [ { timeslot: "MORNING", kind: "ACTIVITY", title: "Krabi four-island longtail tour" } ] },
      { title: "Departure", items: [ { timeslot: "MORNING", kind: "TRANSFER", title: "Airport transfer & departure" } ] },
    ],
    options: standardOptions({ hotelBase: "Patong 4★ resort", hotelUp: "Beachfront 5★ resort", upDelta: 8000, luxDelta: 18000, privateTransfer: 2500, activities: [ { label: "Tiger Kingdom visit", price: 2200 }, { label: "Thai cooking class", price: 2800 }, { label: "Simon Cabaret show", price: 1800 } ] }),
  },
  {
    slug: "bangkok-pattaya", name: "Bangkok & Pattaya", theme: "FAMILY", destinationSlug: "thailand",
    nights: 4, basePrice: 32000,
    summary: "Temples, markets and coral islands — a value-packed Thailand starter.",
    overview: "A classic first-timer's Thailand combo: Bangkok's temples and shopping paired with Pattaya's Coral Island and shows.",
    images: [img("photo-1552465011-b4e21bf6e79a"), img("photo-1528181304800-259b08848526")],
    highlights: ["Coral Island (Koh Larn)", "Grand Palace & temples", "Floating market", "Chao Phraya dinner cruise"],
    inclusions: ["4 nights accommodation", "Daily breakfast", "Return economy flights", "Transfers", "Coral Island tour"],
    exclusions: ["Visa fee", "Optional shows", "Meals unless specified"],
    days: [
      { title: "Arrival & Transfer to Pattaya", items: [ { timeslot: "AFTERNOON", kind: "FLIGHT", title: "Arrive at Bangkok" }, { timeslot: "AFTERNOON", kind: "TRANSFER", title: "Transfer to Pattaya" } ] },
      { title: "Coral Island", items: [ { timeslot: "MORNING", kind: "ACTIVITY", title: "Speedboat to Koh Larn" }, { timeslot: "AFTERNOON", kind: "ACTIVITY", title: "Water sports & beach" } ] },
      { title: "Bangkok City", items: [ { timeslot: "MORNING", kind: "TRANSFER", title: "Return to Bangkok" }, { timeslot: "AFTERNOON", kind: "ACTIVITY", title: "Grand Palace & Wat Pho" } ] },
      { title: "Shopping & Departure", items: [ { timeslot: "MORNING", kind: "FREE_TIME", title: "Shopping at MBK / Chatuchak" }, { timeslot: "AFTERNOON", kind: "TRANSFER", title: "Airport transfer & departure" } ] },
    ],
    options: standardOptions({ hotelBase: "City 4★ hotel", hotelUp: "Riverside 5★ hotel", upDelta: 6500, luxDelta: 14000, privateTransfer: 2200, activities: [ { label: "Safari World & Marine Park", price: 2600 }, { label: "Chao Phraya dinner cruise", price: 2400 } ] }),
  },
  {
    slug: "singapore-city-sentosa", name: "Singapore City & Sentosa", theme: "FAMILY", destinationSlug: "singapore", featured: true,
    nights: 4, basePrice: 42000,
    summary: "Gardens, Universal Studios and skyline views in the ultimate family city break.",
    overview: "Singapore packs a lot into four nights — Gardens by the Bay, a Sentosa day with Universal Studios and a Night Safari, all easy to get around.",
    images: [img("photo-1525625293386-3f8f99389edd"), img("photo-1565967511849-76a60a516170"), img("photo-1496939376851-89342e90adcd")],
    highlights: ["Gardens by the Bay & Cloud Forest", "Universal Studios Sentosa", "Marina Bay Sands SkyPark", "Night Safari"],
    inclusions: ["4 nights accommodation", "Daily breakfast", "Return economy flights", "Airport transfers", "City tour"],
    exclusions: ["e-Visa fee", "Attraction tickets unless added", "Meals unless specified"],
    days: [
      { title: "Arrival & Marina Bay", items: [ { timeslot: "AFTERNOON", kind: "FLIGHT", title: "Arrive at Changi" }, { timeslot: "EVENING", kind: "ACTIVITY", title: "Gardens by the Bay light show" } ] },
      { title: "City Tour", items: [ { timeslot: "MORNING", kind: "ACTIVITY", title: "Merlion Park, Chinatown & Little India" }, { timeslot: "EVENING", kind: "ACTIVITY", title: "Night Safari" } ] },
      { title: "Sentosa Day", items: [ { timeslot: "MORNING", kind: "ACTIVITY", title: "Universal Studios Singapore (optional)" }, { timeslot: "EVENING", kind: "ACTIVITY", title: "Wings of Time show" } ] },
      { title: "Shopping & Leisure", items: [ { timeslot: "MORNING", kind: "FREE_TIME", title: "Orchard Road shopping" } ] },
      { title: "Departure", items: [ { timeslot: "MORNING", kind: "TRANSFER", title: "Airport transfer & departure" } ] },
    ],
    options: standardOptions({ hotelBase: "City 4★ hotel", hotelUp: "Marina Bay 5★ hotel", upDelta: 15000, luxDelta: 34000, privateTransfer: 3200, activities: [ { label: "Universal Studios ticket", price: 5200 }, { label: "S.E.A. Aquarium", price: 2600 }, { label: "Singapore Flyer", price: 1900 } ] }),
  },
  {
    slug: "europe-highlights-paris-swiss-rome", name: "Europe Highlights: Paris · Swiss · Rome", theme: "LUXURY", destinationSlug: "europe", featured: true,
    nights: 8, basePrice: 165000,
    summary: "Three iconic destinations, one seamless 8-night grand tour of Europe.",
    overview: "A bucket-list journey from the boulevards of Paris to the Swiss Alps and the ancient wonders of Rome, with comfortable rail and coach connections throughout.",
    images: [img("photo-1502602898657-3e91760cbb34"), img("photo-1523906834658-6e24ef2386f9"), img("photo-1467269204594-9661b134dd2b")],
    highlights: ["Eiffel Tower & Seine cruise", "Jungfraujoch — Top of Europe", "Mount Titlis cable car", "Colosseum & Vatican City"],
    inclusions: ["8 nights accommodation", "Daily breakfast", "Return economy flights", "Intercity rail/coach", "City tours as per itinerary"],
    exclusions: ["Schengen visa fee (assistance provided)", "Lunches & dinners unless specified", "Optional excursions", "City taxes payable locally"],
    days: [
      { title: "Arrive in Paris", items: [ { timeslot: "AFTERNOON", kind: "FLIGHT", title: "Arrive at Paris CDG" }, { timeslot: "EVENING", kind: "FREE_TIME", title: "Evening at leisure" } ] },
      { title: "Paris City Tour", items: [ { timeslot: "MORNING", kind: "ACTIVITY", title: "Eiffel Tower & city highlights" }, { timeslot: "AFTERNOON", kind: "ACTIVITY", title: "Seine river cruise" } ] },
      { title: "Disneyland / Leisure", items: [ { timeslot: "MORNING", kind: "FREE_TIME", title: "Optional Disneyland Paris" } ] },
      { title: "Paris to Switzerland", items: [ { timeslot: "MORNING", kind: "TRANSFER", title: "Scenic transfer to Switzerland" }, { timeslot: "AFTERNOON", kind: "FREE_TIME", title: "Lucerne lakeside walk" } ] },
      { title: "Mount Titlis", items: [ { timeslot: "MORNING", kind: "ACTIVITY", title: "Cable car to Mount Titlis" } ] },
      { title: "Jungfraujoch", items: [ { timeslot: "MORNING", kind: "ACTIVITY", title: "Cogwheel train to Top of Europe" } ] },
      { title: "Switzerland to Rome", items: [ { timeslot: "MORNING", kind: "FLIGHT", title: "Flight to Rome" }, { timeslot: "EVENING", kind: "FREE_TIME", title: "Evening near the Spanish Steps" } ] },
      { title: "Rome & Vatican", items: [ { timeslot: "MORNING", kind: "ACTIVITY", title: "Colosseum & Roman Forum" }, { timeslot: "AFTERNOON", kind: "ACTIVITY", title: "Vatican City & St Peter's" } ] },
      { title: "Departure", items: [ { timeslot: "MORNING", kind: "TRANSFER", title: "Transfer to airport & departure" } ] },
    ],
    options: standardOptions({ hotelBase: "3★ central hotels", hotelUp: "4★ superior hotels", upDelta: 28000, luxDelta: 60000, privateTransfer: 6000, activities: [ { label: "Disneyland Paris day", price: 9500 }, { label: "Louvre skip-the-line", price: 3200 }, { label: "Vatican guided tour", price: 4200 } ] }),
  },
];

function departuresForNextMonths(count = 4): { date: Date; priceDelta: number }[] {
  const out: { date: Date; priceDelta: number }[] = [];
  const now = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 12, 0, 0, 0);
    // peak-season style surcharge on the furthest dates
    out.push({ date: d, priceDelta: i >= 3 ? 3500 : 0 });
  }
  return out;
}

async function main() {
  console.log("🌱 Resetting…");
  await reset();

  console.log("🌱 Categories & destinations…");
  const categoryBySlug = new Map<string, string>();
  for (const [i, c] of CATEGORIES.entries()) {
    const created = await db.destinationCategory.create({ data: { name: c.name, slug: c.slug, sortOrder: i } });
    categoryBySlug.set(c.slug, created.id);
  }

  const destBySlug = new Map<string, string>();
  for (const [i, d] of DESTINATIONS.entries()) {
    const dest = await db.destination.create({
      data: {
        slug: d.slug, name: d.name, country: d.country, region: d.region,
        heroImage: d.hero, thumbnail: d.thumb, shortSummary: d.shortSummary,
        overview: d.overview, bestTimeToVisit: d.bestTime, isPopular: d.popular,
        sortOrder: i, travelInfo: d.travelInfo,
        categories: { create: d.categories.map((slug) => ({ categoryId: categoryBySlug.get(slug)! })) },
        faqs: d.faqs ? { create: d.faqs.map((f, idx) => ({ scope: "DESTINATION", question: f.question, answer: f.answer, sortOrder: idx })) } : undefined,
      },
    });
    destBySlug.set(d.slug, dest.id);
  }

  console.log("🌱 Packages, versions, itineraries, options…");
  for (const p of PACKAGES) {
    const destinationId = destBySlug.get(p.destinationSlug)!;
    const pkg = await db.package.create({
      data: { slug: p.slug, name: p.name, theme: p.theme, destinationId, status: "PUBLISHED", isFeatured: !!p.featured },
    });

    const version = await db.packageVersion.create({
      data: {
        packageId: pkg.id, versionNumber: 1, isPublished: true, name: p.name,
        summary: p.summary, overview: p.overview, durationDays: p.nights + 1, durationNights: p.nights,
        currency: "INR", basePrice: p.basePrice, perPersonPricing: true,
        highlights: p.highlights, inclusions: p.inclusions, exclusions: p.exclusions,
        cancellationPolicy: "Free cancellation up to 21 days before departure. 25% charge within 21–8 days. 50% within 7–3 days. No refund within 48 hours of departure.",
        importantInfo: "Prices are per person on twin-sharing basis and subject to availability at the time of booking. A valid passport with at least 6 months validity is required.",
        images: { create: p.images.map((url, idx) => ({ url, isCover: idx === 0, sortOrder: idx, alt: `${p.name} ${idx + 1}` })) },
        days: {
          create: p.days.map((day, di) => ({
            dayNumber: di + 1, title: day.title, summary: day.summary,
            items: { create: day.items.map((it, ii) => ({ timeslot: it.timeslot, kind: it.kind, title: it.title, description: it.description, sortOrder: ii })) },
          })),
        },
        options: { create: p.options.map((o, oi) => ({ category: o.category, groupKey: o.groupKey, label: o.label, description: o.description, meta: o.meta, priceDelta: o.priceDelta, perPerson: o.perPerson ?? true, isDefault: !!o.isDefault, sortOrder: oi })) },
        departures: { create: departuresForNextMonths().map((d) => ({ date: d.date, priceDelta: d.priceDelta })) },
      },
    });

    await db.package.update({ where: { id: pkg.id }, data: { currentVersionId: version.id } });

    if (p.faqs) {
      await db.faq.createMany({ data: p.faqs.map((f, idx) => ({ scope: "PACKAGE", packageId: pkg.id, question: f.question, answer: f.answer, sortOrder: idx })) });
    }
  }

  console.log("🌱 Offers & coupons…");
  await db.offer.createMany({
    data: [
      { slug: "monsoon-sale", title: "Monsoon Escape Sale", description: "Save up to ₹8,000 on select beach holidays.", badge: "Limited time", image: img("photo-1507525428034-b723cf961d3e"), ctaHref: "/packages", sortOrder: 0 },
      { slug: "honeymoon-special", title: "Honeymoon Special", description: "Complimentary romantic dinner on honeymoon packages.", badge: "Couples", image: img("photo-1522673607200-164d1b6ce486"), ctaHref: "/packages?theme=HONEYMOON", sortOrder: 1 },
      { slug: "early-bird", title: "Early Bird Offer", description: "Book 60 days ahead and save more.", badge: "Plan ahead", image: img("photo-1436491865332-7a61a109cc05"), ctaHref: "/packages", sortOrder: 2 },
    ],
  });
  await db.coupon.createMany({
    data: [
      { code: "WELCOME5", description: "5% off your first booking", kind: "PERCENT", value: 5, maxDiscount: 6000, isActive: true },
      { code: "FLAT4000", description: "Flat ₹4,000 off on bookings above ₹80,000", kind: "FLAT", value: 4000, minAmount: 80000, isActive: true },
    ],
  });

  console.log("🌱 FAQs (global)…");
  await db.faq.createMany({
    data: [
      { scope: "GLOBAL", question: "How do I book a holiday with ExpertzTrip?", answer: "Pick a package, customize it to your liking, verify your mobile with an OTP, add traveller details and pay securely via Razorpay.", sortOrder: 0 },
      { scope: "GLOBAL", question: "Are the prices per person?", answer: "Yes — package prices are shown per person on a twin-sharing basis unless stated otherwise. The final price is always calculated on the server before payment.", sortOrder: 1 },
      { scope: "GLOBAL", question: "Can I customize a package?", answer: "Every package can be tailored — upgrade hotels, choose private transfers, add activities and more. Your price updates instantly and is confirmed on the server.", sortOrder: 2 },
      { scope: "GLOBAL", question: "How will I receive my tickets and vouchers?", answer: "Once your booking is confirmed, e-tickets, hotel vouchers and your final itinerary are emailed to you and available under My Trips.", sortOrder: 3 },
    ],
  });

  console.log("🌱 Travel guides…");
  await db.travelGuide.createMany({
    data: [
      { slug: "dubai-first-timers-guide", destinationId: destBySlug.get("dubai"), title: "Dubai for first-timers: everything you need to know", excerpt: "Visas, best time to visit, getting around and the must-see sights for your first Dubai trip.", coverImage: img("photo-1512453979798-5ea266f8880c"), body: "Dubai is one of the easiest international holidays for Indian travellers. This guide covers visas, the best months to visit, how to get around, and how to pace a first-time itinerary between the Burj Khalifa, a desert safari and the beaches." },
      { slug: "bali-honeymoon-planning", destinationId: destBySlug.get("bali"), title: "Planning the perfect Bali honeymoon", excerpt: "Where to stay, romantic experiences and the ideal number of days for a Bali honeymoon.", coverImage: img("photo-1537996194471-e657df975ab4"), body: "From private-pool villas in Ubud to sunset dinners in Seminyak, here's how to plan a Bali honeymoon that balances romance, culture and relaxation." },
      { slug: "maldives-resort-choosing", destinationId: destBySlug.get("maldives"), title: "How to choose the right Maldives resort", excerpt: "Overwater vs beach villas, meal plans and transfers explained.", coverImage: img("photo-1514282401047-d79a71a590e8"), body: "The Maldives has a resort for every budget. This guide explains overwater versus beach villas, board basis (breakfast, half-board, all-inclusive), and speedboat versus seaplane transfers so you pick the right island." },
      { slug: "thailand-island-hopping", destinationId: destBySlug.get("thailand"), title: "Thailand island-hopping: Phuket, Krabi & beyond", excerpt: "A practical guide to combining Thailand's best beaches in one trip.", coverImage: img("photo-1528181304800-259b08848526"), body: "Phuket, Krabi, Phi Phi and Phang Nga Bay each offer something different. Learn how to sequence them, when to go, and which tours are worth booking ahead." },
      { slug: "europe-schengen-visa-guide", destinationId: destBySlug.get("europe"), title: "The Indian traveller's Schengen visa guide", excerpt: "Documents, timelines and tips for a smooth Europe visa application.", coverImage: img("photo-1502602898657-3e91760cbb34"), body: "A Schengen visa opens up most of Europe. This guide walks through the documents you need, realistic timelines, and how ExpertzTrip helps with the paperwork for a multi-country trip." },
    ],
  });

  console.log("🌱 RBAC roles & permissions…");
  const PERMISSIONS = [
    "dashboard.view", "booking.view", "booking.update", "booking.cancel", "booking.refund",
    "package.view", "package.create", "package.edit", "package.publish", "package.archive",
    "destination.manage", "supplier.manage", "customer.view", "payment.view", "refund.manage",
    "offer.manage", "coupon.manage", "review.moderate", "content.manage", "support.manage",
    "user.manage", "role.manage", "settings.manage", "audit.view", "report.view",
  ];
  const permIdByKey = new Map<string, string>();
  for (const key of PERMISSIONS) {
    const perm = await db.permission.create({ data: { key, name: key.replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) } });
    permIdByKey.set(key, perm.id);
  }
  const rolePerms: Record<string, string[]> = {
    SUPER_ADMIN: PERMISSIONS,
    OPERATIONS: ["dashboard.view", "booking.view", "booking.update", "booking.cancel", "supplier.manage", "customer.view", "support.manage", "report.view"],
    PACKAGE_MANAGER: ["dashboard.view", "package.view", "package.create", "package.edit", "package.publish", "package.archive", "destination.manage"],
    FINANCE: ["dashboard.view", "payment.view", "refund.manage", "booking.refund", "report.view"],
    SUPPORT: ["dashboard.view", "booking.view", "customer.view", "support.manage"],
    CONTENT_MANAGER: ["dashboard.view", "content.manage", "offer.manage", "coupon.manage", "review.moderate", "destination.manage"],
    ANALYST: ["dashboard.view", "report.view", "audit.view"],
  };
  const roleIdByKey = new Map<string, string>();
  for (const key of ADMIN_ROLES) {
    const role = await db.role.create({
      data: {
        key, name: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        permissions: { create: (rolePerms[key] ?? []).map((pk) => ({ permissionId: permIdByKey.get(pk)! })) },
      },
    });
    roleIdByKey.set(key, role.id);
  }

  console.log("🌱 Dev admin user…");
  await db.adminUser.create({
    data: {
      email: "admin@expertztrip.com", fullName: "ExpertzTrip Admin",
      passwordHash: hashPassword("ChangeMe#2026"), roleId: roleIdByKey.get("SUPER_ADMIN")!,
    },
  });

  console.log("🌱 Suppliers (no secrets stored)…");
  await db.supplier.createMany({
    data: [
      { name: "SkyLink Aviation", type: "FLIGHT", status: "ACTIVE", credentialRef: "secret://suppliers/skylink" },
      { name: "StayWell Hotels DMC", type: "HOTEL", status: "ACTIVE", credentialRef: "secret://suppliers/staywell" },
      { name: "DesertDrive Transfers", type: "TRANSFER", status: "ACTIVE", credentialRef: "secret://suppliers/desertdrive" },
    ],
  });

  console.log("🌱 Business settings…");
  await db.businessSetting.createMany({
    data: [
      { key: "brand", value: { name: "ExpertzTrip", supportEmail: "support@expertztrip.com", supportPhone: "+91 90000 00000" } },
      { key: "checkout", value: { taxRatePct: 5, currency: "INR" } },
    ],
  });

  const counts = {
    destinations: await db.destination.count(),
    packages: await db.package.count({ where: { status: "PUBLISHED" } }),
    options: await db.packageOption.count(),
    days: await db.packageDay.count(),
  };
  console.log("✅ Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
