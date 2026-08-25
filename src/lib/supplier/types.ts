/* ─────────────────────────────────────────────────────────────
   ExpertzTrip Supplier Engine — abstraction layer

   V1 connects ONE external flight API, but the UI never talks to a
   supplier directly. Every screen calls SupplierService; concrete
   suppliers (Mock today; TBO, AirIQ, Supplier 1/2 later) implement
   this interface. Swapping or adding a supplier never touches the
   frontend — later this same contract becomes the ExpertzTrip API.
   ───────────────────────────────────────────────────────────── */

import type { FlightOffer, Passenger } from "@/lib/types";
import type { SearchParams } from "@/data/flights";

export interface SupplierMeta {
  /** Machine id, e.g. "mock", "tbo", "airiq". */
  id: string;
  /** Display name shown in the admin Suppliers screen. */
  name: string;
  connected: boolean;
}

export interface SearchResult {
  supplier: string;
  offers: FlightOffer[];
  /** Never claim real-time availability — this is an indicative snapshot. */
  indicative: true;
  searchedAt: string;
}

export interface RevalidateResult {
  fareId: string;
  /** True if fare & seats are still sellable at the quoted price. */
  available: boolean;
  priceChanged: boolean;
  total: number;
}

export interface CreateBookingRequest {
  offerId: string;
  fareId: string;
  passengers: Passenger[];
  contact: { email: string; phone: string };
}

export interface CreateBookingResult {
  supplierRef: string;
  /** PNR from the supplier once the booking is created (pre-ticket). */
  pnr: string;
  status: "CREATED" | "REJECTED";
  reason?: string;
}

export interface IssueTicketResult {
  status: "ISSUED" | "FAILED";
  ticketNumbers: string[];
  reason?: string;
}

export interface CancelResult {
  status: "CANCELLED" | "REJECTED";
  cancellationFee: number;
  supplierCharges: number;
  refundAmount: number;
}

export interface BookingStatusResult {
  supplierRef: string;
  status: "CONFIRMED" | "TICKETED" | "CANCELLED" | "PENDING" | "FAILED";
}

/**
 * The contract every flight supplier must satisfy.
 * FlightSearch · FareRevalidate · CreateBooking · IssueTicket ·
 * CancelBooking · Reissue · Refund · GetBookingStatus.
 */
export interface SupplierService {
  meta(): SupplierMeta;
  flightSearch(params: SearchParams): Promise<SearchResult>;
  fareRevalidate(offerId: string, fareId: string): Promise<RevalidateResult>;
  createBooking(req: CreateBookingRequest): Promise<CreateBookingResult>;
  issueTicket(supplierRef: string): Promise<IssueTicketResult>;
  cancelBooking(supplierRef: string): Promise<CancelResult>;
  reissue(supplierRef: string, newDate: string): Promise<CreateBookingResult>;
  refund(supplierRef: string): Promise<CancelResult>;
  getBookingStatus(supplierRef: string): Promise<BookingStatusResult>;
}
