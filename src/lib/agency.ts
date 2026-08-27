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

/** KYC document types an agency uploads (spec §18). `required` drives progress. */
export const KYC_DOC_TYPES = [
  { kind: "IDENTITY", label: "Identity document", hint: "Aadhaar / Passport / Voter ID of the proprietor or signatory", required: true },
  { kind: "PAN", label: "PAN document", hint: "Agency or proprietor PAN card", required: true },
  { kind: "GST", label: "GST certificate", hint: "Where applicable", required: false },
  { kind: "BUSINESS_PROOF", label: "Business / address proof", hint: "Registration, Udyam, utility bill or lease", required: true },
  { kind: "OTHER", label: "Other document", hint: "Anything else that supports your application", required: false },
] as const;

export type KycDocKind = (typeof KYC_DOC_TYPES)[number]["kind"];
export const KYC_DOC_KINDS = KYC_DOC_TYPES.map((d) => d.kind);
export const REQUIRED_KYC_KINDS = KYC_DOC_TYPES.filter((d) => d.required).map((d) => d.kind);

/** Human-facing application status labels for the applicant + admin. */
export const APPLICATION_STATUS_LABEL: Record<string, string> = {
  PENDING_OTP: "Awaiting email verification",
  SUBMITTED: "Submitted — pending review",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  REJECTED: "Not approved",
};
