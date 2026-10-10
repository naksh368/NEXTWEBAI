/**
 * Reads free-form package details (a supplier's message, a WhatsApp forward,
 * a typed itinerary) and works out the package's shape: hotel tier, nights,
 * route, price, group size, inclusions and day-by-day plan.
 *
 * Pure and deterministic, so it works without an AI key and is unit-tested.
 * The AI reader in the admin builds on top of this and may only fill gaps or
 * refine wording, never invent a price.
 */

export type Tier = "BUDGET" | "STANDARD" | "TWO_STAR" | "THREE_STAR" | "FOUR_STAR";

export const TIERS: { theme: Tier; label: string; hotelCategory: string; referencePrice: number }[] = [
  { theme: "BUDGET", label: "Budget", hotelCategory: "Budget hotels & guesthouses", referencePrice: 15600 },
  { theme: "STANDARD", label: "Standard", hotelCategory: "Standard hotels", referencePrice: 17400 },
  { theme: "TWO_STAR", label: "2 Star", hotelCategory: "2-star hotels", referencePrice: 20600 },
  { theme: "THREE_STAR", label: "3 Star", hotelCategory: "3-star hotels & resorts", referencePrice: 22600 },
  { theme: "FOUR_STAR", label: "4 Star", hotelCategory: "4-star resorts", referencePrice: 32800 },
];

export const tierOf = (theme: string | null | undefined) => TIERS.find((t) => t.theme === theme) ?? null;

/** The name a read package gets until the admin renames it. */
export const autoName = (theme: Tier, nights: number) => `Andaman ${nights}N/${nights + 1}D ${tierOf(theme)!.label} Package`;
export const isAutoName = (name: string) => /^Andaman \d+N\/\d+D .+ Package$/.test(name);

/** Andaman places we recognise, with the spellings people actually use. */
const PLACES: { name: string; pattern: RegExp }[] = [
  { name: "Port Blair", pattern: /port\s*blair|sri\s*vijaya\s*puram/i },
  { name: "Havelock Island", pattern: /havelock|swaraj\s*dweep/i },
  { name: "Neil Island", pattern: /\bneil\b|shaheed\s*dweep/i },
  { name: "Baratang", pattern: /baratang/i },
  { name: "Rangat", pattern: /rangat/i },
  { name: "Mayabunder", pattern: /mayabunder/i },
  { name: "Diglipur", pattern: /diglipur/i },
  { name: "Long Island", pattern: /long\s*island/i },
  { name: "Little Andaman", pattern: /little\s*andaman|hut\s*bay/i },
];

/** Places we do not sell; their presence without any Andaman place is a red flag. */
const ELSEWHERE = /\b(goa|kerala|munnar|manali|shimla|kashmir|ladakh|leh|ooty|coorg|rajasthan|dubai|bali|thailand|phuket|maldives|singapore|malaysia|sri\s*lanka|nepal|bhutan|europe|vietnam)\b/i;

export type DeducedDay = { day: number; title: string; description: string };

export type DeducedPackage = {
  name: string;
  theme: Tier;
  nights: number;
  days: number;
  basePrice: number | null;
  minTravellers: number | null;
  route: { city: string; nights: number }[];
  mealPlan: string | null;
  inclusions: string[];
  exclusions: string[];
  itinerary: DeducedDay[];
  /** One line per decision, so the admin can see why each value was chosen. */
  notes: string[];
  /** Problems the admin must look at before saving. */
  warnings: string[];
};

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

export function deduceTier(text: string, price: number | null): { theme: Tier; note: string } {
  const t = text.toLowerCase();
  const rules: [RegExp, Tier, string][] = [
    [/\b(5|five)\s*[-★*]?\s*star|\bluxury\b|\bpremium\b/, "FOUR_STAR", "mentions 5-star or luxury hotels; our top tier is 4 Star"],
    [/\b(4|four)\s*[-★*]?\s*star|4\s*★/, "FOUR_STAR", 'mentions "4 star" hotels'],
    [/\b(3|three)\s*[-★*]?\s*star|3\s*★/, "THREE_STAR", 'mentions "3 star" hotels'],
    [/\b(2|two)\s*[-★*]?\s*star|2\s*★/, "TWO_STAR", 'mentions "2 star" hotels'],
    [/\bstandard\b|\bdeluxe\b/, "STANDARD", 'mentions "standard" or "deluxe" rooms'],
    [/\bbudget\b|\beconomy\b|guest\s*house|\bhomestay\b|\bcheap\b/, "BUDGET", "mentions budget hotels or guesthouses"],
  ];
  for (const [re, theme, why] of rules) if (re.test(t)) return { theme, note: `Hotel tier ${tierOf(theme)!.label}: the details ${why}.` };

  if (price) {
    // No hotel words at all: the closest of our own advertised rates decides.
    const nearest = [...TIERS].sort((a, b) => Math.abs(a.referencePrice - price) - Math.abs(b.referencePrice - price))[0];
    return { theme: nearest.theme, note: `Hotel tier ${nearest.label}: no hotel category was stated, so it is the tier closest to ₹${price.toLocaleString("en-IN")} per person.` };
  }
  return { theme: "STANDARD", note: "Hotel tier Standard: no hotel category or price was stated — please check it." };
}

export function deduceNights(text: string): { nights: number; note: string } | null {
  const nd = text.match(/(\d{1,2})\s*n(?:ights?)?\s*[\/&,-]?\s*(\d{1,2})\s*d(?:ays?)?\b/i);
  if (nd) return { nights: Number(nd[1]), note: `Duration: "${clean(nd[0])}".` };
  const n = text.match(/(\d{1,2})\s*nights?\b/i);
  if (n) return { nights: Number(n[1]), note: `Duration: "${clean(n[0])}".` };
  const d = text.match(/(\d{1,2})\s*days?\b/i);
  if (d && Number(d[1]) > 1) return { nights: Number(d[1]) - 1, note: `Duration: "${clean(d[0])}", so ${Number(d[1]) - 1} nights.` };
  return null;
}

const PER_PERSON = /^\s*(?:\/-)?\s*(?:per\s*(?:person|pax|head|adult)|\bpp\b|p\.p\.|\/\s*(?:person|pax|head))/i;

export function deducePrice(text: string): { price: number; note: string } | null {
  // An amount counts when it carries a currency ("₹22,600", "Rs. 22600/-"),
  // follows a price word ("cost 31,500"), or is followed by "per person".
  const patterns = [
    /(?:₹|rs\.?|inr)\s*([\d,]{4,9})/gi,
    /(?:cost|price|rate|tariff|fare|amount)\b[^\d\n]{0,15}([\d,]{4,9})/gi,
    /\b([\d,]{4,9})(?=\s*(?:\/-)?\s*(?:per\s*(?:person|pax|head|adult)|pp\b|\/\s*(?:person|pax|head)))/gi,
  ];
  const found = new Map<number, { value: number; perPerson: boolean; raw: string }>();
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      const end = m.index! + m[0].length;
      const value = Number(m[1].replace(/,/g, ""));
      if (value < 1000 || value > 1_000_000 || found.has(end)) continue;
      found.set(end, { value, perPerson: PER_PERSON.test(text.slice(end, end + 30)), raw: clean(m[0]) });
    }
  }
  const amounts = [...found.entries()].sort((a, b) => a[0] - b[0]).map(([, a]) => a);
  if (!amounts.length) return null;
  const perPerson = amounts.find((a) => a.perPerson);
  const pick = perPerson ?? amounts[0];
  return {
    price: pick.value,
    note: perPerson
      ? `Price ₹${pick.value.toLocaleString("en-IN")} per person, from "${pick.raw}".`
      : `Price ₹${pick.value.toLocaleString("en-IN")}, from "${pick.raw}" — it did not say "per person", so please confirm.`,
  };
}

export function deduceMinPax(text: string): number | null {
  const m =
    text.match(/min(?:imum)?\.?\s*(?:of\s*)?(\d{1,2})\s*(?:pax|persons?|people|travell?ers?|adults?|guests?)/i) ??
    text.match(/(\d{1,2})\s*pax\s*(?:min|minimum)/i);
  return m ? Number(m[1]) : null;
}

export function deduceRoute(text: string): { city: string; nights: number }[] {
  const route: { city: string; nights: number; at: number }[] = [];
  for (const place of PLACES) {
    const src = place.pattern.source;
    // "Port Blair (2N)", "Port Blair - 2 nights", "2N Port Blair", "2 nights in Havelock"
    const after = new RegExp(`(?:${src})[^\\n\\d]{0,12}(\\d{1,2})\\s*n(?:ights?)?\\b`, "i").exec(text);
    const before = new RegExp(`(\\d{1,2})\\s*n(?:ights?)?\\s*(?:at|in|@|-|:)?\\s*(?:${src})`, "i").exec(text);
    const hit = after ?? before;
    if (hit) route.push({ city: place.name, nights: Number(hit[1]), at: hit.index });
  }
  return route.sort((a, b) => a.at - b.at).map(({ city, nights }) => ({ city, nights }));
}

const HEADING = /^\s*(?:[#*•\-–]\s*)?([a-z][a-z &/]{2,30}?)\s*:?\s*$/i;

/** Bullet lines under a heading such as "Inclusions" until the next heading. */
function listUnder(lines: string[], heading: RegExp): string[] {
  const start = lines.findIndex((l) => heading.test(l));
  if (start < 0) return [];
  const out: string[] = [];
  // Items can also follow the heading on the same line: "Inclusions: A, B, C".
  const sameLine = lines[start].split(/:\s*/).slice(1).join(":").trim();
  if (sameLine) out.push(...sameLine.split(/\s*[,;]\s*/));
  for (const line of lines.slice(start + 1)) {
    const l = line.trim();
    if (!l) { if (out.length) break; continue; }
    if (/^day\s*\d/i.test(l) || (HEADING.test(l) && !/^[•*\-–✔✓]/.test(l) && out.length)) break;
    out.push(l.replace(/^[•*\-–✔✓✅❌×x]\s*/i, ""));
  }
  return out.map(clean).filter((s) => s.length > 1 && s.length < 200).slice(0, 30);
}

export function deduceItinerary(text: string): DeducedDay[] {
  const parts = text.split(/\n(?=\s*(?:[*#•\-–]\s*)?day\s*0?\d{1,2}\b)/i);
  const days: DeducedDay[] = [];
  for (const part of parts) {
    const m = part.match(/^\s*(?:[*#•\-–]\s*)?day\s*0?(\d{1,2})\s*[:.\-–)]*\s*([^\n]*)\n?([\s\S]*)$/i);
    if (!m) continue;
    const title = clean(m[2]).replace(/^[:\-–]\s*/, "") || `Day ${m[1]}`;
    days.push({ day: Number(m[1]), title: title.slice(0, 120), description: clean(m[3]).slice(0, 1000) });
  }
  return days.slice(0, 20);
}

export function deducePackage(text: string): DeducedPackage {
  const notes: string[] = [];
  const warnings: string[] = [];
  const lines = text.split(/\r?\n/);

  const price = deducePrice(text);
  if (price) notes.push(price.note);
  else warnings.push("No price was found. The draft will be marked for price review and will not show a price until you add one.");

  const tier = deduceTier(text, price?.price ?? null);
  notes.push(tier.note);

  const itinerary = deduceItinerary(text);
  const duration = deduceNights(text);
  let nights = duration?.nights ?? (itinerary.length > 1 ? itinerary.length - 1 : 0);
  if (duration) notes.push(duration.note);
  else if (nights) notes.push(`Duration: ${itinerary.length} days were listed, so ${nights} nights.`);
  if (!nights) {
    nights = 5;
    warnings.push("No duration was found, so it was set to 5 nights. Please check it.");
  }

  const route = deduceRoute(text);
  if (route.length) {
    notes.push(`Route: ${route.map((r) => `${r.city} ${r.nights}N`).join(" → ")}.`);
    const sum = route.reduce((n, r) => n + r.nights, 0);
    if (sum !== nights) warnings.push(`The route adds up to ${sum} nights but the package is ${nights} nights.`);
  }

  const minTravellers = deduceMinPax(text);
  if (minTravellers) notes.push(`Minimum group: ${minTravellers} travellers.`);

  const mentionsAndaman = /andaman/i.test(text) || PLACES.some((p) => p.pattern.test(text));
  const elsewhere = text.match(ELSEWHERE);
  if (elsewhere && !mentionsAndaman) {
    warnings.push(`These details mention ${elsewhere[0]} and no Andaman place. We only sell Andaman holidays.`);
  }

  const inclusions = listUnder(lines, /^\s*(?:[#*•\-–]\s*)?(?:package\s+)?(?:inclusions?|includes?|what'?s\s+included|cost\s+includes?)\b/i);
  const exclusions = listUnder(lines, /^\s*(?:[#*•\-–]\s*)?(?:package\s+)?(?:exclusions?|excludes?|not\s+included|what'?s\s+not\s+included|cost\s+excludes?)\b/i);
  if (inclusions.length) notes.push(`${inclusions.length} inclusions found.`);
  if (exclusions.length) notes.push(`${exclusions.length} exclusions found.`);
  if (itinerary.length) notes.push(`${itinerary.length}-day itinerary found.`);

  const mealPlan = /breakfast\s*(?:&|and|,)\s*dinner|\bmap\b/i.test(text)
    ? "Breakfast and dinner"
    : /breakfast|\bcp\b/i.test(text)
      ? "Breakfast included"
      : null;

  return {
    name: autoName(tier.theme, nights),
    theme: tier.theme,
    nights,
    days: nights + 1,
    basePrice: price?.price ?? null,
    minTravellers,
    route,
    mealPlan,
    inclusions,
    exclusions,
    itinerary,
    notes,
    warnings,
  };
}
