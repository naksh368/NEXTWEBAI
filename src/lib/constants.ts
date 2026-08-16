import { z } from "zod";

/**
 * Centralized status vocabularies (Phase 39). SQLite has no native enums, so
 * these are the single source of truth used by Zod validation, the booking
 * state machine, and the UI. Porting to Postgres later can convert these to
 * real enums 1:1.
 */

export const PACKAGE_STATUS = [
  "DRAFT",
  "IN_REVIEW",
  "PUBLISHED",
  "PAUSED",
  "ARCHIVED",
] as const;
export const PackageStatus = z.enum(PACKAGE_STATUS);
export type PackageStatus = z.infer<typeof PackageStatus>;

// Booking lifecycle (Phase 17). PAYMENT_RECEIVED != CONFIRMED.
export const BOOKING_STATUS = [
  "DRAFT",
  "PAYMENT_PENDING",
  "PAYMENT_PROCESSING",
  "PAYMENT_RECEIVED",
  "BOOKING_PROCESSING",
  "SUPPLIER_CONFIRMATION_PENDING",
  "CONFIRMED",
  "MODIFICATION_REQUESTED",
  "CANCELLATION_REQUESTED",
  "CANCELLED",
  "REFUND_PENDING",
  "REFUNDED",
  "FAILED",
  "COMPLETED",
] as const;
export const BookingStatus = z.enum(BOOKING_STATUS);
export type BookingStatus = z.infer<typeof BookingStatus>;

export const PAYMENT_STATUS = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUND_PENDING",
  "REFUNDED",
  "PARTIAL_REFUND",
] as const;
export const PaymentStatus = z.enum(PAYMENT_STATUS);
export type PaymentStatus = z.infer<typeof PaymentStatus>;

export const COMPONENT_STATUS = ["PENDING", "CONFIRMED", "FAILED"] as const;
export const ComponentStatus = z.enum(COMPONENT_STATUS);
export type ComponentStatus = z.infer<typeof ComponentStatus>;

export const OPTION_CATEGORY = [
  "HOTEL",
  "FLIGHT",
  "TRANSFER",
  "ACTIVITY",
  "MEAL",
  "ADDON",
] as const;
export const OptionCategory = z.enum(OPTION_CATEGORY);
export type OptionCategory = z.infer<typeof OptionCategory>;

export const DAY_ITEM_KIND = [
  "FLIGHT",
  "TRANSFER",
  "HOTEL",
  "ACTIVITY",
  "MEAL",
  "FREE_TIME",
  "NOTE",
] as const;

export const SUPPORT_STATUS = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_CUSTOMER",
  "RESOLVED",
  "CLOSED",
] as const;

export const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "OPERATIONS",
  "PACKAGE_MANAGER",
  "FINANCE",
  "SUPPORT",
  "CONTENT_MANAGER",
  "ANALYST",
] as const;

// Human-friendly labels + tones for status badges (UI layer reads these).
export const BOOKING_STATUS_META: Record<
  string,
  { label: string; tone: "neutral" | "info" | "success" | "warning" | "danger" }
> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  PAYMENT_PENDING: { label: "Payment pending", tone: "warning" },
  PAYMENT_PROCESSING: { label: "Processing payment", tone: "info" },
  PAYMENT_RECEIVED: { label: "Payment received", tone: "info" },
  BOOKING_PROCESSING: { label: "Booking in progress", tone: "info" },
  SUPPLIER_CONFIRMATION_PENDING: { label: "Awaiting confirmation", tone: "info" },
  CONFIRMED: { label: "Confirmed", tone: "success" },
  MODIFICATION_REQUESTED: { label: "Modification requested", tone: "warning" },
  CANCELLATION_REQUESTED: { label: "Cancellation requested", tone: "warning" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
  REFUND_PENDING: { label: "Refund pending", tone: "warning" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
  FAILED: { label: "Failed", tone: "danger" },
  COMPLETED: { label: "Completed", tone: "success" },
};

export const CURRENCY = "INR";
export const TAX_RATE = 0.05; // 5% GST on holiday packages (illustrative)

// Document types an admin can attach to a booking (Phase 20).
export const DOCUMENT_TYPES = [
  "BOOKING_CONFIRMATION",
  "E_TICKET",
  "HOTEL_VOUCHER",
  "TRANSFER_VOUCHER",
  "ACTIVITY_VOUCHER",
  "ITINERARY",
  "INVOICE",
  "PASSPORT",
  "PAN_CARD",
  "VISA",
  "OTHER",
] as const;

export const DOCUMENT_TYPE_LABEL: Record<string, string> = {
  BOOKING_CONFIRMATION: "Booking confirmation",
  E_TICKET: "E-ticket",
  HOTEL_VOUCHER: "Hotel voucher",
  TRANSFER_VOUCHER: "Transfer voucher",
  ACTIVITY_VOUCHER: "Activity voucher",
  ITINERARY: "Final itinerary",
  INVOICE: "Invoice",
  PASSPORT: "Passport",
  PAN_CARD: "PAN card",
  VISA: "Visa",
  OTHER: "Document",
};

// ── Notification / event system (Phase 20) ──
// Canonical app events. Each maps to an in-app notification and, per policy,
// a Resend email + MSG91 SMS. Emitted only from real DB state changes.
export const APP_EVENTS = [
  "USER_REGISTERED",
  "PAYMENT_RECEIVED",
  "BOOKING_PROCESSING",
  "BOOKING_CONFIRMED",
  "DOCUMENT_PUBLISHED",
  "ITINERARY_READY",
  "BOOKING_CANCELLED",
  "REFUND_PROCESSED",
] as const;
export type AppEvent = (typeof APP_EVENTS)[number];

// Provider delivery outcomes (never claim DELIVERED on mere acceptance).
export const MESSAGE_STATUS = ["QUEUED", "SENT", "FAILED", "SKIPPED"] as const;

// Per-document/requirement status vocabulary (progressive document system).
// "VERIFIED" is only ever set by an authorized action — never auto-implied.
export const DOCUMENT_STATUS = [
  "NOT_REQUIRED",
  "REQUIRED",
  "MISSING",
  "UPLOADED",
  "VALIDATING",
  "VERIFIED",
  "REJECTED",
  "EXPIRED",
  "EXPIRING_SOON",
] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUS)[number];
