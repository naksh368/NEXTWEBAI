/**
 * Curated destinations for ExpertzTrip — Indian regions plus international
 * destinations that are popular with, and travel-friendly for, Indian
 * passport holders (visa-free / visa-on-arrival / e-visa, and good bilateral
 * ties). Seeded idempotently by the admin "Add popular destinations" action.
 */
export type SeedDestination = { name: string; country: string; region: string; popular?: boolean; summary?: string };

export const POPULAR_DESTINATIONS: SeedDestination[] = [
  // ── India ──
  { name: "Goa", country: "India", region: "India", popular: true, summary: "Beaches, nightlife and Portuguese charm." },
  { name: "Kerala", country: "India", region: "India", popular: true, summary: "Backwaters, hills and Ayurveda." },
  { name: "Kashmir", country: "India", region: "India", popular: true, summary: "Himalayan valleys, houseboats and gardens." },
  { name: "Himachal", country: "India", region: "India", popular: true, summary: "Manali, Shimla and mountain escapes." },
  { name: "Andaman", country: "India", region: "India", popular: true, summary: "Islands, coral reefs and pristine beaches." },
  { name: "Ladakh", country: "India", region: "India", summary: "High-altitude deserts and monasteries." },
  { name: "Rajasthan", country: "India", region: "India", summary: "Forts, palaces and desert culture." },
  { name: "Uttarakhand", country: "India", region: "India", summary: "Rishikesh, Nainital and the Himalayas." },
  { name: "Sikkim", country: "India", region: "India", summary: "Gangtok, mountains and monasteries." },
  { name: "Northeast India", country: "India", region: "India", summary: "Meghalaya, Assam and living root bridges." },
  { name: "Lakshadweep", country: "India", region: "India", summary: "Coral atolls and turquoise lagoons." },

  // ── Middle East ──
  { name: "Dubai", country: "United Arab Emirates", region: "Middle East", popular: true, summary: "Skyline, desert safaris and luxury shopping." },
  { name: "Abu Dhabi", country: "United Arab Emirates", region: "Middle East", summary: "Grand mosque, culture and theme parks." },
  { name: "Qatar", country: "Qatar", region: "Middle East", summary: "Doha, souqs and desert." },
  { name: "Oman", country: "Oman", region: "Middle East", summary: "Wadis, forts and Arabian coastline." },
  { name: "Bahrain", country: "Bahrain", region: "Middle East", summary: "Island culture and pearl heritage." },
  { name: "Jordan", country: "Jordan", region: "Middle East", summary: "Petra, Wadi Rum and the Dead Sea." },

  // ── Southeast & East Asia ──
  { name: "Thailand", country: "Thailand", region: "Asia", popular: true, summary: "Bangkok, islands and beaches." },
  { name: "Bali", country: "Indonesia", region: "Asia", popular: true, summary: "Temples, rice terraces and beaches." },
  { name: "Singapore", country: "Singapore", region: "Asia", popular: true, summary: "Gardens, skyline and family fun." },
  { name: "Malaysia", country: "Malaysia", region: "Asia", summary: "Kuala Lumpur, Langkawi and rainforests." },
  { name: "Vietnam", country: "Vietnam", region: "Asia", summary: "Ha Long Bay, old towns and cuisine." },
  { name: "Cambodia", country: "Cambodia", region: "Asia", summary: "Angkor Wat and Khmer heritage." },
  { name: "Sri Lanka", country: "Sri Lanka", region: "Asia", popular: true, summary: "Beaches, tea country and wildlife." },
  { name: "Nepal", country: "Nepal", region: "Asia", summary: "Himalayas, Kathmandu and trekking." },
  { name: "Bhutan", country: "Bhutan", region: "Asia", summary: "Monasteries and the last Himalayan kingdom." },
  { name: "Maldives", country: "Maldives", region: "Asia", popular: true, summary: "Overwater villas and coral atolls." },
  { name: "Hong Kong", country: "Hong Kong", region: "Asia", summary: "Skyline, harbour and Disneyland." },
  { name: "Japan", country: "Japan", region: "Asia", summary: "Tokyo, Kyoto, cherry blossoms and bullet trains." },
  { name: "South Korea", country: "South Korea", region: "Asia", summary: "Seoul, culture and K-experiences." },
  { name: "Uzbekistan", country: "Uzbekistan", region: "Asia", summary: "Samarkand, Silk Road cities." },
  { name: "Kazakhstan", country: "Kazakhstan", region: "Asia", summary: "Almaty, mountains and steppe." },
  { name: "Kyrgyzstan", country: "Kyrgyzstan", region: "Asia", summary: "Alpine lakes and nomadic culture." },

  // ── Caucasus & Eurasia ──
  { name: "Georgia", country: "Georgia", region: "Caucasus", summary: "Tbilisi, wine country and mountains." },
  { name: "Azerbaijan", country: "Azerbaijan", region: "Caucasus", summary: "Baku, fire temples and the Caspian." },
  { name: "Armenia", country: "Armenia", region: "Caucasus", summary: "Ancient monasteries and mountains." },
  { name: "Turkey", country: "Turkey", region: "Eurasia", popular: true, summary: "Istanbul, Cappadocia and coastlines." },

  // ── Africa & Indian Ocean ──
  { name: "Mauritius", country: "Mauritius", region: "Indian Ocean", popular: true, summary: "Beaches, lagoons and luxury resorts." },
  { name: "Seychelles", country: "Seychelles", region: "Indian Ocean", summary: "Granite islands and pristine beaches." },
  { name: "Egypt", country: "Egypt", region: "Africa", summary: "Pyramids, Nile cruises and the Red Sea." },
  { name: "Kenya", country: "Kenya", region: "Africa", summary: "Safaris and the Maasai Mara." },
  { name: "Tanzania", country: "Tanzania", region: "Africa", summary: "Serengeti, Kilimanjaro and Zanzibar." },
  { name: "South Africa", country: "South Africa", region: "Africa", summary: "Cape Town, safaris and the Garden Route." },

  // ── Europe ──
  { name: "France", country: "France", region: "Europe", summary: "Paris, Riviera and countryside." },
  { name: "Switzerland", country: "Switzerland", region: "Europe", popular: true, summary: "Alps, lakes and scenic trains." },
  { name: "Italy", country: "Italy", region: "Europe", summary: "Rome, Venice and the Amalfi Coast." },
  { name: "Greece", country: "Greece", region: "Europe", summary: "Santorini, Athens and the islands." },
  { name: "United Kingdom", country: "United Kingdom", region: "Europe", summary: "London, Scotland and heritage." },
  { name: "Spain", country: "Spain", region: "Europe", summary: "Barcelona, Madrid and beaches." },

  // ── Americas & Oceania ──
  { name: "Australia", country: "Australia", region: "Oceania", summary: "Sydney, reefs and outback." },
  { name: "New Zealand", country: "New Zealand", region: "Oceania", summary: "Fjords, adventure and landscapes." },
  { name: "United States", country: "United States", region: "Americas", summary: "Cities, national parks and coast to coast." },
];
