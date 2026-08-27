import { z } from "zod";

/**
 * B2B agent-platform vocabularies. Single source of truth for the agent
 * lifecycle, business types, KYC document requirements and wallet ledger types.
 */

export const AGENT_STATUS = [
  "DRAFT", // account created, still completing registration
  "PENDING_REVIEW",
  "CORRECTION_REQUESTED",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
] as const;
export const AgentStatus = z.enum(AGENT_STATUS);
export type AgentStatus = z.infer<typeof AgentStatus>;

export const AGENT_STATUS_META: Record<
  string,
  { label: string; tone: "neutral" | "info" | "success" | "warning" | "danger" }
> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  PENDING_REVIEW: { label: "Under Review", tone: "info" },
  CORRECTION_REQUESTED: { label: "Correction Requested", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Rejected", tone: "danger" },
  SUSPENDED: { label: "Suspended", tone: "danger" },
};

export const BUSINESS_TYPES = [
  { key: "PROPRIETORSHIP", label: "Proprietorship" },
  { key: "PARTNERSHIP", label: "Partnership" },
  { key: "LLP", label: "LLP" },
  { key: "PRIVATE_LIMITED", label: "Private Limited Company" },
  { key: "OTHER", label: "Other" },
] as const;
export const BusinessType = z.enum([
  "PROPRIETORSHIP",
  "PARTNERSHIP",
  "LLP",
  "PRIVATE_LIMITED",
  "OTHER",
]);
export type BusinessType = z.infer<typeof BusinessType>;

export function businessTypeLabel(key: string): string {
  return BUSINESS_TYPES.find((b) => b.key === key)?.label ?? key;
}

// Document catalogue. `required` documents block submission; others are optional
// (e.g. GST only when the agency provides a GSTIN). Requirements vary by the
// selected business type (spec §5).
export type DocReq = { type: string; label: string; hint?: string };

const COMMON_DOCS: DocReq[] = [
  { type: "PAN", label: "PAN Document", hint: "PAN card of the business / proprietor" },
  { type: "IDENTITY", label: "Identity Document", hint: "Aadhaar / Passport / Voter ID of signatory" },
  { type: "ADDRESS_PROOF", label: "Address Proof", hint: "Utility bill / rent agreement / bank statement" },
];

export const DOCUMENT_REQUIREMENTS: Record<string, DocReq[]> = {
  PROPRIETORSHIP: [
    ...COMMON_DOCS,
    { type: "BUSINESS_PROOF", label: "Business Registration Proof", hint: "Shop Act / Udyam / GST" },
  ],
  PARTNERSHIP: [
    ...COMMON_DOCS,
    { type: "PARTNERSHIP_DEED", label: "Partnership Deed" },
    { type: "BUSINESS_PROOF", label: "Business Registration Proof" },
  ],
  LLP: [
    ...COMMON_DOCS,
    { type: "INCORPORATION", label: "Incorporation / Registration Proof", hint: "LLP Certificate of Incorporation" },
    { type: "BUSINESS_PROOF", label: "Business Registration Proof" },
  ],
  PRIVATE_LIMITED: [
    ...COMMON_DOCS,
    { type: "INCORPORATION", label: "Certificate of Incorporation" },
    { type: "SIGNATORY", label: "Authorized Signatory Documents" },
    { type: "BUSINESS_PROOF", label: "Business Registration Proof" },
  ],
  OTHER: [
    ...COMMON_DOCS,
    { type: "BUSINESS_PROOF", label: "Business Registration Proof" },
  ],
};

// GST is optional — offered whenever a GSTIN was provided, for every type.
export const GST_DOC: DocReq = { type: "GST_CERT", label: "GST Certificate", hint: "If GST-registered" };
export const OTHER_DOC: DocReq = { type: "OTHER", label: "Other Required Document", hint: "Anything else supporting your application" };
export const LOGO_DOC: DocReq = { type: "LOGO", label: "Agency Logo", hint: "PNG/JPG/WEBP — transparent PNG preferred" };

export function requiredDocsFor(businessType: string): DocReq[] {
  return DOCUMENT_REQUIREMENTS[businessType] ?? DOCUMENT_REQUIREMENTS.OTHER;
}

// ── Wallet ledger ─────────────────────────────────────────────
export const WALLET_TX_TYPES = [
  "TOPUP",
  "BOOKING_HOLD",
  "BOOKING_DEBIT",
  "HOLD_RELEASE",
  "REFUND",
  "REVERSAL",
  "MANUAL_CREDIT",
  "MANUAL_DEBIT",
] as const;
export type WalletTxType = (typeof WALLET_TX_TYPES)[number];

export const WALLET_TX_META: Record<string, { label: string; credit: boolean }> = {
  TOPUP: { label: "Wallet top-up", credit: true },
  BOOKING_HOLD: { label: "Booking hold", credit: false },
  BOOKING_DEBIT: { label: "Booking debit", credit: false },
  HOLD_RELEASE: { label: "Hold released", credit: true },
  REFUND: { label: "Refund credited", credit: true },
  REVERSAL: { label: "Reversal", credit: true },
  MANUAL_CREDIT: { label: "Manual credit", credit: true },
  MANUAL_DEBIT: { label: "Manual debit", credit: false },
};

export const AGENT_PAYMENT_STATUS = [
  "INITIATED",
  "PROCESSING",
  "SUCCESS",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
] as const;

export const FLIGHT_BOOKING_STATUS = [
  "DRAFT",
  "REVALIDATED",
  "HOLD",
  "SUPPLIER_PROCESSING",
  "CONFIRMATION_PENDING",
  "TICKETED",
  "FAILED",
  "CANCELLED",
  "REFUND_PENDING",
  "REFUNDED",
] as const;

export const FLIGHT_BOOKING_STATUS_META: Record<
  string,
  { label: string; tone: "neutral" | "info" | "success" | "warning" | "danger" }
> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  REVALIDATED: { label: "Fare revalidated", tone: "info" },
  HOLD: { label: "Funds on hold", tone: "info" },
  SUPPLIER_PROCESSING: { label: "Booking with supplier", tone: "info" },
  CONFIRMATION_PENDING: { label: "Verification pending", tone: "warning" },
  TICKETED: { label: "Ticketed", tone: "success" },
  FAILED: { label: "Failed", tone: "danger" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
  REFUND_PENDING: { label: "Refund pending", tone: "warning" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
};

export const SUPPORT_CATEGORIES = [
  "BOOKING",
  "TICKET",
  "CANCELLATION",
  "REISSUE",
  "REFUND",
  "PAYMENT",
  "WALLET",
  "KYC",
  "ACCOUNT",
  "TECHNICAL",
] as const;

// Password policy (spec §3): min 12, upper+lower+number+special.
export const PASSWORD_POLICY = {
  minLength: 12,
  regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/,
  hint: "At least 12 characters with uppercase, lowercase, a number and a special character.",
};

export function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 12) score++;
  if (pw.length >= 16) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const label = ["Very weak", "Weak", "Fair", "Good", "Strong", "Excellent"][score] ?? "Very weak";
  return { score, label };
}

/** Mask a PAN like ABCDE1234F -> ABCXXXX4F for admin emails/UI. */
export function maskPan(pan?: string | null): string {
  if (!pan) return "—";
  const p = pan.trim().toUpperCase();
  if (p.length < 6) return "••••";
  return `${p.slice(0, 3)}${"X".repeat(Math.max(0, p.length - 5))}${p.slice(-2)}`;
}

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const PIN_REGEX = /^[1-9][0-9]{5}$/;
