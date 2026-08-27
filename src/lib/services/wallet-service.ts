import { db } from "@/lib/db";
import { makeReference } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

/**
 * Wallet ledger service — the financial core of the agent platform.
 *
 * Invariants:
 *  - WalletTransaction is append-only and authoritative. Cached balances on
 *    WalletAccount are only ever mutated inside the SAME db transaction that
 *    writes the ledger row, so they can never drift.
 *  - A top-up credits the wallet EXACTLY ONCE. Idempotency is enforced by the
 *    unique AgentPayment.walletTransactionId guard — a replayed webhook or a
 *    double verify call is a no-op.
 *  - Booking money is held, then either captured (final debit) or released.
 *    Money is never permanently deducted before supplier confirmation.
 */

async function getOrCreateWalletTx(tx: Prisma.TransactionClient, agentId: string) {
  const existing = await tx.walletAccount.findUnique({ where: { agentId } });
  if (existing) return existing;
  return tx.walletAccount.create({ data: { agentId } });
}

export async function getOrCreateWallet(agentId: string) {
  const existing = await db.walletAccount.findUnique({ where: { agentId } });
  if (existing) return existing;
  return db.walletAccount.create({ data: { agentId } });
}

export async function getWalletSummary(agentId: string) {
  const w = await getOrCreateWallet(agentId);
  return {
    available: w.availableBalance,
    onHold: w.onHoldBalance,
    total: w.availableBalance + w.onHoldBalance,
    currency: w.currency,
  };
}

type LedgerInput = {
  type: string;
  direction: "CREDIT" | "DEBIT";
  amount: number;
  paymentRef?: string;
  holdRef?: string;
  bookingRef?: string;
  description?: string;
  actorType?: "SYSTEM" | "AGENT" | "ADMIN";
  actorId?: string;
};

/** Write one ledger row + update the cached available balance atomically. */
async function writeLedger(tx: Prisma.TransactionClient, agentId: string, walletId: string, input: LedgerInput) {
  const wallet = await tx.walletAccount.findUniqueOrThrow({ where: { id: walletId } });
  const delta = input.direction === "CREDIT" ? input.amount : -input.amount;
  const availableAfter = wallet.availableBalance + delta;
  if (availableAfter < 0) throw new Error("INSUFFICIENT_FUNDS");
  await tx.walletAccount.update({ where: { id: walletId }, data: { availableBalance: availableAfter } });
  return tx.walletTransaction.create({
    data: {
      reference: makeReference("TXN"),
      walletId,
      agentId,
      type: input.type,
      direction: input.direction,
      amount: input.amount,
      availableAfter,
      paymentRef: input.paymentRef,
      holdRef: input.holdRef,
      bookingRef: input.bookingRef,
      description: input.description,
      actorType: input.actorType ?? "SYSTEM",
      actorId: input.actorId,
    },
  });
}

/**
 * Credit a successful Razorpay top-up to the wallet — idempotent.
 * Returns { credited, balance }. `credited` is false when the payment was
 * already applied (replayed webhook / double verify).
 */
export async function creditTopup(paymentId: string): Promise<{ credited: boolean; balance: number }> {
  return db.$transaction(async (tx) => {
    const payment = await tx.agentPayment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new Error("PAYMENT_NOT_FOUND");
    // Idempotency guard: already credited → no-op.
    if (payment.walletTransactionId) {
      const w = await getOrCreateWalletTx(tx, payment.agentId);
      return { credited: false, balance: w.availableBalance };
    }
    const wallet = await getOrCreateWalletTx(tx, payment.agentId);
    const ledger = await writeLedger(tx, payment.agentId, wallet.id, {
      type: "TOPUP",
      direction: "CREDIT",
      amount: payment.amount,
      paymentRef: payment.providerPaymentId ?? payment.id,
      description: "Prepaid balance top-up",
      actorType: "AGENT",
      actorId: payment.agentId,
    });
    await tx.agentPayment.update({
      where: { id: payment.id },
      data: { status: "SUCCESS", walletTransactionId: ledger.id },
    });
    const fresh = await tx.walletAccount.findUniqueOrThrow({ where: { id: wallet.id } });
    return { credited: true, balance: fresh.availableBalance };
  });
}

/** Move funds from available → on-hold for a booking. Returns the hold id. */
export async function createHold(agentId: string, amount: number, bookingRef: string): Promise<{ holdId: string }> {
  return db.$transaction(async (tx) => {
    const wallet = await getOrCreateWalletTx(tx, agentId);
    if (wallet.availableBalance < amount) throw new Error("INSUFFICIENT_FUNDS");
    const hold = await tx.walletHold.create({
      data: { walletId: wallet.id, agentId, amount, bookingRef, status: "ACTIVE" },
    });
    await tx.walletAccount.update({
      where: { id: wallet.id },
      data: { availableBalance: { decrement: amount }, onHoldBalance: { increment: amount } },
    });
    await tx.walletTransaction.create({
      data: {
        reference: makeReference("TXN"),
        walletId: wallet.id,
        agentId,
        type: "BOOKING_HOLD",
        direction: "DEBIT",
        amount,
        availableAfter: wallet.availableBalance - amount,
        holdRef: hold.id,
        bookingRef,
        description: "Funds held for booking",
      },
    });
    return { holdId: hold.id };
  });
}

/** Capture a hold as a final booking debit (ticket successfully issued). */
export async function captureHold(holdId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    const hold = await tx.walletHold.findUniqueOrThrow({ where: { id: holdId } });
    if (hold.status !== "ACTIVE") return; // idempotent
    await tx.walletHold.update({ where: { id: holdId }, data: { status: "CAPTURED", resolvedAt: new Date() } });
    const wallet = await tx.walletAccount.findUniqueOrThrow({ where: { id: hold.walletId } });
    await tx.walletAccount.update({ where: { id: wallet.id }, data: { onHoldBalance: { decrement: hold.amount } } });
    await tx.walletTransaction.create({
      data: {
        reference: makeReference("TXN"),
        walletId: wallet.id,
        agentId: hold.agentId,
        type: "BOOKING_DEBIT",
        direction: "DEBIT",
        amount: hold.amount,
        // available is unchanged here (it left available at hold time); this row
        // records the hold→debit conversion for the audit trail.
        availableAfter: wallet.availableBalance,
        holdRef: hold.id,
        bookingRef: hold.bookingRef,
        description: "Booking confirmed — final debit",
      },
    });
  });
}

/** Release a hold back to available (booking failed / cancelled pre-ticket). */
export async function releaseHold(holdId: string, reason?: string): Promise<void> {
  await db.$transaction(async (tx) => {
    const hold = await tx.walletHold.findUniqueOrThrow({ where: { id: holdId } });
    if (hold.status !== "ACTIVE") return; // idempotent
    await tx.walletHold.update({ where: { id: holdId }, data: { status: "RELEASED", resolvedAt: new Date(), reason } });
    const wallet = await tx.walletAccount.findUniqueOrThrow({ where: { id: hold.walletId } });
    const availableAfter = wallet.availableBalance + hold.amount;
    await tx.walletAccount.update({
      where: { id: wallet.id },
      data: { availableBalance: availableAfter, onHoldBalance: { decrement: hold.amount } },
    });
    await tx.walletTransaction.create({
      data: {
        reference: makeReference("TXN"),
        walletId: wallet.id,
        agentId: hold.agentId,
        type: "HOLD_RELEASE",
        direction: "CREDIT",
        amount: hold.amount,
        availableAfter,
        holdRef: hold.id,
        bookingRef: hold.bookingRef,
        description: reason ?? "Hold released",
      },
    });
  });
}

/** Credit a refund to the wallet. Deduped by refund reference to avoid doubles. */
export async function creditRefund(agentId: string, amount: number, bookingRef: string, refundRef: string): Promise<{ credited: boolean }> {
  return db.$transaction(async (tx) => {
    const dupe = await tx.walletTransaction.findFirst({ where: { type: "REFUND", paymentRef: refundRef } });
    if (dupe) return { credited: false };
    const wallet = await getOrCreateWalletTx(tx, agentId);
    await writeLedger(tx, agentId, wallet.id, {
      type: "REFUND",
      direction: "CREDIT",
      amount,
      paymentRef: refundRef,
      bookingRef,
      description: "Refund credited",
    });
    return { credited: true };
  });
}

/** Admin manual adjustment — always audited by the caller. */
export async function manualAdjust(input: {
  agentId: string;
  amount: number;
  direction: "CREDIT" | "DEBIT";
  reason: string;
  adminId: string;
}): Promise<{ balance: number }> {
  return db.$transaction(async (tx) => {
    const wallet = await getOrCreateWalletTx(tx, input.agentId);
    await writeLedger(tx, input.agentId, wallet.id, {
      type: input.direction === "CREDIT" ? "MANUAL_CREDIT" : "MANUAL_DEBIT",
      direction: input.direction,
      amount: input.amount,
      description: input.reason,
      actorType: "ADMIN",
      actorId: input.adminId,
    });
    const fresh = await tx.walletAccount.findUniqueOrThrow({ where: { id: wallet.id } });
    return { balance: fresh.availableBalance };
  });
}

export async function listTransactions(agentId: string, take = 50) {
  return db.walletTransaction.findMany({
    where: { agentId },
    orderBy: { createdAt: "desc" },
    take,
  });
}
