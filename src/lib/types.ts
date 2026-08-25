/* ─────────────────────────────────────────────────────────────
   ExpertzTrip domain types (V1 — flights only)
   ───────────────────────────────────────────────────────────── */

export interface Airport {
  code: string; // IATA, e.g. DEL
  city: string; // Delhi
  name: string; // Indira Gandhi Intl
  country: string;
}

export interface Airline {
  code: string; // AI, 6E, UK
  name: string; // Air India
}

export type CabinClass = "Economy" | "Premium Economy" | "Business";
export type TripType = "oneway" | "roundtrip";

export interface FareCondition {
  refundable: boolean;
  cabinBaggage: string; // "7 kg"
  checkInBaggage: string; // "15 kg"
  seatChoice: boolean;
  mealIncluded: boolean;
}

/** One purchasable fare on a flight (e.g. Saver, Flexi, Corporate). */
export interface FareOption {
  id: string;
  brand: string; // "SAVER" | "FLEXI" | "CORPORATE"
  baseFare: number;
  taxes: number;
  total: number; // baseFare + taxes (per adult)
  seatsLeft: number;
  conditions: FareCondition;
  /** Transparent economics shown to the agent. */
  publishedFare: number; // what the agent could sell at
  agentEarning: number; // agent's transparent margin on this fare
}

export interface FlightSegment {
  airline: Airline;
  flightNumber: string;
  from: Airport;
  to: Airport;
  departTime: string; // "09:40"
  arriveTime: string; // "12:20"
  departDate: string; // ISO date
  durationMins: number;
}

export interface FlightOffer {
  id: string;
  segments: FlightSegment[]; // 1 = non-stop, 2 = 1 stop, ...
  stops: number;
  totalDurationMins: number;
  cabin: CabinClass;
  fares: FareOption[]; // sorted cheapest first
  from: Airport;
  to: Airport;
  departTime: string;
  arriveTime: string;
}

export type PaxType = "ADT" | "CHD" | "INF";
export type Gender = "Male" | "Female";

export interface Passenger {
  type: PaxType;
  firstName: string;
  lastName: string;
  dob: string;
  gender: Gender;
  nationality: string;
  passportNo?: string;
  passportExpiry?: string;
}

export type BookingStatus =
  | "TICKET ISSUED"
  | "ON HOLD"
  | "PENDING"
  | "CANCELLED"
  | "FAILED"
  | "REFUND INITIATED"
  | "REFUNDED";

export interface Booking {
  id: string; // ETB-XXXX
  pnr: string;
  ticketNumbers: string[];
  status: BookingStatus;
  passengers: Passenger[];
  leadPassenger: string;
  route: string; // "DEL → DXB"
  airline: string;
  flightNumber: string;
  travelDate: string; // ISO
  bookedOn: string; // ISO
  baseFare: number;
  taxes: number;
  total: number;
  refund?: {
    cancellationFee: number;
    supplierCharges: number;
    refundAmount: number;
    status: "REFUND INITIATED" | "REFUNDED";
  };
}

export type TxnType = "TOPUP" | "BOOKING" | "REFUND" | "HOLD" | "HOLD_RELEASE";
export interface WalletTransaction {
  id: string;
  date: string; // ISO
  type: TxnType;
  description: string;
  bookingId?: string;
  credit?: number;
  debit?: number;
  balanceAfter: number;
}

export type KycStatus = "KYC PENDING" | "KYC APPROVED" | "KYC REJECTED";
export type AgentStatus = "ACTIVE" | "SUSPENDED";

export interface AgentAccount {
  id: string;
  companyName: string;
  agentName: string;
  gst: string;
  pan: string;
  email: string;
  phone: string;
  city: string;
  kyc: KycStatus;
  status: AgentStatus;
  walletBalance: number;
  totalBookings: number;
  totalSales: number;
  joinedOn: string;
}
