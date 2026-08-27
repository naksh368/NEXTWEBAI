/**
 * Pure wallet-ledger math — no DB, no I/O — so the money-critical rules can be
 * unit-tested in isolation. The DB service in `wallet.ts` builds on these.
 *
 * Invariants:
 *  - Balance is the sum of SUCCESS ledger rows (signed paise). It is never a
 *    number the UI can set directly.
 *  - Available = balance − active holds. Debits and new holds require
 *    available ≥ amount.
 *  - Every mutating op carries an idempotency key; applying the same key twice
 *    must not move money.
 */
export type LedgerRow = { amountPaise: bigint; status: string };

/** Balance = Σ successful signed amounts. Pending/failed rows do not count. */
export function deriveBalancePaise(rows: LedgerRow[]): bigint {
  return rows.reduce((sum, r) => (r.status === "SUCCESS" ? sum + r.amountPaise : sum), 0n);
}

/** Spendable funds = balance minus what is currently held. */
export function availablePaise(balancePaise: bigint, heldPaise: bigint): bigint {
  const a = balancePaise - heldPaise;
  return a > 0n ? a : 0n;
}

/** A debit or hold is allowed only when enough is available. */
export function canSpend(availablePaiseValue: bigint, amountPaise: bigint): boolean {
  return amountPaise > 0n && availablePaiseValue >= amountPaise;
}

/** Guard: amounts moved into the ledger must be strictly positive magnitudes. */
export function assertPositive(amountPaise: bigint): void {
  if (typeof amountPaise !== "bigint" || amountPaise <= 0n) {
    throw new Error("Amount must be a positive number of paise.");
  }
}

/** Signed amount for a ledger row given its type (credit +, debit −). */
export function signedAmount(type: string, magnitudePaise: bigint): bigint {
  const credits = new Set(["TOPUP", "HOLD_RELEASE", "REFUND", "MANUAL_CREDIT", "REVERSAL"]);
  const debits = new Set(["BOOKING_HOLD", "BOOKING_DEBIT", "MANUAL_DEBIT"]);
  if (credits.has(type)) return magnitudePaise;
  if (debits.has(type)) return -magnitudePaise;
  throw new Error(`Unknown wallet transaction type: ${type}`);
}
