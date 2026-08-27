import { test } from "node:test";
import assert from "node:assert/strict";
import {
  deriveBalancePaise, availablePaise, canSpend, assertPositive, signedAmount,
} from "../src/lib/wallet-ledger";

test("balance = sum of SUCCESS rows only", () => {
  const rows = [
    { amountPaise: 500000n, status: "SUCCESS" },   // +5000
    { amountPaise: -325000n, status: "SUCCESS" },  // -3250
    { amountPaise: 999999n, status: "PENDING" },   // ignored
    { amountPaise: 100000n, status: "FAILED" },    // ignored
  ];
  assert.equal(deriveBalancePaise(rows), 175000n); // ₹1,750.00
});

test("available = balance − held, floored at zero", () => {
  assert.equal(availablePaise(500000n, 200000n), 300000n);
  assert.equal(availablePaise(100000n, 200000n), 0n); // never negative
  assert.equal(availablePaise(0n, 0n), 0n);
});

test("canSpend requires positive amount within available", () => {
  assert.equal(canSpend(300000n, 300000n), true);
  assert.equal(canSpend(300000n, 300001n), false);
  assert.equal(canSpend(300000n, 0n), false);
});

test("signedAmount: credits positive, debits negative", () => {
  assert.equal(signedAmount("TOPUP", 100n), 100n);
  assert.equal(signedAmount("REFUND", 100n), 100n);
  assert.equal(signedAmount("MANUAL_CREDIT", 100n), 100n);
  assert.equal(signedAmount("BOOKING_DEBIT", 100n), -100n);
  assert.equal(signedAmount("MANUAL_DEBIT", 100n), -100n);
  assert.throws(() => signedAmount("NONSENSE", 100n));
});

test("assertPositive rejects zero and negatives", () => {
  assert.doesNotThrow(() => assertPositive(1n));
  assert.throws(() => assertPositive(0n));
  assert.throws(() => assertPositive(-5n));
});

test("double-apply is prevented by idempotency (simulated): same key counted once", () => {
  // The DB enforces uniqueness on idempotencyKey; here we prove the projection
  // math: applying the same credit twice must not change the derived balance
  // beyond a single row.
  const applied = new Map<string, { amountPaise: bigint; status: string }>();
  const credit = (key: string, amt: bigint) => { if (!applied.has(key)) applied.set(key, { amountPaise: amt, status: "SUCCESS" }); };
  credit("topup:pay_1", 500000n);
  credit("topup:pay_1", 500000n); // duplicate webhook
  assert.equal(deriveBalancePaise([...applied.values()]), 500000n);
});
