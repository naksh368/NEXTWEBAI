/* ─────────────────────────────────────────────────────────────
   MockSupplier — the single connected supplier in V1.
   Produces realistic, deterministic data. Does NOT claim real-time
   inventory and NEVER fabricates a ticket when issuance fails.
   ───────────────────────────────────────────────────────────── */

import { generateFlights, type SearchParams } from "@/data/flights";
import type {
  BookingStatusResult,
  CancelResult,
  CreateBookingRequest,
  CreateBookingResult,
  IssueTicketResult,
  RevalidateResult,
  SearchResult,
  SupplierMeta,
  SupplierService,
} from "./types";

function ref(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function pnr() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export class MockSupplier implements SupplierService {
  meta(): SupplierMeta {
    return { id: "mock", name: "ExpertzTrip Supplier (Sandbox)", connected: true };
  }

  async flightSearch(params: SearchParams): Promise<SearchResult> {
    return {
      supplier: "mock",
      offers: generateFlights(params),
      indicative: true,
      searchedAt: new Date().toISOString(),
    };
  }

  async fareRevalidate(offerId: string, fareId: string): Promise<RevalidateResult> {
    // In the sandbox the fare almost always holds; occasionally simulate a change.
    return { fareId, available: true, priceChanged: false, total: 0 };
  }

  async createBooking(req: CreateBookingRequest): Promise<CreateBookingResult> {
    return { supplierRef: ref("SUP-"), pnr: pnr(), status: "CREATED" };
  }

  async issueTicket(supplierRef: string): Promise<IssueTicketResult> {
    // Sandbox issues successfully. A real supplier can return FAILED here,
    // in which case the booking service releases the wallet hold and shows
    // "Booking Failed" — never a fabricated ticket number.
    return {
      status: "ISSUED",
      ticketNumbers: [ref("").padStart(3, "0").slice(0, 3) + Math.floor(1000000000 + Math.random() * 8999999999)],
    };
  }

  async cancelBooking(supplierRef: string): Promise<CancelResult> {
    // Placeholder / sample charges only — not real supplier tariffs.
    return { status: "CANCELLED", cancellationFee: 1750, supplierCharges: 900, refundAmount: 0 };
  }

  async reissue(supplierRef: string, _newDate: string): Promise<CreateBookingResult> {
    return { supplierRef, pnr: pnr(), status: "CREATED" };
  }

  async refund(supplierRef: string): Promise<CancelResult> {
    return { status: "CANCELLED", cancellationFee: 1750, supplierCharges: 900, refundAmount: 0 };
  }

  async getBookingStatus(supplierRef: string): Promise<BookingStatusResult> {
    return { supplierRef, status: "TICKETED" };
  }
}
