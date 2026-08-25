import type {
  Airline,
  Airport,
  CabinClass,
  FareOption,
  FlightOffer,
  FlightSegment,
} from "@/lib/types";
import { AIRLINES, airportByCode } from "./airports";

/** Small deterministic PRNG so a route/date always yields the same sample set. */
function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function addMinutes(time: string, mins: number) {
  const [h, m] = time.split(":").map(Number);
  const total = (h * 60 + m + mins) % 1440;
  const hh = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const mm = (total % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Rough great-circle-ish base duration (minutes) between two Indian/near airports. */
function baseDuration(from: string, to: string) {
  const intl = ["DXB", "AUH", "SIN", "BKK", "KUL", "DOH", "LHR", "CMB", "KTM", "MLE"];
  const isIntl = intl.includes(from) || intl.includes(to);
  const h = hash(from + to);
  if (to === "LHR" || from === "LHR") return 540 + (h % 40);
  if (isIntl) return 195 + (h % 120);
  return 90 + (h % 90);
}

function fareBrands(
  base: number,
  taxes: number,
  seed: () => number,
): FareOption[] {
  const brands = [
    {
      brand: "SAVER",
      mult: 1,
      conditions: {
        refundable: false,
        cabinBaggage: "7 kg",
        checkInBaggage: "15 kg",
        seatChoice: false,
        mealIncluded: false,
      },
      earnRate: 0.03,
    },
    {
      brand: "FLEXI",
      mult: 1.18,
      conditions: {
        refundable: true,
        cabinBaggage: "7 kg",
        checkInBaggage: "20 kg",
        seatChoice: true,
        mealIncluded: true,
      },
      earnRate: 0.045,
    },
    {
      brand: "CORPORATE",
      mult: 1.32,
      conditions: {
        refundable: true,
        cabinBaggage: "10 kg",
        checkInBaggage: "25 kg",
        seatChoice: true,
        mealIncluded: true,
      },
      earnRate: 0.06,
    },
  ];
  return brands.map((b, i) => {
    const baseFare = Math.round((base * b.mult) / 10) * 10;
    const tax = Math.round((taxes * b.mult) / 10) * 10;
    const total = baseFare + tax;
    const agentEarning = Math.round((total * b.earnRate) / 5) * 5;
    return {
      id: `${b.brand}-${i}`,
      brand: b.brand,
      baseFare,
      taxes: tax,
      total,
      seatsLeft: 3 + Math.floor(seed() * 7),
      conditions: b.conditions,
      publishedFare: total + agentEarning,
      agentEarning,
    };
  });
}

export interface SearchParams {
  from: string;
  to: string;
  departDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  cabin?: CabinClass;
  tripType?: "oneway" | "roundtrip";
}

/** Generate a realistic, deterministic set of flight offers for a route. */
export function generateFlights(params: SearchParams): FlightOffer[] {
  const from = airportByCode(params.from);
  const to = airportByCode(params.to);
  const cabin: CabinClass = params.cabin ?? "Economy";
  const seed = seeded(hash(`${from.code}${to.code}${params.departDate}${cabin}`) + 7);

  const depSlots = ["06:15", "08:40", "10:05", "12:30", "14:50", "17:20", "19:45", "21:10", "23:05"];
  const dur = baseDuration(from.code, to.code);

  // Base fare scales with duration + cabin.
  const cabinMult = cabin === "Business" ? 3.4 : cabin === "Premium Economy" ? 1.8 : 1;
  const count = 6 + Math.floor(seed() * 3);
  const offers: FlightOffer[] = [];

  for (let i = 0; i < count; i++) {
    const airline: Airline = AIRLINES[Math.floor(seed() * AIRLINES.length)];
    const stops = seed() > 0.72 ? 1 : 0;
    const departTime = depSlots[i % depSlots.length];
    const legDur = Math.round(dur * (0.92 + seed() * 0.25));
    const layover = stops ? 45 + Math.floor(seed() * 90) : 0;
    const totalDur = legDur + layover + (stops ? Math.round(legDur * 0.4) : 0);
    const arriveTime = addMinutes(departTime, totalDur);
    const flightNo = `${airline.code} ${100 + Math.floor(seed() * 899)}`;

    const segments: FlightSegment[] = [];
    if (stops === 0) {
      segments.push({
        airline,
        flightNumber: flightNo,
        from,
        to,
        departTime,
        arriveTime,
        departDate: params.departDate,
        durationMins: totalDur,
      });
    } else {
      // one stop via a plausible hub
      const hubCode = ["BOM", "DEL", "HYD"].filter((c) => c !== from.code && c !== to.code)[0];
      const hub: Airport = airportByCode(hubCode);
      const midTime = addMinutes(departTime, legDur);
      const secondDep = addMinutes(midTime, layover);
      segments.push({
        airline,
        flightNumber: flightNo,
        from,
        to: hub,
        departTime,
        arriveTime: midTime,
        departDate: params.departDate,
        durationMins: legDur,
      });
      segments.push({
        airline,
        flightNumber: `${airline.code} ${100 + Math.floor(seed() * 899)}`,
        from: hub,
        to,
        departTime: secondDep,
        arriveTime,
        departDate: params.departDate,
        durationMins: Math.round(legDur * 0.4),
      });
    }

    const base = Math.round(((28 + dur * 0.9) * 100 * cabinMult * (0.9 + seed() * 0.5)) / 10) * 10;
    const taxes = Math.round((base * 0.22) / 10) * 10;

    offers.push({
      id: `ET-${from.code}${to.code}-${i}-${hash(flightNo) % 9999}`,
      segments,
      stops,
      totalDurationMins: totalDur,
      cabin,
      fares: fareBrands(base, taxes, seed),
      from,
      to,
      departTime,
      arriveTime,
    });
  }

  return offers;
}
