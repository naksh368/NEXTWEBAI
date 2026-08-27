// Client-safe module: constants + label helpers shared by the browser forms and
// server routes. Do NOT import node built-ins here (it's bundled for the client).
// The reference generator lives server-side in the register route.

/** Agency business types (spec §17). */
export const BUSINESS_TYPES = [
  { value: "PROPRIETORSHIP", label: "Proprietorship" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "LLP", label: "LLP" },
  { value: "PVT_LTD", label: "Private Limited Company" },
  { value: "OTHER", label: "Other" },
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number]["value"];

export const BUSINESS_TYPE_VALUES = BUSINESS_TYPES.map((b) => b.value);

export function businessTypeLabel(value: string): string {
  return BUSINESS_TYPES.find((b) => b.value === value)?.label ?? value;
}

/** Human-facing application status labels for the applicant + admin. */
export const APPLICATION_STATUS_LABEL: Record<string, string> = {
  PENDING_OTP: "Awaiting email verification",
  SUBMITTED: "Submitted — pending review",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  REJECTED: "Not approved",
};
