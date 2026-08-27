import { z } from "zod";
import { PASSWORD_POLICY, PAN_REGEX, GSTIN_REGEX, PIN_REGEX } from "./agent-constants";

export const accountSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name.").max(120),
    mobile: z.string().trim().regex(/^\+?[0-9\s-]{8,15}$/, "Enter a valid mobile number."),
    email: z.string().trim().toLowerCase().email("Enter a valid email address."),
    password: z.string().regex(PASSWORD_POLICY.regex, PASSWORD_POLICY.hint),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const agencySchema = z.object({
  agencyName: z.string().trim().min(2, "Enter the agency name.").max(160),
  businessType: z.enum(["PROPRIETORSHIP", "PARTNERSHIP", "LLP", "PRIVATE_LIMITED", "OTHER"]),
  officeAddress: z.string().trim().min(5, "Enter the office address.").max(400),
  country: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2, "Enter the state.").max(80),
  city: z.string().trim().min(2, "Enter the city.").max(80),
  pinCode: z.string().trim().regex(PIN_REGEX, "Enter a valid 6-digit PIN code."),
  // Business info (step 4)
  pan: z.string().trim().toUpperCase().regex(PAN_REGEX, "Enter a valid PAN (e.g. ABCDE1234F)."),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || GSTIN_REGEX.test(v), "Enter a valid 15-character GSTIN."),
  udyam: z.string().trim().optional().transform((v) => (v ? v : undefined)),
  otherRegistration: z.string().trim().optional().transform((v) => (v ? v : undefined)),
});

export type AccountInput = z.infer<typeof accountSchema>;
export type AgencyInput = z.infer<typeof agencySchema>;

// Upload validation
export const ALLOWED_DOC_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
export const ALLOWED_LOGO_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
export const MAX_DOC_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_LOGO_BYTES = 3 * 1024 * 1024; // 3 MB

/** Reject dangerous filenames/extensions; only allow known-safe types. */
export function validateUpload(
  file: { name: string; type: string; size: number },
  kind: "DOC" | "LOGO"
): { ok: true } | { ok: false; error: string } {
  const allowed = kind === "LOGO" ? ALLOWED_LOGO_MIME : ALLOWED_DOC_MIME;
  const max = kind === "LOGO" ? MAX_LOGO_BYTES : MAX_DOC_BYTES;
  if (!file.size) return { ok: false, error: "The file is empty." };
  if (file.size > max) return { ok: false, error: `File is too large (max ${Math.round(max / 1024 / 1024)} MB).` };
  if (!allowed[file.type]) return { ok: false, error: `Unsupported file type. Allowed: ${Object.values(allowed).join(", ").toUpperCase()}.` };
  const name = file.name.toLowerCase();
  if (/\.(exe|sh|bat|cmd|js|php|jar|com|scr|msi|dll|html?)$/i.test(name)) {
    return { ok: false, error: "Executable and script files are not allowed." };
  }
  return { ok: true };
}
