import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";

/**
 * ExpertzWallet — the prepaid booking balance (spec §11–§14).
 *
 * Invariants:
 *   • All amounts are positive whole rupees; `type` conveys direction.
 *   • `balance` is spendable; `onHold` is reserved for in-flight bookings.
 *   • Credits happen ONLY here, from trusted server-side verification — the
 *     browser never credits the wallet.
 *   • Top-up credit is idempotent on `providerOrderId`: a duplicate Razorpay
 *     webhook (or webhook + client-verify racing) credits exactly once.
 *   • Every balance change and its ledger row happen in ONE db transaction.
 */

export type WalletSummary = { available: number; onHold: number; total: number; currency: string };

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function walletTxnReference(): string {
  const b = randomBytes(6);
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[b[i]! % alphabet.length];
  return `WTX-${out}`;
}

export async function getOrCreateWallet(customerId: string) {
  const existing = await db.wallet.findUnique({ where: { customerId } });
  if (existing) return existing;
  try {
    return await db.wallet.create({ data: { customerId } });
  } catch {
    // Race: another request created it — read it back.
    return db.wallet.findUniqueOrThrow({ where: { customerId } });
  }
}

export async function getWalletSummary(customerId: string): Promise<WalletSummary> {
  const w = await db.wallet.findUnique({ where: { customerId }, select: { balance: true, onHold: true, currency: true } });
  const available = w?.balance ?? 0;
  const onHold = w?.onHold ?? 0;
  return { available, onHold, total: available + onHold, currency: w?.currency ?? "INR" };
}

export async function listWalletTransactions(customerId: string, limit = 25) {
  const w = await db.wallet.findUnique({ where: { customerId }, select: { id: true } });
  if (!w) return [];
  return db.walletTransaction.findMany({
    where: { walletId: w.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Stage a pending top-up when a Razorpay order is created. Idempotent on
 * providerOrderId so a retried order call doesn't create duplicate rows.
 */
export async function stageTopup(customerId: string, providerOrderId: string, amount: number): Promise<void> {
  const wallet = await getOrCreateWallet(customerId);
  const existing = await db.walletTransaction.findUnique({ where: { providerOrderId } });
  if (existing) return;
  await db.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: "TOPUP",
      amount,
      status: "PENDING",
      reference: walletTxnReference(),
      description: "Wallet top-up",
      provider: "razorpay",
      providerOrderId,
    },
  });
}

export type CreditResult = { ok: boolean; already?: boolean; credited?: boolean; amount?: number; balanceAfter?: number; reason?: string };

/**
 * Idempotently credit a top-up identified by its Razorpay order id. Called by
 * BOTH the client-verify route and the webhook — whichever lands first credits;
 * the rest are safe no-ops. Never double-credits (spec §13).
 */
export async function creditTopupByOrder(providerOrderId: string, providerPaymentId?: string): Promise<CreditResult> {
  return db.$transaction(async (tx) => {
    const txn = await tx.walletTransaction.findUnique({ where: { providerOrderId } });
    if (!txn) return { ok: false, reason: "not_found" };
    if (txn.type !== "TOPUP") return { ok: false, reason: "not_a_topup" };
    if (txn.status === "SUCCESS") return { ok: true, already: true, amount: txn.amount, balanceAfter: txn.balanceAfter ?? undefined };

    const wallet = await tx.wallet.update({
      where: { id: txn.walletId },
      data: { balance: { increment: txn.amount } },
      select: { balance: true },
    });
    await tx.walletTransaction.update({
      where: { id: txn.id },
      data: { status: "SUCCESS", providerPaymentId: providerPaymentId ?? txn.providerPaymentId, balanceAfter: wallet.balance },
    });
    return { ok: true, credited: true, amount: txn.amount, balanceAfter: wallet.balance };
  });
}

/** Mark a top-up order failed (webhook payment.failed) — only if still pending. */
export async function failTopupByOrder(providerOrderId: string, reason?: string): Promise<void> {
  const txn = await db.walletTransaction.findUnique({ where: { providerOrderId }, select: { id: true, status: true } });
  if (!txn || txn.status !== "PENDING") return;
  await db.walletTransaction.update({ where: { id: txn.id }, data: { status: "FAILED", description: reason ? `Top-up failed: ${reason}` : "Top-up failed" } });
}

export type HoldResult = { ok: boolean; error?: string; reference?: string };

/**
 * Reserve funds for a booking: available → onHold, atomically, only if the
 * spendable balance covers it (spec §14). Guards against a duplicate hold for
 * the same bookingRef.
 */
export async function holdForBooking(customerId: string, amount: number, bookingRef: string, description?: string): Promise<HoldResult> {
  if (amount <= 0) return { ok: false, error: "Invalid amount." };
  return db.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { customerId } });
    if (!wallet) return { ok: false, error: "Wallet not found." };

    const dup = await tx.walletTransaction.findFirst({ where: { walletId: wallet.id, bookingRef, type: "HOLD", status: "SUCCESS" } });
    if (dup) return { ok: true, reference: dup.reference }; // already held

    if (wallet.balance < amount) return { ok: false, error: "Insufficient wallet balance." };

    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: amount }, onHold: { increment: amount } },
      select: { balance: true },
    });
    const reference = walletTxnReference();
    await tx.walletTransaction.create({
      data: { walletId: wallet.id, type: "HOLD", amount, status: "SUCCESS", reference, description: description ?? "Booking hold", bookingRef, balanceAfter: updated.balance },
    });
    return { ok: true, reference };
  });
}

/**
 * Settle a prior hold once the supplier responds:
 *   • DEBIT   → supplier confirmed: funds leave the wallet (onHold −amount).
 *   • RELEASE → supplier failed: funds return to spendable (onHold → balance).
 * Idempotent per bookingRef — a second settle after the first is a no-op.
 */
export async function settleHold(bookingRef: string, outcome: "DEBIT" | "RELEASE"): Promise<{ ok: boolean; error?: string }> {
  return db.$transaction(async (tx) => {
    const hold = await tx.walletTransaction.findFirst({ where: { bookingRef, type: "HOLD", status: "SUCCESS" }, orderBy: { createdAt: "desc" } });
    if (!hold) return { ok: false, error: "No active hold for this booking." };

    const settled = await tx.walletTransaction.findFirst({ where: { bookingRef, type: { in: ["DEBIT", "HOLD_RELEASE"] } } });
    if (settled) return { ok: true }; // already settled — idempotent

    const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: hold.walletId } });
    const amount = hold.amount;

    if (outcome === "DEBIT") {
      const updated = await tx.wallet.update({ where: { id: wallet.id }, data: { onHold: { decrement: amount } }, select: { balance: true } });
      await tx.walletTransaction.create({
        data: { walletId: wallet.id, type: "DEBIT", amount, status: "SUCCESS", reference: walletTxnReference(), description: "Flight booking", bookingRef, balanceAfter: updated.balance },
      });
    } else {
      const updated = await tx.wallet.update({ where: { id: wallet.id }, data: { onHold: { decrement: amount }, balance: { increment: amount } }, select: { balance: true } });
      await tx.walletTransaction.create({
        data: { walletId: wallet.id, type: "HOLD_RELEASE", amount, status: "SUCCESS", reference: walletTxnReference(), description: "Hold released (booking failed)", bookingRef, balanceAfter: updated.balance },
      });
    }
    return { ok: true };
  });
}

/** Credit a refund back to the wallet (e.g. cancellation). Idempotent per bookingRef+REFUND. */
export async function refundToWallet(customerId: string, amount: number, bookingRef: string, description?: string): Promise<{ ok: boolean; error?: string }> {
  if (amount <= 0) return { ok: false, error: "Invalid amount." };
  return db.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { customerId } });
    if (!wallet) return { ok: false, error: "Wallet not found." };
    const dup = await tx.walletTransaction.findFirst({ where: { walletId: wallet.id, bookingRef, type: "REFUND" } });
    if (dup) return { ok: true };
    const updated = await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: amount } }, select: { balance: true } });
    await tx.walletTransaction.create({
      data: { walletId: wallet.id, type: "REFUND", amount, status: "SUCCESS", reference: walletTxnReference(), description: description ?? "Refund", bookingRef, balanceAfter: updated.balance },
    });
    return { ok: true };
  });
}

/** Human labels + sign for the ledger UI. */
export function txnDisplay(type: string): { label: string; sign: "+" | "-" | ""; tone: string } {
  switch (type) {
    case "TOPUP": return { label: "Wallet top-up", sign: "+", tone: "text-success" };
    case "REFUND": return { label: "Refund", sign: "+", tone: "text-brand-blue" };
    case "HOLD_RELEASE": return { label: "Hold released", sign: "+", tone: "text-brand-blue" };
    case "DEBIT": return { label: "Flight booking", sign: "-", tone: "text-ink" };
    case "HOLD": return { label: "Booking hold", sign: "-", tone: "text-warning" };
    case "ADJUSTMENT": return { label: "Adjustment", sign: "", tone: "text-ink" };
    default: return { label: type, sign: "", tone: "text-ink" };
  }
}
