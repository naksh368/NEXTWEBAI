/**
 * ExpertzTrip catalogue seed — 50 ORIGINAL, fully-structured holiday packages.
 *
 * Pricing policy (per spec): we do NOT invent competitor benchmark prices. Since
 * verified benchmarks aren't available in this build, every package is created
 * with complete structure but pricingStatus = PRICE_REVIEW_REQUIRED and no
 * invented price. An admin sets a verified benchmark (+₹550) before publishing a
 * live price. Content is original and generator-built — never copied.
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import { ADMIN_ROLES } from "../src/lib/constants";

const db = new PrismaClient();
const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=70`;

const CATEGORIES = [
  { name: "Beach", slug: "beach" }, { name: "Honeymoon", slug: "honeymoon" },
  { name: "Family", slug: "family" }, { name: "Luxury", slug: "luxury" },
  { name: "Adventure", slug: "adventure" }, { name: "City Break", slug: "city-break" },
];

type DestData = {
  slug: string; name: string; country: string; region: string; hero: string; thumb: string;
  shortSummary: string; overview: string; bestTime: string; popular?: boolean;
  categories: string[]; travelInfo: Record<string, string>;
};

const DESTINATIONS: DestData[] = [
  { slug: "dubai", name: "Dubai", country: "United Arab Emirates", region: "Middle East", hero: img("photo-1512453979798-5ea266f8880c"), thumb: img("photo-1518684079-3c830dcef090"), shortSummary: "Futuristic skylines, golden deserts and world-class shopping.", overview: "Dubai blends ultramodern architecture with Arabian heritage — the Burj Khalifa, desert safaris and pristine beaches in one dazzling city.", bestTime: "November to March", popular: true, categories: ["luxury", "family", "city-break"], travelInfo: { visa: "Tourist visa (e-visa) for Indian passport holders", currency: "AED", language: "Arabic, English", timezone: "GST (UTC+4)", flightTime: "~3.5 hrs from Delhi" } },
  { slug: "bali", name: "Bali", country: "Indonesia", region: "Asia", hero: img("photo-1537996194471-e657df975ab4"), thumb: img("photo-1518548419970-58e3b4079ab2"), shortSummary: "Emerald rice terraces, temples and surf-kissed beaches.", overview: "The Island of the Gods mixes lush jungle, sacred temples, beach clubs and warm hospitality — perfect for honeymooners and explorers.", bestTime: "April to October", popular: true, categories: ["honeymoon", "beach", "adventure"], travelInfo: { visa: "Visa on arrival for Indian passport holders", currency: "IDR", language: "Indonesian, English", timezone: "WITA (UTC+8)", flightTime: "~7 hrs from Delhi" } },
  { slug: "maldives", name: "Maldives", country: "Maldives", region: "Asia", hero: img("photo-1514282401047-d79a71a590e8"), thumb: img("photo-1573843981267-be1999ff37cd"), shortSummary: "Overwater villas above a glass-clear turquoise lagoon.", overview: "Coral islands where powder-white sand meets impossibly blue water — snorkel reefs, dine over the ocean and stay in iconic overwater villas.", bestTime: "November to April", popular: true, categories: ["honeymoon", "luxury", "beach"], travelInfo: { visa: "Free visa on arrival (30 days)", currency: "MVR / USD", language: "Dhivehi, English", timezone: "MVT (UTC+5)", flightTime: "~4.5 hrs from Delhi" } },
  { slug: "thailand", name: "Thailand", country: "Thailand", region: "Asia", hero: img("photo-1528181304800-259b08848526"), thumb: img("photo-1552465011-b4e21bf6e79a"), shortSummary: "Island beaches, buzzing street life and golden temples.", overview: "From Krabi's limestone cliffs to Bangkok's neon energy, Thailand delivers beaches, culture and value in equal measure.", bestTime: "November to March", popular: true, categories: ["beach", "family", "adventure"], travelInfo: { visa: "Visa on arrival / e-visa", currency: "THB", language: "Thai, English", timezone: "ICT (UTC+7)", flightTime: "~4 hrs from Delhi" } },
  { slug: "singapore", name: "Singapore", country: "Singapore", region: "Asia", hero: img("photo-1525625293386-3f8f99389edd"), thumb: img("photo-1565967511849-76a60a516170"), shortSummary: "A gleaming garden city of food, futuristic parks and fun.", overview: "Compact, clean and endlessly entertaining — Marina Bay, Gardens by the Bay, Sentosa and hawker feasts make Singapore a family favourite.", bestTime: "Year-round", popular: true, categories: ["family", "city-break", "luxury"], travelInfo: { visa: "e-visa required", currency: "SGD", language: "English, Malay, Mandarin, Tamil", timezone: "SGT (UTC+8)", flightTime: "~5.5 hrs from Delhi" } },
  { slug: "europe", name: "Europe", country: "Multiple", region: "Europe", hero: img("photo-1502602898657-3e91760cbb34"), thumb: img("photo-1523906834658-6e24ef2386f9"), shortSummary: "Iconic cities, alpine scenery and centuries of culture.", overview: "Glide past the Eiffel Tower, cruise Swiss lakes beneath snow-capped peaks and wander Rome's ancient streets on a multi-country tour.", bestTime: "May to September", popular: true, categories: ["luxury", "city-break", "family"], travelInfo: { visa: "Schengen visa (assistance provided)", currency: "EUR / CHF", language: "French, German, Italian, English", timezone: "CET (UTC+1)", flightTime: "~9 hrs from Delhi" } },
  { slug: "vietnam", name: "Vietnam", country: "Vietnam", region: "Asia", hero: img("photo-1528127269322-539801943592"), thumb: img("photo-1509923292149-4b6a8b3e5a0f"), shortSummary: "Emerald bays, lantern-lit towns and vibrant street food.", overview: "Cruise the karst islands of Halong Bay, wander lantern-lit Hoi An and taste Vietnam's legendary street food across a beautiful, great-value country.", bestTime: "February to April", categories: ["adventure", "beach", "family"], travelInfo: { visa: "e-visa for Indian passport holders", currency: "VND", language: "Vietnamese, English", timezone: "ICT (UTC+7)", flightTime: "~5 hrs from Delhi" } },
  { slug: "australia", name: "Australia", country: "Australia", region: "Oceania", hero: img("photo-1506973035872-a4ec16b8e8d9"), thumb: img("photo-1523482580672-f109ba8cb9be"), shortSummary: "Harbour cities, golden coasts and the Great Barrier Reef.", overview: "From Sydney's harbour to Melbourne's laneways and the Great Ocean Road, Australia serves world-class cities, beaches and wildlife.", bestTime: "September to November", categories: ["luxury", "family", "adventure"], travelInfo: { visa: "Visitor visa (subclass 600)", currency: "AUD", language: "English", timezone: "AEST (UTC+10)", flightTime: "~12 hrs from Delhi" } },
  { slug: "kashmir", name: "Kashmir", country: "India", region: "India", hero: img("photo-1566837497312-7be4a47b0f3f"), thumb: img("photo-1595815771614-ade9d652a65d"), shortSummary: "Alpine meadows, shikara rides and snow-clad valleys.", overview: "Paradise on earth — Dal Lake shikaras, the meadows of Gulmarg and Pahalgam, and Mughal gardens in a serene Himalayan valley.", bestTime: "March to October", categories: ["honeymoon", "family", "adventure"], travelInfo: { visa: "Domestic — no visa", currency: "INR", language: "Kashmiri, Urdu, Hindi", timezone: "IST (UTC+5:30)", flightTime: "~1.5 hrs from Delhi" } },
  { slug: "andaman", name: "Andaman", country: "India", region: "India", hero: img("photo-1589979481223-deb893043163"), thumb: img("photo-1544550581-5f7ceaf7f992"), shortSummary: "Turquoise seas, coral reefs and white-sand islands.", overview: "India's own island paradise — Radhanagar Beach, coral snorkelling off Havelock and Neil, and a poignant colonial history in Port Blair.", bestTime: "October to May", categories: ["beach", "honeymoon", "family"], travelInfo: { visa: "Domestic — no visa", currency: "INR", language: "Hindi, English, Bengali", timezone: "IST (UTC+5:30)", flightTime: "~2.5 hrs from Chennai" } },
  { slug: "rajasthan", name: "Rajasthan", country: "India", region: "India", hero: img("photo-1477587458883-47145ed94245"), thumb: img("photo-1524492412937-b28074a5d7da"), shortSummary: "Majestic forts, palace hotels and desert colour.", overview: "The land of kings — Amber Fort, the lakes of Udaipur, Jaisalmer's golden dunes and heritage palace stays steeped in royalty.", bestTime: "October to March", categories: ["luxury", "family", "city-break"], travelInfo: { visa: "Domestic — no visa", currency: "INR", language: "Hindi, Rajasthani", timezone: "IST (UTC+5:30)", flightTime: "~1.5 hrs from Delhi" } },
  { slug: "kerala", name: "Kerala", country: "India", region: "India", hero: img("photo-1602216056096-3b40cc0c9944"), thumb: img("photo-1590050752117-238cb0fb12b1"), shortSummary: "Backwater houseboats, tea hills and Ayurveda.", overview: "God's Own Country — Alleppey houseboats, the tea gardens of Munnar, and restorative Ayurveda along a lush tropical coast.", bestTime: "September to March", categories: ["honeymoon", "family", "adventure"], travelInfo: { visa: "Domestic — no visa", currency: "INR", language: "Malayalam, English", timezone: "IST (UTC+5:30)", flightTime: "~3 hrs from Delhi" } },
  { slug: "goa", name: "Goa", country: "India", region: "India", hero: img("photo-1512343879784-a960bf40e7f2"), thumb: img("photo-1583531352515-8884af319dc1"), shortSummary: "Golden beaches, Portuguese charm and nightlife.", overview: "India's favourite beach break — sun-soaked north-Goa shacks, quieter southern sands, Latin-quarter cafés and buzzing nightlife.", bestTime: "November to February", categories: ["beach", "family", "adventure"], travelInfo: { visa: "Domestic — no visa", currency: "INR", language: "Konkani, English, Hindi", timezone: "IST (UTC+5:30)", flightTime: "~2.5 hrs from Delhi" } },
];

type Pool = { city: string; season: string; visa: string; activities: { title: string; desc: string }[] };
const POOLS: Record<string, Pool> = {
  dubai: { city: "Dubai", season: "Oct–Mar peak · Apr–Sep value", visa: "UAE tourist visa (add-on available)", activities: [
    { title: "Dubai city tour", desc: "Jumeirah Mosque, Dubai Museum and the Gold & Spice Souks." },
    { title: "At the Top — Burj Khalifa", desc: "Sunset views from the observation deck." },
    { title: "Desert safari with dune bashing", desc: "Camel rides, sandboarding, cultural show and BBQ dinner." },
    { title: "Dhow dinner cruise", desc: "Dinner cruise along Dubai Marina or the Creek." },
    { title: "Abu Dhabi day trip", desc: "Sheikh Zayed Grand Mosque and the Corniche." },
    { title: "Dubai Mall & Fountain", desc: "Aquarium, shopping and the Dubai Fountain show." },
  ] },
  bali: { city: "Bali", season: "Apr–Oct dry season", visa: "Visa on arrival", activities: [
    { title: "Ubud rice terraces & swing", desc: "Tegallalang terraces and the famous Bali swing." },
    { title: "Sacred Monkey Forest & market", desc: "Ubud's temple sanctuary and art market." },
    { title: "Uluwatu Temple & Kecak dance", desc: "Cliffside sunset temple with fire dance." },
    { title: "Nusa Penida day trip", desc: "Kelingking Beach and Broken Beach by speedboat." },
    { title: "Waterfall trek", desc: "Sekumpul or Tibumana waterfalls." },
    { title: "Seminyak beach clubs", desc: "Sunset and leisure on the west coast." },
  ] },
  maldives: { city: "Malé", season: "Nov–Apr dry season", visa: "Free visa on arrival", activities: [
    { title: "House-reef snorkelling", desc: "Snorkel the resort's coral reef." },
    { title: "Sunset dolphin cruise", desc: "Spot dolphins as the sun sets over the atoll." },
    { title: "Sandbank picnic", desc: "Private lunch on a secluded sandbank." },
    { title: "Sunset fishing", desc: "Traditional Maldivian line fishing." },
    { title: "Spa & lagoon leisure", desc: "Overwater spa and time in the lagoon." },
  ] },
  thailand: { city: "Bangkok", season: "Nov–Mar cool season", visa: "Visa on arrival / e-visa", activities: [
    { title: "Phi Phi Islands speedboat tour", desc: "Maya Bay and snorkelling at Pileh Lagoon." },
    { title: "James Bond Island & sea caves", desc: "Phang Nga Bay by canoe." },
    { title: "Krabi four-island tour", desc: "Longtail hopping around Krabi's islets." },
    { title: "Grand Palace & Wat Pho", desc: "Bangkok's royal temples." },
    { title: "Coral Island (Koh Larn)", desc: "Beach and water sports off Pattaya." },
    { title: "Floating market & cabaret", desc: "Damnoen Saduak market and an evening show." },
  ] },
  singapore: { city: "Singapore", season: "Year-round", visa: "e-visa required", activities: [
    { title: "Gardens by the Bay", desc: "Cloud Forest, Flower Dome and the light show." },
    { title: "City tour", desc: "Merlion Park, Chinatown and Little India." },
    { title: "Sentosa & Universal Studios", desc: "Theme-park day on Sentosa island." },
    { title: "Night Safari", desc: "The world's first nocturnal wildlife park." },
    { title: "Kuala Lumpur city tour", desc: "Petronas Towers and Batu Caves (twin-city trips)." },
    { title: "Genting Highlands", desc: "Cable car and hilltop leisure near KL." },
  ] },
  europe: { city: "Paris", season: "May–Sep", visa: "Schengen visa (assistance provided)", activities: [
    { title: "Eiffel Tower & Seine cruise", desc: "Paris highlights and a river cruise." },
    { title: "Mount Titlis", desc: "Cable car to the glacier near Lucerne." },
    { title: "Jungfraujoch — Top of Europe", desc: "Cogwheel train to the high alpine station." },
    { title: "Colosseum & Vatican City", desc: "Ancient Rome and St Peter's." },
    { title: "Venice & gondola", desc: "St Mark's Square and a gondola glide." },
    { title: "Santorini caldera & Athens Acropolis", desc: "Greek island and classical highlights." },
  ] },
  vietnam: { city: "Hanoi", season: "Feb–Apr", visa: "e-visa", activities: [
    { title: "Halong Bay cruise", desc: "Overnight or day cruise among limestone karsts." },
    { title: "Hanoi Old Quarter", desc: "Hoan Kiem Lake and the bustling old town." },
    { title: "Hoi An ancient town", desc: "Lantern-lit streets and the Japanese Bridge." },
    { title: "Da Nang & Marble Mountains", desc: "My Khe Beach and cave temples." },
    { title: "Ba Na Hills & Golden Bridge", desc: "Cable car to the iconic hand-held bridge." },
    { title: "Cu Chi Tunnels", desc: "Historic tunnel network near Ho Chi Minh City." },
  ] },
  australia: { city: "Sydney", season: "Sep–Nov / Mar–May", visa: "Visitor visa (subclass 600)", activities: [
    { title: "Sydney city & Bondi", desc: "Opera House, Harbour Bridge and Bondi Beach." },
    { title: "Blue Mountains day trip", desc: "Three Sisters and Scenic World." },
    { title: "Great Ocean Road", desc: "Twelve Apostles coastal drive from Melbourne." },
    { title: "Melbourne city & Phillip Island", desc: "Laneways and the penguin parade." },
    { title: "Great Barrier Reef cruise", desc: "Snorkel the reef from Cairns." },
    { title: "Gold Coast theme parks", desc: "Beaches and theme-park fun." },
  ] },
  kashmir: { city: "Srinagar", season: "Mar–Oct", visa: "Domestic — no visa", activities: [
    { title: "Dal Lake shikara ride", desc: "Glide past floating gardens and houseboats." },
    { title: "Gulmarg & Gondola", desc: "Meadow of flowers and the high cable car." },
    { title: "Pahalgam valley", desc: "Betaab Valley and Aru meadows." },
    { title: "Mughal gardens", desc: "Nishat, Shalimar and Chashme Shahi." },
    { title: "Sonamarg excursion", desc: "The meadow of gold and Thajiwas glacier." },
  ] },
  andaman: { city: "Port Blair", season: "Oct–May", visa: "Domestic — no visa", activities: [
    { title: "Radhanagar Beach, Havelock", desc: "One of Asia's finest white-sand beaches." },
    { title: "Cellular Jail & light show", desc: "Colonial history and the evening sound-and-light show." },
    { title: "Coral snorkelling, Elephant Beach", desc: "Reef snorkelling and water sports." },
    { title: "Neil Island", desc: "Natural bridge and laid-back beaches." },
    { title: "Ross & North Bay islands", desc: "Glass-bottom boat and heritage ruins." },
  ] },
  rajasthan: { city: "Jaipur", season: "Oct–Mar", visa: "Domestic — no visa", activities: [
    { title: "Amber Fort & City Palace", desc: "Jaipur's hilltop fort and royal palace." },
    { title: "Udaipur lake tour", desc: "Lake Pichola boat ride and the City Palace." },
    { title: "Jaisalmer fort & dunes", desc: "Golden fort and a desert camel safari." },
    { title: "Jodhpur Mehrangarh", desc: "The mighty fort over the blue city." },
    { title: "Pushkar & local bazaars", desc: "Sacred lake and colourful markets." },
  ] },
  kerala: { city: "Kochi", season: "Sep–Mar", visa: "Domestic — no visa", activities: [
    { title: "Alleppey houseboat", desc: "Overnight cruise through the backwaters." },
    { title: "Munnar tea gardens", desc: "Rolling tea estates and viewpoints." },
    { title: "Thekkady spice & wildlife", desc: "Periyar sanctuary and spice plantations." },
    { title: "Kochi heritage walk", desc: "Fort Kochi, Chinese fishing nets and cafés." },
    { title: "Ayurveda spa session", desc: "Traditional rejuvenation therapy." },
  ] },
  goa: { city: "Goa", season: "Nov–Feb", visa: "Domestic — no visa", activities: [
    { title: "North Goa beaches", desc: "Baga, Calangute and Anjuna shacks." },
    { title: "Old Goa churches", desc: "Basilica of Bom Jesus and Se Cathedral." },
    { title: "Dudhsagar Falls jeep safari", desc: "Four-tier waterfall in the Ghats." },
    { title: "Sunset river cruise", desc: "Mandovi cruise with music." },
    { title: "South Goa leisure", desc: "Quieter Palolem and Colva sands." },
  ] },
};

type PkgSpec = { code: string; name: string; dest: string; nights: number; category: string; bestFor: string; featured?: boolean };
const PACKAGES: PkgSpec[] = [
  // Dubai / UAE — 8
  { code: "ETX-DXB-001", name: "Dubai First Escape", dest: "dubai", nights: 4, category: "FIRST_ESCAPE", bestFor: "First-time travellers, short breaks", featured: true },
  { code: "ETX-DXB-002", name: "Dubai City & Desert", dest: "dubai", nights: 5, category: "SIGNATURE", bestFor: "Couples & friends" },
  { code: "ETX-DXB-003", name: "Dubai Signature", dest: "dubai", nights: 5, category: "SIGNATURE", bestFor: "All-round sightseeing", featured: true },
  { code: "ETX-DXB-004", name: "Dubai Family Discovery", dest: "dubai", nights: 5, category: "FAMILY", bestFor: "Families with kids" },
  { code: "ETX-DXB-005", name: "Dubai Honeymoon Retreat", dest: "dubai", nights: 5, category: "HONEYMOON", bestFor: "Honeymooners" },
  { code: "ETX-DXB-006", name: "Dubai + Abu Dhabi Highlights", dest: "dubai", nights: 6, category: "SIGNATURE", bestFor: "Twin-city explorers" },
  { code: "ETX-DXB-007", name: "Dubai Premium Week", dest: "dubai", nights: 6, category: "PREMIUM", bestFor: "Premium travellers" },
  { code: "ETX-DXB-008", name: "Ultimate UAE Escape", dest: "dubai", nights: 7, category: "PREMIUM", bestFor: "Longer luxury holidays", featured: true },
  // Bali — 6
  { code: "ETX-BAL-009", name: "Bali First Escape", dest: "bali", nights: 4, category: "FIRST_ESCAPE", bestFor: "First-timers" },
  { code: "ETX-BAL-010", name: "Bali Beach & Culture", dest: "bali", nights: 5, category: "SIGNATURE", bestFor: "Culture & beaches" },
  { code: "ETX-BAL-011", name: "Bali Honeymoon Retreat", dest: "bali", nights: 5, category: "HONEYMOON", bestFor: "Honeymooners", featured: true },
  { code: "ETX-BAL-012", name: "Bali Family Discovery", dest: "bali", nights: 6, category: "FAMILY", bestFor: "Families" },
  { code: "ETX-BAL-013", name: "Bali + Nusa Penida", dest: "bali", nights: 6, category: "ADVENTURE", bestFor: "Island-hoppers" },
  { code: "ETX-BAL-014", name: "Bali Luxury Villa Escape", dest: "bali", nights: 7, category: "LUXURY", bestFor: "Luxury seekers" },
  // Thailand — 6
  { code: "ETX-THA-015", name: "Bangkok & Pattaya Highlights", dest: "thailand", nights: 5, category: "FIRST_ESCAPE", bestFor: "First-timers & value" },
  { code: "ETX-THA-016", name: "Bangkok & Pattaya Signature", dest: "thailand", nights: 6, category: "SIGNATURE", bestFor: "Sightseeing & fun" },
  { code: "ETX-THA-017", name: "Phuket Beach Escape", dest: "thailand", nights: 5, category: "BEACH", bestFor: "Beach lovers" },
  { code: "ETX-THA-018", name: "Krabi Escape", dest: "thailand", nights: 5, category: "BEACH", bestFor: "Quieter beaches" },
  { code: "ETX-THA-019", name: "Krabi + Phuket Discovery", dest: "thailand", nights: 6, category: "SIGNATURE", bestFor: "Twin-beach explorers", featured: true },
  { code: "ETX-THA-020", name: "Thailand Honeymoon Escape", dest: "thailand", nights: 6, category: "HONEYMOON", bestFor: "Honeymooners" },
  // Maldives — 5
  { code: "ETX-MLE-021", name: "Maldives Beach Escape", dest: "maldives", nights: 4, category: "BEACH", bestFor: "Short island breaks" },
  { code: "ETX-MLE-022", name: "Maldives Couple Retreat", dest: "maldives", nights: 4, category: "HONEYMOON", bestFor: "Couples", featured: true },
  { code: "ETX-MLE-023", name: "Maldives Premium Water Villa", dest: "maldives", nights: 5, category: "PREMIUM", bestFor: "Water-villa stays" },
  { code: "ETX-MLE-024", name: "Maldives Family Island Holiday", dest: "maldives", nights: 5, category: "FAMILY", bestFor: "Families" },
  { code: "ETX-MLE-025", name: "Maldives Luxury Escape", dest: "maldives", nights: 6, category: "LUXURY", bestFor: "Luxury seekers" },
  // Singapore / Malaysia — 5
  { code: "ETX-SIN-026", name: "Singapore First Escape", dest: "singapore", nights: 4, category: "FIRST_ESCAPE", bestFor: "First-timers" },
  { code: "ETX-SIN-027", name: "Singapore Family Explorer", dest: "singapore", nights: 5, category: "FAMILY", bestFor: "Families", featured: true },
  { code: "ETX-SIN-028", name: "Singapore Premium Escape", dest: "singapore", nights: 5, category: "PREMIUM", bestFor: "Premium city break" },
  { code: "ETX-SIN-029", name: "Singapore + Kuala Lumpur", dest: "singapore", nights: 6, category: "SIGNATURE", bestFor: "Twin-country trips" },
  { code: "ETX-SIN-030", name: "Singapore + Malaysia Highlights", dest: "singapore", nights: 7, category: "SIGNATURE", bestFor: "Extended twin-country" },
  // Vietnam — 5
  { code: "ETX-VNM-031", name: "Vietnam First Escape", dest: "vietnam", nights: 5, category: "FIRST_ESCAPE", bestFor: "First-timers" },
  { code: "ETX-VNM-032", name: "Hanoi + Halong Bay", dest: "vietnam", nights: 5, category: "SIGNATURE", bestFor: "Bay cruises" },
  { code: "ETX-VNM-033", name: "Da Nang + Hoi An", dest: "vietnam", nights: 5, category: "BEACH", bestFor: "Beach & heritage" },
  { code: "ETX-VNM-034", name: "Vietnam Couple Discovery", dest: "vietnam", nights: 6, category: "HONEYMOON", bestFor: "Couples", featured: true },
  { code: "ETX-VNM-035", name: "Vietnam Grand Discovery", dest: "vietnam", nights: 8, category: "SIGNATURE", bestFor: "Full-country tours" },
  // Europe — 6
  { code: "ETX-EUR-036", name: "Swiss First Journey", dest: "europe", nights: 6, category: "SIGNATURE", bestFor: "Alpine first-timers" },
  { code: "ETX-EUR-037", name: "Swiss Alps & Cities", dest: "europe", nights: 8, category: "SIGNATURE", bestFor: "Switzerland in depth" },
  { code: "ETX-EUR-038", name: "Paris + Switzerland", dest: "europe", nights: 8, category: "SIGNATURE", bestFor: "Two-country classic", featured: true },
  { code: "ETX-EUR-039", name: "Italy Highlights", dest: "europe", nights: 7, category: "SIGNATURE", bestFor: "Italy explorers" },
  { code: "ETX-EUR-040", name: "Greece Island Escape", dest: "europe", nights: 6, category: "HONEYMOON", bestFor: "Island honeymoons" },
  { code: "ETX-EUR-041", name: "European Grand Tour", dest: "europe", nights: 10, category: "PREMIUM", bestFor: "Multi-country grand tours" },
  // Australia — 4
  { code: "ETX-AUS-042", name: "Sydney First Escape", dest: "australia", nights: 5, category: "FIRST_ESCAPE", bestFor: "First-timers" },
  { code: "ETX-AUS-043", name: "Sydney + Melbourne Highlights", dest: "australia", nights: 7, category: "SIGNATURE", bestFor: "Twin-city travellers" },
  { code: "ETX-AUS-044", name: "Australia East Coast Discovery", dest: "australia", nights: 9, category: "SIGNATURE", bestFor: "Coast explorers" },
  { code: "ETX-AUS-045", name: "Australia Grand Escape", dest: "australia", nights: 10, category: "PREMIUM", bestFor: "Grand holidays" },
  // India / Premium — 5
  { code: "ETX-IND-046", name: "Kashmir Signature Escape", dest: "kashmir", nights: 6, category: "SIGNATURE", bestFor: "Valleys & meadows", featured: true },
  { code: "ETX-IND-047", name: "Andaman Premium Retreat", dest: "andaman", nights: 5, category: "PREMIUM", bestFor: "Island premium" },
  { code: "ETX-IND-048", name: "Rajasthan Heritage Journey", dest: "rajasthan", nights: 6, category: "LUXURY", bestFor: "Heritage & palaces" },
  { code: "ETX-IND-049", name: "Kerala Backwaters & Hills", dest: "kerala", nights: 6, category: "HONEYMOON", bestFor: "Backwaters & tea hills" },
  { code: "ETX-IND-050", name: "Goa Beach Escape", dest: "goa", nights: 4, category: "BEACH", bestFor: "Beaches & nightlife" },
];

const CATEGORY_TO_THEME: Record<string, string> = {
  FIRST_ESCAPE: "GROUP", SIGNATURE: "GROUP", HONEYMOON: "HONEYMOON", FAMILY: "FAMILY", LUXURY: "LUXURY", PREMIUM: "LUXURY", BEACH: "BEACH", ADVENTURE: "ADVENTURE",
};

function genDays(pool: Pool, nights: number) {
  const total = nights + 1;
  const days: { title: string; items: { timeslot: string; kind: string; title: string; description?: string }[] }[] = [];
  days.push({ title: `Arrival in ${pool.city}`, items: [
    { timeslot: "AFTERNOON", kind: "FLIGHT", title: `Arrive in ${pool.city}` },
    { timeslot: "AFTERNOON", kind: "TRANSFER", title: "Transfer to your hotel" },
    { timeslot: "EVENING", kind: "FREE_TIME", title: "Check-in and evening at leisure" },
  ] });
  for (let d = 2; d < total; d++) {
    const a = pool.activities[(d - 2) % pool.activities.length];
    const a2 = pool.activities[(d - 1) % pool.activities.length];
    days.push({ title: a.title, items: [
      { timeslot: "MORNING", kind: "ACTIVITY", title: a.title, description: a.desc },
      { timeslot: "AFTERNOON", kind: "ACTIVITY", title: a2.title, description: a2.desc },
      { timeslot: "EVENING", kind: "FREE_TIME", title: "Evening free for dining and leisure" },
    ] });
  }
  days.push({ title: "Departure", items: [
    { timeslot: "MORNING", kind: "TRANSFER", title: "Transfer to the airport" },
    { timeslot: "MORNING", kind: "FLIGHT", title: "Return flight home" },
  ] });
  return days;
}

function genOptions(pool: Pool) {
  const acts = pool.activities.slice(0, 3);
  return [
    { category: "HOTEL", groupKey: "hotel", label: "Good — 4★ central hotel", description: "Comfortable, well-located 4-star stay.", meta: { stars: 4, tier: "GOOD" }, priceDelta: 0, isDefault: true },
    { category: "HOTEL", groupKey: "hotel", label: "Better — premium 4★", description: "Upgraded 4-star with better location/rooms.", meta: { stars: 4, tier: "BETTER" }, priceDelta: 6000 },
    { category: "HOTEL", groupKey: "hotel", label: "Premium — 5★ hotel", description: "Top-tier 5-star property.", meta: { stars: 5, tier: "PREMIUM" }, priceDelta: 15000 },
    { category: "FLIGHT", groupKey: "flight", label: "Economy return flights", description: "Return economy airfare.", meta: { cabin: "economy" }, priceDelta: 0, isDefault: true },
    { category: "FLIGHT", groupKey: "flight", label: "Premium economy upgrade", description: "Extra legroom and priority boarding.", meta: { cabin: "premium_economy" }, priceDelta: 14000 },
    { category: "TRANSFER", groupKey: "transfer", label: "Shared airport transfers", description: "Comfortable shared shuttle.", meta: { private: false }, priceDelta: 0, isDefault: true },
    { category: "TRANSFER", groupKey: "transfer", label: "Private airport transfers", description: "Private car, door to door.", meta: { private: true }, priceDelta: 3000 },
    { category: "MEAL", groupKey: "meal", label: "Breakfast included", description: "Daily breakfast.", priceDelta: 0, isDefault: true },
    { category: "MEAL", groupKey: "meal", label: "Half board (breakfast + dinner)", description: "Add dinner daily.", priceDelta: 6500 },
    ...acts.map((a, i) => ({ category: "ACTIVITY", groupKey: `activity-${i}`, label: a.title, description: a.desc, priceDelta: 2500 })),
    { category: "ADDON", groupKey: "addon-insurance", label: "Travel insurance", priceDelta: 1200 },
    { category: "ADDON", groupKey: "addon-visa", label: "Visa assistance", priceDelta: 2500 },
  ];
}

function departures(count = 4) {
  const out: { date: Date; priceDelta: number }[] = [];
  const now = new Date();
  for (let i = 1; i <= count; i++) out.push({ date: new Date(now.getFullYear(), now.getMonth() + i, 12), priceDelta: 0 });
  return out;
}

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
  await db.rolePermission.deleteMany(); await db.adminUser.deleteMany(); await db.permission.deleteMany(); await db.role.deleteMany();
  await db.businessSetting.deleteMany(); await db.auditLog.deleteMany();
}

async function main() {
  console.log("🌱 Reset…");
  await reset();

  const catId = new Map<string, string>();
  for (const [i, c] of CATEGORIES.entries()) catId.set(c.slug, (await db.destinationCategory.create({ data: { name: c.name, slug: c.slug, sortOrder: i } })).id);

  const destId = new Map<string, string>();
  const destName = new Map<string, string>();
  for (const [i, d] of DESTINATIONS.entries()) {
    const created = await db.destination.create({ data: {
      slug: d.slug, name: d.name, country: d.country, region: d.region, heroImage: d.hero, thumbnail: d.thumb,
      shortSummary: d.shortSummary, overview: d.overview, bestTimeToVisit: d.bestTime, isPopular: !!d.popular,
      sortOrder: i, travelInfo: d.travelInfo, categories: { create: d.categories.map((s) => ({ categoryId: catId.get(s)! })) },
    } });
    destId.set(d.slug, created.id); destName.set(d.slug, d.name);
  }

  console.log("🌱 50 packages…");
  for (const p of PACKAGES) {
    const pool = POOLS[p.dest];
    const dName = destName.get(p.dest)!;
    const highlights = pool.activities.slice(0, 4).map((a) => a.title);
    const pkg = await db.package.create({ data: {
      code: p.code, slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      name: p.name, theme: CATEGORY_TO_THEME[p.category] ?? "GROUP", destinationId: destId.get(p.dest)!,
      status: "PUBLISHED", isFeatured: !!p.featured,
    } });

    const version = await db.packageVersion.create({ data: {
      packageId: pkg.id, versionNumber: 1, isPublished: true, name: p.name,
      summary: `${p.nights}N / ${p.nights + 1}D ${dName} holiday — ${p.bestFor.toLowerCase()}.`,
      overview: `A complete ${p.nights + 1}-day ${dName} holiday covering the destination's must-see highlights with comfortable hotels, transfers and curated experiences. Fully customizable — upgrade hotels, add activities and choose your dates.`,
      durationDays: p.nights + 1, durationNights: p.nights, currency: "INR",
      basePrice: 0, perPersonPricing: true,
      pricingStatus: "PRICE_REVIEW_REQUIRED", availabilityStatus: "ON_REQUEST", benchmark: undefined, targetPrice: null,
      category: p.category, bestFor: p.bestFor,
      departureCities: ["Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Kolkata", "Chennai"],
      travelWindows: pool.season, roomCategory: "Deluxe Room", mealPlan: "Breakfast",
      flightSector: `India ⇄ ${pool.city}`, baggage: "23kg check-in + 7kg cabin", visaInfo: pool.visa,
      insuranceInfo: "Optional travel insurance available as an add-on",
      seoTitle: `${p.name} — ${p.nights}N ${dName} Holiday Package | ExpertzTrip`,
      seoDescription: `Book the ${p.name}: a ${p.nights}N/${p.nights + 1}D ${dName} holiday with hotels, flights, transfers and experiences. Customize and price on request with ExpertzTrip.`,
      highlights, inclusions: [`${p.nights} nights hotel accommodation`, "Daily breakfast", "Return economy flights", "Airport transfers", "Sightseeing & tours as per itinerary"],
      exclusions: ["Visa fees unless specified", "Lunches & dinners unless specified", "Personal expenses, tips & optional tours", "Anything not mentioned in inclusions"],
      cancellationPolicy: "Free cancellation up to 21 days before departure. 25% within 21–8 days. 50% within 7–3 days. No refund within 48 hours of departure. Package-specific supplier terms may apply.",
      importantInfo: "Per person on twin-sharing. Final price is confirmed on request after a verified benchmark check. Valid passport with 6 months validity required for international travel.",
      images: { create: [
        { url: DESTINATIONS.find((d) => d.slug === p.dest)!.hero, isCover: true, sortOrder: 0, alt: p.name },
        { url: DESTINATIONS.find((d) => d.slug === p.dest)!.thumb, isCover: false, sortOrder: 1, alt: `${dName} 2` },
      ] },
      days: { create: genDays(pool, p.nights).map((day, di) => ({ dayNumber: di + 1, title: day.title, items: { create: day.items.map((it, ii) => ({ timeslot: it.timeslot, kind: it.kind, title: it.title, description: it.description, sortOrder: ii })) } })) },
      options: { create: genOptions(pool).map((o, oi) => ({ category: o.category, groupKey: o.groupKey, label: o.label, description: o.description, meta: o.meta, priceDelta: o.priceDelta, perPerson: true, isDefault: !!o.isDefault, sortOrder: oi })) },
      departures: { create: departures().map((d) => ({ date: d.date, priceDelta: d.priceDelta })) },
    } });
    await db.package.update({ where: { id: pkg.id }, data: { currentVersionId: version.id } });
  }

  console.log("🌱 Offers, coupons, FAQs, guides…");
  await db.offer.createMany({ data: [
    { slug: "monsoon-sale", title: "Monsoon Escape Sale", description: "Seasonal savings on select beach holidays.", badge: "Limited time", image: img("photo-1507525428034-b723cf961d3e"), ctaHref: "/packages", sortOrder: 0 },
    { slug: "honeymoon-special", title: "Honeymoon Special", description: "Complimentary romantic dinner on honeymoon packages.", badge: "Couples", image: img("photo-1522673607200-164d1b6ce486"), ctaHref: "/packages?theme=HONEYMOON", sortOrder: 1 },
    { slug: "early-bird", title: "Early Bird Offer", description: "Book 60 days ahead and save more.", badge: "Plan ahead", image: img("photo-1436491865332-7a61a109cc05"), ctaHref: "/packages", sortOrder: 2 },
  ] });
  await db.coupon.createMany({ data: [
    { code: "WELCOME5", description: "5% off your first booking", kind: "PERCENT", value: 5, maxDiscount: 6000, isActive: true },
    { code: "FLAT4000", description: "Flat ₹4,000 off on bookings above ₹80,000", kind: "FLAT", value: 4000, minAmount: 80000, isActive: true },
  ] });
  await db.faq.createMany({ data: [
    { scope: "GLOBAL", question: "How do I book a holiday with ExpertzTrip?", answer: "Pick a package, customize it, verify your mobile with an OTP, add traveller details and pay securely via Razorpay.", sortOrder: 0 },
    { scope: "GLOBAL", question: "Why do some packages say ‘Price on request’?", answer: "We price every package against a verified market benchmark before publishing a live rate. Until that check is complete, the package shows Price on request and our team confirms the final price for you.", sortOrder: 1 },
    { scope: "GLOBAL", question: "Can I customize a package?", answer: "Yes — upgrade hotels, choose private transfers, add activities and pick dates. Your price is always calculated and confirmed on the server.", sortOrder: 2 },
  ] });
  const guideDest = ["dubai", "bali", "maldives", "thailand", "europe"];
  await db.travelGuide.createMany({ data: guideDest.map((s) => ({ slug: `${s}-travel-guide`, destinationId: destId.get(s)!, title: `${destName.get(s)} travel guide: visas, best time & tips`, excerpt: `Everything you need to plan a great ${destName.get(s)} trip.`, coverImage: DESTINATIONS.find((d) => d.slug === s)!.hero, body: `Practical tips for planning your ${destName.get(s)} holiday — visas, the best time to visit, getting around and how to pace your itinerary.` })) });

  console.log("🌱 RBAC, admin, suppliers, settings…");
  const PERMISSIONS = ["dashboard.view", "booking.view", "booking.update", "booking.cancel", "booking.refund", "package.view", "package.create", "package.edit", "package.publish", "package.archive", "destination.manage", "supplier.manage", "customer.view", "payment.view", "refund.manage", "offer.manage", "coupon.manage", "review.moderate", "content.manage", "support.manage", "user.manage", "role.manage", "settings.manage", "audit.view", "report.view"];
  const permId = new Map<string, string>();
  for (const key of PERMISSIONS) permId.set(key, (await db.permission.create({ data: { key, name: key.replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) } })).id);
  const rolePerms: Record<string, string[]> = {
    SUPER_ADMIN: PERMISSIONS,
    OPERATIONS: ["dashboard.view", "booking.view", "booking.update", "booking.cancel", "supplier.manage", "customer.view", "support.manage", "report.view"],
    PACKAGE_MANAGER: ["dashboard.view", "package.view", "package.create", "package.edit", "package.publish", "package.archive", "destination.manage"],
    FINANCE: ["dashboard.view", "payment.view", "refund.manage", "booking.refund", "report.view"],
    SUPPORT: ["dashboard.view", "booking.view", "customer.view", "support.manage"],
    CONTENT_MANAGER: ["dashboard.view", "content.manage", "offer.manage", "coupon.manage", "review.moderate", "destination.manage"],
    ANALYST: ["dashboard.view", "report.view", "audit.view"],
  };
  const roleId = new Map<string, string>();
  for (const key of ADMIN_ROLES) roleId.set(key, (await db.role.create({ data: { key, name: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), permissions: { create: (rolePerms[key] ?? []).map((pk) => ({ permissionId: permId.get(pk)! })) } } })).id);
  await db.adminUser.create({ data: { email: "admin@expertztrip.com", fullName: "ExpertzTrip Admin", passwordHash: hashPassword("ChangeMe#2026"), roleId: roleId.get("SUPER_ADMIN")! } });
  await db.supplier.createMany({ data: [
    { name: "SkyLink Aviation", type: "FLIGHT", status: "ACTIVE", credentialRef: "secret://suppliers/skylink" },
    { name: "StayWell Hotels DMC", type: "HOTEL", status: "ACTIVE", credentialRef: "secret://suppliers/staywell" },
    { name: "DesertDrive Transfers", type: "TRANSFER", status: "ACTIVE", credentialRef: "secret://suppliers/desertdrive" },
  ] });
  await db.businessSetting.createMany({ data: [
    { key: "brand", value: { name: "ExpertzTrip", supportEmail: "support@expertztrip.com", supportPhone: "+91 90000 00000" } },
    { key: "checkout", value: { taxRatePct: 5, currency: "INR" } },
    { key: "pricing", value: { rule: "target = verified benchmark + ₹550", policy: "PRICE_REVIEW_REQUIRED until a verified benchmark is set" } },
  ] });

  console.log("✅ Seed complete:", { destinations: await db.destination.count(), packages: await db.package.count(), priceReview: await db.packageVersion.count({ where: { pricingStatus: "PRICE_REVIEW_REQUIRED" } }), days: await db.packageDay.count(), options: await db.packageOption.count() });
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
