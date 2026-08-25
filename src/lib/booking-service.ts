/* ─────────────────────────────────────────────────────────────
   Booking orchestration — wallet-safe issuance flow.

   CRITICAL SAFETY MODEL (V1, prepaid wallet):

     1. HOLD the fare amount on the agent's wallet (funds reserved,
        not yet debited).
     2. createBooking() at the supplier.
     3. issueTicket() and VERIFY issuance succeeded.
     4. Only on a verified ticket does the HOLD become a final DEBIT.

   If any step fails, the hold is RELEASED and no ticket / PNR is
   surfaced. We never fabricate ticket numbers on failure.

   This module is deliberately supplier-agnostic: it talks to
   SupplierService, never a concrete supplier.
   ───────────────────────────────────────────────────────────── */

import { getSupplier } from "@/lib/supplier";
import type { CreateBookingRequest } from "@/lib/supplier";

export type BookingStep =
  | "hold"
  | "create"
  | "issue"
  | "verify"
  | "debit"
  | "released";

export interface BookingOutcome {
  ok: boolean;
  step: BookingStep;
  pnr?: string;
  ticketNumbers?: string[];
  supplierRef?: string;
  amountDebited?: number;
  message: string;
}

export interface WalletContext {
  available: number;
  amount: number; // total fare to charge
}

/**
 * Run the full hold → book → issue → verify → debit flow.
 * Pure and side-effect free at the data layer (sample data), but the
 * control flow mirrors exactly how a production wallet ledger should
 * behave. Returns a structured outcome the UI renders step-by-step.
 */
export async function processBooking(
  req: CreateBookingRequest,
  wallet: WalletContext,
): Promise<BookingOutcome> {
  const supplier = getSupplier();

  // 1. HOLD — reserve funds. Fail fast if the wallet can't cover it.
  if (wallet.available < wallet.amount) {
    return {
      ok: false,
      step: "hold",
      message: "Insufficient wallet balance. Please top up ExpertzWallet and retry.",
    };
  }
  // (hold placed: available -= amount, onHold += amount)

  // 2. CREATE booking at the supplier.
  let created;
  try {
    created = await supplier.createBooking(req);
  } catch {
    return releaseFailure("Supplier did not accept the booking request.");
  }
  if (created.status !== "CREATED") {
    return releaseFailure(created.reason ?? "Supplier rejected the booking.");
  }

  // 3. ISSUE ticket.
  const issued = await supplier.issueTicket(created.supplierRef);

  // 4. VERIFY issuance before touching money.
  if (issued.status !== "ISSUED" || issued.ticketNumbers.length === 0) {
    return releaseFailure(
      issued.reason ?? "Ticket issuance could not be confirmed by the supplier.",
    );
  }

  // 5. Verified ticket → convert HOLD into a final DEBIT.
  return {
    ok: true,
    step: "debit",
    pnr: created.pnr,
    ticketNumbers: issued.ticketNumbers,
    supplierRef: created.supplierRef,
    amountDebited: wallet.amount,
    message: "Ticket issued and wallet debited.",
  };
}

function releaseFailure(message: string): BookingOutcome {
  // Release the hold — funds return to available. No ticket, no PNR shown.
  return {
    ok: false,
    step: "released",
    message,
  };
}
