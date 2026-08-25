import type { WalletTransaction } from "@/lib/types";

/** V1 is a PREPAID wallet. No credit is extended. */
export const WALLET = {
  availableBalance: 52450,
  todaysBookings: 18500,
  pendingRefunds: 4200,
  onHold: 0,
};

export const WALLET_TRANSACTIONS: WalletTransaction[] = [
  {
    id: "TXN-10241",
    date: "2026-08-25T10:12:00",
    type: "TOPUP",
    description: "Wallet Top-up · UPI",
    credit: 25000,
    balanceAfter: 52450,
  },
  {
    id: "TXN-10240",
    date: "2026-08-25T09:40:00",
    type: "BOOKING",
    description: "Flight Booking · DEL → DXB",
    bookingId: "ETB-2041",
    debit: 18500,
    balanceAfter: 27450,
  },
  {
    id: "TXN-10238",
    date: "2026-08-24T18:05:00",
    type: "REFUND",
    description: "Refund · BOM → GOI cancellation",
    bookingId: "ETB-2038",
    credit: 4200,
    balanceAfter: 45950,
  },
  {
    id: "TXN-10235",
    date: "2026-08-24T14:22:00",
    type: "BOOKING",
    description: "Flight Booking · BLR → SIN",
    bookingId: "ETB-2035",
    debit: 31200,
    balanceAfter: 41750,
  },
  {
    id: "TXN-10231",
    date: "2026-08-23T11:48:00",
    type: "TOPUP",
    description: "Wallet Top-up · NEFT",
    credit: 50000,
    balanceAfter: 72950,
  },
  {
    id: "TXN-10228",
    date: "2026-08-22T16:30:00",
    type: "BOOKING",
    description: "Flight Booking · DEL → BOM",
    bookingId: "ETB-2028",
    debit: 9800,
    balanceAfter: 22950,
  },
];
