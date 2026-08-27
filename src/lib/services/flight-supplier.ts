import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Flight supplier abstraction (spec §25). All supplier calls go through this
 * interface so a real GDS/consolidator can be dropped in without touching the
 * booking flow. Supplier credentials stay server-side.
 *
 * The bundled `mock` supplier makes the whole flow work end-to-end with clearly
 * illustrative fares — it never pretends a ticket was issued unless its own
 * (simulated) issuance step succeeds. Swap it for a real supplier by
 * implementing FlightSupplier and returning it from getSupplier().
 */

export type CabinClass = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
export type PaxType = "ADULT" | "CHILD" | "INFANT";

export type SearchParams = { origin: string; destination: string; departDate: string; pax: number; cabin?: CabinClass };

export type FlightOffer = {
  token: string; // signed, tamper-evident offer token (carries the fare)
  supplier: string;
  origin: string; destination: string; departDate: string;
  airline: string; airlineCode: string; flightNumber: string;
  departTime: string; arriveTime: string; durationMins: number; stops: number;
  cabin: CabinClass;
  baseFare: number; taxes: number; totalFare: number; currency: string; // per passenger, whole rupees
  seatsLeft: number;
  illustrative: boolean;
};

export type Passenger = { firstName: string; lastName: string; type: PaxType };
export type FareResult = { ok: boolean; changed: boolean; offer?: FlightOffer; error?: string };
export type CreateBookingResult = { ok: boolean; supplierRef?: string; pnr?: string; error?: string };
export type IssueResult = { ok: boolean; ticketNumbers?: string[]; pending?: boolean; error?: string };
export type SupplierBooking = { supplierRef: string; pnr?: string; status: string; ticketNumbers?: string[] };
export type CancelResult = { ok: boolean; refundAmount?: number; error?: string };

export interface FlightSupplier {
  key: string;
  searchFlights(p: SearchParams): Promise<FlightOffer[]>;
  revalidateFare(token: string): Promise<FareResult>;
  createBooking(offer: FlightOffer, passengers: Passenger[]): Promise<CreateBookingResult>;
  issueTicket(supplierRef: string, pax: number): Promise<IssueResult>;
  getBooking(supplierRef: string): Promise<SupplierBooking | null>;
  cancelBooking(supplierRef: string): Promise<CancelResult>;
  reissueBooking(supplierRef: string): Promise<CreateBookingResult>;
  getRefundStatus(supplierRef: string): Promise<{ status: string; amount?: number }>;
}

// ── Signed offer tokens (server-side; the browser can't alter the fare) ──
const SECRET = process.env.AUTH_SECRET || "insecure-dev-secret-change-me";
type OfferCore = Omit<FlightOffer, "token">;

function signOffer(core: OfferCore): string {
  const body = Buffer.from(JSON.stringify(core)).toString("base64url");
  const sig = createHmac("sha256", `offer:${SECRET}`).update(body).digest("base64url");
  return `${body}.${sig}`;
}
export function decodeOffer(token: string): OfferCore | null {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  try {
    const expected = createHmac("sha256", `offer:${SECRET}`).update(body!).digest("base64url");
    const a = Buffer.from(sig!); const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return JSON.parse(Buffer.from(body!, "base64url").toString()) as OfferCore;
  } catch {
    return null;
  }
}

// ── deterministic helpers ──
const AIRLINES = [
  { name: "IndiGo", code: "6E" },
  { name: "Air India", code: "AI" },
  { name: "Vistara", code: "UK" },
  { name: "Akasa Air", code: "QP" },
  { name: "SpiceJet", code: "SG" },
];
function hash(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h); }
function hhmm(totalMin: number): string { const m = ((totalMin % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; }

const mockSupplier: FlightSupplier = {
  key: "mock",

  async searchFlights({ origin, destination, departDate, cabin = "ECONOMY" }) {
    const O = origin.toUpperCase().slice(0, 3), D = destination.toUpperCase().slice(0, 3);
    const seed = hash(`${O}-${D}-${departDate}`);
    const baseByRoute = 2600 + (seed % 5200); // route floor
    const cabinMult = cabin === "BUSINESS" ? 3.4 : cabin === "PREMIUM_ECONOMY" ? 1.7 : cabin === "FIRST" ? 5 : 1;

    return AIRLINES.map((al, i) => {
      const s = hash(`${O}${D}${departDate}${al.code}`);
      const departMin = 6 * 60 + ((s % 15) * 60 + (s % 2) * 30); // 06:00–21:30
      const durationMins = 75 + (s % 150); // 1h15–3h45
      const stops = s % 5 === 0 ? 1 : 0;
      const dur = durationMins + (stops ? 90 : 0);
      const baseFare = Math.round(((baseByRoute + i * 480 + (s % 900)) * cabinMult) / 10) * 10;
      const taxes = Math.round(baseFare * 0.16 / 10) * 10;
      const core: OfferCore = {
        supplier: "mock",
        origin: O, destination: D, departDate,
        airline: al.name, airlineCode: al.code, flightNumber: `${al.code} ${100 + (s % 899)}`,
        departTime: hhmm(departMin), arriveTime: hhmm(departMin + dur), durationMins: dur, stops,
        cabin: cabin as CabinClass,
        baseFare, taxes, totalFare: baseFare + taxes, currency: "INR",
        seatsLeft: 3 + (s % 7),
        illustrative: true,
      };
      return { ...core, token: signOffer(core) };
    }).sort((a, b) => a.totalFare - b.totalFare);
  },

  async revalidateFare(token) {
    const core = decodeOffer(token);
    if (!core) return { ok: false, changed: false, error: "This fare is no longer valid. Please search again." };
    // Mock keeps the fare stable; a real supplier may return a changed price here.
    return { ok: true, changed: false, offer: { ...core, token } };
  },

  async createBooking(offer, passengers) {
    // Test hook: a passenger surnamed FAILTEST simulates a supplier failure so the
    // wallet-hold-release path can be exercised end-to-end.
    if (passengers.some((p) => p.lastName.trim().toUpperCase() === "FAILTEST")) {
      return { ok: false, error: "Supplier declined the booking (simulated failure)." };
    }
    const supplierRef = `MOCK-${randomBytes(4).toString("hex").toUpperCase()}`;
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
    let pnr = ""; const b = randomBytes(6); for (let i = 0; i < 6; i++) pnr += alphabet[b[i]! % alphabet.length];
    return { ok: true, supplierRef, pnr };
  },

  async issueTicket(_supplierRef, pax) {
    const tickets = Array.from({ length: Math.max(1, pax) }, () => {
      const n = randomBytes(6).toString("hex").replace(/\D/g, "").padEnd(10, "0").slice(0, 10);
      return `${100 + (hash(_supplierRef) % 899)}-${n}`;
    });
    return { ok: true, ticketNumbers: tickets };
  },

  async getBooking(supplierRef) {
    return { supplierRef, status: "CONFIRMED" };
  },
  async cancelBooking() {
    return { ok: true }; // refund amount decided by policy in the booking service
  },
  async reissueBooking(supplierRef) {
    return { ok: true, supplierRef };
  },
  async getRefundStatus() {
    return { status: "PROCESSED" };
  },
};

/** Returns the active supplier. Real suppliers read their creds from env here. */
export function getSupplier(): FlightSupplier {
  // e.g. if (process.env.FLIGHT_SUPPLIER === "tripjack") return tripjackSupplier;
  return mockSupplier;
}

export function isMockSupplier(): boolean {
  return getSupplier().key === "mock";
}
