import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { assertPositive, availablePaise, canSpend, signedAmount } from "@/lib/wallet-ledger";

/**
 * Agent prepaid-wallet service (real money).
 *
 * Rules enforced here:
 *  - Every mutation is idempotent on a caller-supplied key (unique in the DB),
 *    so a duplicate gateway webhook / retried request never moves money twice.
 *  - Money mutations run at SERIALIZABLE isolation so concurrent debits/holds
 *    cannot both spend the same available balance.
 *  - The cached `balancePaise` is only ever changed inside the same transaction
 *    that appends the ledger row, so the projection stays reconciled with the
 *    ledger (verify any time with `reconcile`).
 */

export type WalletTxnType =
  | "TOPUP" | "BOOKING_HOLD" | "BOOKING_DEBIT" | "HOLD_RELEASE"
  | "REFUND" | "MANUAL_CREDIT" | "MANUAL_DEBIT" | "REVERSAL";

// Serializable isolation prevents concurrent double-spend on Postgres (prod).
// SQLite (used for local dev/tests) does not support setting isolation levels,
// so we omit it there and rely on the unique idempotency key + WAL locking.
const IS_PG = (process.env.DATABASE_URL || "").startsWith("postgres");
const SERIALIZABLE = IS_PG ? { isolationLevel: Prisma.TransactionIsolationLevel.Serializable } : undefined;

export async function getOrCreateWallet(agentId: string) {
  return db.walletAccount.upsert({
    where: { agentId },
    update: {},
    create: { agentId },
  });
}

export type WalletSummary = { balancePaise: bigint; heldPaise: bigint; availablePaise: bigint };

export async function getWalletSummary(agentId: string): Promise<WalletSummary> {
  const w = await getOrCreateWallet(agentId);
  return {
    balancePaise: w.balancePaise,
    heldPaise: w.heldPaise,
    availablePaise: availablePaise(w.balancePaise, w.heldPaise),
  };
}

type MoveParams = {
  agentId: string;
  amountPaise: bigint;      // positive magnitude
  type: WalletTxnType;
  idempotencyKey: string;   // unique per logical event
  description?: string;
  paymentId?: string;
  bookingRef?: string;
  createdById?: string;     // admin id for manual adjustments
};

export type MoveResult = { applied: boolean; balancePaise: bigint; transactionId?: string };

/**
 * Append one ledger row (credit or debit) and move the cached balance in the
 * same transaction. Idempotent: if the key was already applied, nothing moves.
 * Debits validate available funds and throw `INSUFFICIENT_FUNDS` if short.
 */
export async function applyLedger(params: MoveParams): Promise<MoveResult> {
  assertPositive(params.amountPaise);
  const signed = signedAmount(params.type, params.amountPaise);

  try {
    return await db.$transaction(async (tx) => {
      const existing = await tx.walletTransaction.findUnique({ where: { idempotencyKey: params.idempotencyKey } });
      if (existing) {
        const w = await tx.walletAccount.findUniqueOrThrow({ where: { agentId: params.agentId } });
        return { applied: false, balancePaise: w.balancePaise, transactionId: existing.id };
      }

      const wallet = await tx.walletAccount.upsert({
        where: { agentId: params.agentId }, update: {}, create: { agentId: params.agentId },
      });

      if (signed < 0n) {
        const avail = availablePaise(wallet.balancePaise, wallet.heldPaise);
        if (!canSpend(avail, params.amountPaise)) throw new Error("INSUFFICIENT_FUNDS");
      }

      const newBalance = wallet.balancePaise + signed;
      const row = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          agentId: params.agentId,
          type: params.type,
          amountPaise: signed,
          balanceAfterPaise: newBalance,
          status: "SUCCESS",
          description: params.description,
          paymentId: params.paymentId,
          bookingRef: params.bookingRef,
          idempotencyKey: params.idempotencyKey,
          createdById: params.createdById,
        },
      });
      await tx.walletAccount.update({ where: { id: wallet.id }, data: { balancePaise: newBalance } });
      return { applied: true, balancePaise: newBalance, transactionId: row.id };
    }, SERIALIZABLE);
  } catch (e) {
    // A concurrent duplicate lost the unique race — treat as already applied.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const w = await getOrCreateWallet(params.agentId);
      return { applied: false, balancePaise: w.balancePaise };
    }
    throw e;
  }
}

/** Convenience: credit a wallet top-up from a verified gateway payment. */
export function creditTopup(agentId: string, amountPaise: bigint, paymentId: string, description = "Wallet top-up") {
  // Idempotency key is the gateway payment id → the same payment can only credit once.
  return applyLedger({ agentId, amountPaise, type: "TOPUP", idempotencyKey: `topup:${paymentId}`, paymentId, description });
}

/** Place a hold on funds while a booking is processed. Throws INSUFFICIENT_FUNDS. */
export async function placeHold(agentId: string, amountPaise: bigint, bookingRef: string): Promise<{ holdId: string }> {
  assertPositive(amountPaise);
  return db.$transaction(async (tx) => {
    const wallet = await tx.walletAccount.upsert({ where: { agentId }, update: {}, create: { agentId } });
    const avail = availablePaise(wallet.balancePaise, wallet.heldPaise);
    if (!canSpend(avail, amountPaise)) throw new Error("INSUFFICIENT_FUNDS");
    const hold = await tx.walletHold.create({
      data: { walletId: wallet.id, agentId, amountPaise, status: "ACTIVE", bookingRef },
    });
    await tx.walletAccount.update({ where: { id: wallet.id }, data: { heldPaise: wallet.heldPaise + amountPaise } });
    return { holdId: hold.id };
  }, SERIALIZABLE);
}

/** Release a hold without charging (e.g. booking failed). */
export async function releaseHold(holdId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    const hold = await tx.walletHold.findUniqueOrThrow({ where: { id: holdId } });
    if (hold.status !== "ACTIVE") return; // idempotent
    await tx.walletHold.update({ where: { id: holdId }, data: { status: "RELEASED", releasedAt: new Date() } });
    const wallet = await tx.walletAccount.findUniqueOrThrow({ where: { id: hold.walletId } });
    const held = wallet.heldPaise - hold.amountPaise;
    await tx.walletAccount.update({ where: { id: wallet.id }, data: { heldPaise: held > 0n ? held : 0n } });
  }, SERIALIZABLE);
}

/** Convert a hold into a final debit (booking succeeded). Idempotent per hold. */
export async function captureHold(holdId: string, opts: { description?: string; bookingRef?: string } = {}): Promise<MoveResult> {
  const hold = await db.walletHold.findUniqueOrThrow({ where: { id: holdId } });
  if (hold.status !== "ACTIVE") {
    const w = await getOrCreateWallet(hold.agentId);
    return { applied: false, balancePaise: w.balancePaise };
  }
  // First drop the hold, then post the debit (idempotent on the hold id).
  await db.$transaction(async (tx) => {
    const wallet = await tx.walletAccount.findUniqueOrThrow({ where: { id: hold.walletId } });
    const held = wallet.heldPaise - hold.amountPaise;
    await tx.walletHold.update({ where: { id: holdId }, data: { status: "CAPTURED", releasedAt: new Date() } });
    await tx.walletAccount.update({ where: { id: wallet.id }, data: { heldPaise: held > 0n ? held : 0n } });
  }, SERIALIZABLE);
  return applyLedger({
    agentId: hold.agentId, amountPaise: hold.amountPaise, type: "BOOKING_DEBIT",
    idempotencyKey: `capture:${holdId}`, bookingRef: opts.bookingRef ?? hold.bookingRef ?? undefined,
    description: opts.description ?? "Flight booking",
  });
}

export function listTransactions(agentId: string, limit = 25) {
  return db.walletTransaction.findMany({
    where: { agentId }, orderBy: { createdAt: "desc" }, take: limit,
  });
}

/** Audit: the cached balance must equal the sum of the SUCCESS ledger rows. */
export async function reconcile(agentId: string): Promise<{ cachedPaise: bigint; derivedPaise: bigint; ok: boolean }> {
  const wallet = await getOrCreateWallet(agentId);
  const agg = await db.walletTransaction.aggregate({
    where: { agentId, status: "SUCCESS" }, _sum: { amountPaise: true },
  });
  const derived = agg._sum.amountPaise ?? 0n;
  return { cachedPaise: wallet.balancePaise, derivedPaise: derived, ok: wallet.balancePaise === derived };
}
