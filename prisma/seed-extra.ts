/**
 * Idempotent "top-up" seed — safe to run on EVERY deploy.
 *
 * The main seed (prisma/seed.ts) only runs on an empty database. This script
 * upserts additional published destinations (India + international) so the
 * "Explore India" / "Explore the World" homepage sections and the destinations
 * listing look full, WITHOUT wiping or duplicating any existing data.
 *
 * It only adds destinations (real places) — never invented packages/prices.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=70`;

type DestData = {
  slug: string; name: string; country: string; region: string; hero: string; thumb: string;
  shortSummary: string; overview: string; bestTime: string; popular?: boolean;
  travelInfo: Record<string, string>;
};

const DOMESTIC = { visa: "Domestic — no visa", currency: "INR", timezone: "IST (UTC+5:30)" };

const EXTRA_DESTINATIONS: DestData[] = [
  // ── INDIA ─────────────────────────────────────────────
  { slug: "himachal", name: "Himachal", country: "India", region: "India",
    hero: img("photo-1626621341517-bbf3d9990a23"), thumb: img("photo-1605640840605-14ac1855827b"),
    shortSummary: "Snow peaks, pine valleys and hill-station charm.",
    overview: "From Shimla's colonial promenades to the adventure hub of Manali and the cafés of Kasol, Himachal is the Himalayas at their most accessible — apple orchards, river valleys and snow all year round.",
    bestTime: "March to June & December to February", popular: true,
    travelInfo: { ...DOMESTIC, language: "Hindi, Pahari", flightTime: "~1.5 hrs from Delhi (to Kullu)" } },
  { slug: "uttarakhand", name: "Uttarakhand", country: "India", region: "India",
    hero: img("photo-1516546453174-5e1098a4b4af"), thumb: img("photo-1548013146-72479768bada"),
    shortSummary: "Yoga capital, Himalayan treks and sacred rivers.",
    overview: "The Land of the Gods — Rishikesh's riverside yoga and rafting, the lakes of Nainital, Jim Corbett's wildlife and the char dham pilgrim trail set against soaring Himalayan peaks.",
    bestTime: "March to June & September to November",
    travelInfo: { ...DOMESTIC, language: "Hindi, Garhwali, Kumaoni", flightTime: "~1 hr from Delhi (to Dehradun)" } },
  { slug: "northeast", name: "Northeast India", country: "India", region: "India",
    hero: img("photo-1589308078059-be1415eab4c3"), thumb: img("photo-1566073771259-6a8506099945"),
    shortSummary: "Living root bridges, tea gardens and emerald hills.",
    overview: "The Seven Sisters — Meghalaya's living root bridges and waterfalls, Assam's tea gardens and one-horned rhinos, and the untouched valleys of Arunachal, Sikkim and Nagaland.",
    bestTime: "October to May",
    travelInfo: { ...DOMESTIC, language: "Assamese, Khasi, English & many more", flightTime: "~2.5 hrs from Delhi (to Guwahati)" } },
  { slug: "lakshadweep", name: "Lakshadweep", country: "India", region: "India",
    hero: img("photo-1512100356356-de1b84283e18"), thumb: img("photo-1544644181-1484b3fdfc62"),
    shortSummary: "Untouched coral atolls and lagoon-blue waters.",
    overview: "India's own coral paradise — a scattering of pristine atolls with powder-white beaches, translucent lagoons and world-class snorkelling and diving, far from the crowds.",
    bestTime: "October to March",
    travelInfo: { ...DOMESTIC, language: "Malayalam, Mahl", flightTime: "~1.5 hrs from Kochi (to Agatti)" } },

  // ── THE WORLD ─────────────────────────────────────────
  { slug: "malaysia", name: "Malaysia", country: "Malaysia", region: "Asia",
    hero: img("photo-1524413840807-0c3cb6fa808d"), thumb: img("photo-1535139262971-c51845709a48"),
    shortSummary: "Twin-tower skylines, rainforests and island beaches.",
    overview: "Truly Asia — Kuala Lumpur's Petronas Towers, the highlands and rainforests, plus the beaches of Langkawi combine culture, value and family fun.",
    bestTime: "December to April", popular: true,
    travelInfo: { visa: "e-visa / visa on arrival", currency: "MYR", language: "Malay, English", timezone: "MYT (UTC+8)", flightTime: "~5.5 hrs from Delhi" } },
  { slug: "mauritius", name: "Mauritius", country: "Mauritius", region: "Africa",
    hero: img("photo-1546412414-e1885259563a"), thumb: img("photo-1570366583862-f91883984fde"),
    shortSummary: "Lagoon-fringed beaches and volcanic mountains.",
    overview: "An Indian Ocean gem — turquoise lagoons, coral reefs, waterfalls and a lush volcanic interior make Mauritius a dream for honeymooners and families alike.",
    bestTime: "May to December",
    travelInfo: { visa: "Free visa on arrival", currency: "MUR", language: "English, French, Creole", timezone: "MUT (UTC+4)", flightTime: "~6.5 hrs from Mumbai" } },
  { slug: "sri-lanka", name: "Sri Lanka", country: "Sri Lanka", region: "Asia",
    hero: img("photo-1554797589-7241bb691973"), thumb: img("photo-1506461883276-594a12b11cf3"),
    shortSummary: "Tea country, ancient temples and golden beaches.",
    overview: "The Pearl of the Indian Ocean — hill-country tea plantations and scenic trains, sacred cities, wildlife safaris and the palm-lined beaches of the south coast.",
    bestTime: "December to March",
    travelInfo: { visa: "ETA (e-visa)", currency: "LKR", language: "Sinhala, Tamil, English", timezone: "IST (UTC+5:30)", flightTime: "~3.5 hrs from Chennai" } },
  { slug: "turkey", name: "Turkey", country: "Turkey", region: "Europe",
    hero: img("photo-1524231757912-21f4fe3a7200"), thumb: img("photo-1533105079780-92b9be482077"),
    shortSummary: "Hot-air balloons, bazaars and two-continent history.",
    overview: "Where Europe meets Asia — Istanbul's mosques and bazaars, the fairy chimneys and balloons of Cappadocia and the white travertines of Pamukkale.",
    bestTime: "April to June & September to November", popular: true,
    travelInfo: { visa: "e-visa for Indian passport holders", currency: "TRY", language: "Turkish", timezone: "TRT (UTC+3)", flightTime: "~7 hrs from Delhi" } },
  { slug: "georgia", name: "Georgia", country: "Georgia", region: "Europe",
    hero: img("photo-1571407970349-bc81e7e96d47"), thumb: img("photo-1518509562904-e7ef99cdcc86"),
    shortSummary: "Caucasus peaks, old-town charm and vineyards.",
    overview: "A rising star in the Caucasus — Tbilisi's atmospheric old town, dramatic mountain monasteries, cave cities and the world's oldest wine region.",
    bestTime: "May to October",
    travelInfo: { visa: "e-visa for Indian passport holders", currency: "GEL", language: "Georgian, Russian, English", timezone: "GET (UTC+4)", flightTime: "~6 hrs from Delhi" } },
  { slug: "azerbaijan", name: "Azerbaijan", country: "Azerbaijan", region: "Europe",
    hero: img("photo-1601823984263-b87b59798b70"), thumb: img("photo-1528702748617-c64d49f918af"),
    shortSummary: "Flame towers, boulevards and mud volcanoes.",
    overview: "The Land of Fire — Baku's futuristic Flame Towers and UNESCO old city, the Caspian promenade, mud volcanoes and mountain villages just a short hop away.",
    bestTime: "April to June & September to October",
    travelInfo: { visa: "e-visa for Indian passport holders", currency: "AZN", language: "Azerbaijani", timezone: "AZT (UTC+4)", flightTime: "~5.5 hrs from Delhi" } },
  { slug: "japan", name: "Japan", country: "Japan", region: "Asia",
    hero: img("photo-1493780474015-ba834fd0ce2f"), thumb: img("photo-1493976040374-85c8e12f0c0e"),
    shortSummary: "Cherry blossoms, bullet trains and timeless temples.",
    overview: "Ancient and ultra-modern at once — Tokyo's neon energy, Kyoto's temples and gardens, Mt Fuji and the cherry blossoms, connected by seamless bullet trains.",
    bestTime: "March to May & October to November", popular: true,
    travelInfo: { visa: "Tourist visa (assistance provided)", currency: "JPY", language: "Japanese", timezone: "JST (UTC+9)", flightTime: "~8 hrs from Delhi" } },
];

async function main() {
  let added = 0;
  let updated = 0;
  for (const d of EXTRA_DESTINATIONS) {
    const existing = await db.destination.findUnique({ where: { slug: d.slug }, select: { id: true } });
    await db.destination.upsert({
      where: { slug: d.slug },
      create: {
        slug: d.slug, name: d.name, country: d.country, region: d.region,
        heroImage: d.hero, thumbnail: d.thumb, shortSummary: d.shortSummary,
        overview: d.overview, bestTimeToVisit: d.bestTime, travelInfo: d.travelInfo,
        isPopular: d.popular ?? false, isPublished: true,
      },
      update: {
        // keep content fresh but never un-publish an admin-managed destination
        name: d.name, country: d.country, region: d.region,
        heroImage: d.hero, thumbnail: d.thumb, shortSummary: d.shortSummary,
        overview: d.overview, bestTimeToVisit: d.bestTime, travelInfo: d.travelInfo,
      },
    });
    if (existing) updated++; else added++;
  }
  console.log(`✅ Extra destinations synced — ${added} added, ${updated} updated.`);
}

main()
  .catch((e) => { console.error("seed-extra failed:", e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
