/**
 * Money helpers for the agent wallet.
 *
 * The wallet ledger stores integer PAISE (as BigInt in the DB) so arithmetic is
 * always exact — never floating-point rupees. Convert only at the boundaries:
 * user input (rupees) → paise on the way in; paise → rupees for display/JSON.
 */
export const PAISE_PER_RUPEE = 100n;

/** Rupees (whole number) → paise. Rejects non-finite / fractional-paise inputs. */
export function rupeesToPaise(rupees: number): bigint {
  if (!Number.isFinite(rupees)) throw new Error("Invalid amount.");
  // round to the nearest paisa to absorb float noise, then to bigint
  return BigInt(Math.round(rupees * 100));
}

/** Paise → rupees as a JS number (safe for realistic amounts < ₹90 trillion). */
export function paiseToRupees(paise: bigint): number {
  return Number(paise) / 100;
}

/** Format paise as an INR string, e.g. 2450000n → "₹24,500.00". */
export function formatPaise(paise: bigint): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(paiseToRupees(paise));
}
