import { cn } from "@/lib/utils";

/**
 * Renders the agency's own uploaded logo, fitted into a consistent container
 * (object-contain keeps aspect ratio; supports transparent PNG). Falls back to a
 * branded initials placeholder when no logo has been uploaded. Never shows a
 * generic avatar and never another agency's logo — the id comes from the
 * authenticated agent's own profile.
 */
export function AgencyLogo({
  logoDocumentId,
  agencyName,
  className,
  size = 40,
}: {
  logoDocumentId?: string | null;
  agencyName?: string | null;
  className?: string;
  size?: number;
}) {
  const initials = (agencyName ?? "A")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  if (logoDocumentId) {
    return (
      <span
        className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-surface-border bg-white", className)}
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/agent/documents/${logoDocumentId}`}
          alt={agencyName ? `${agencyName} logo` : "Agency logo"}
          className="h-full w-full object-contain p-0.5"
        />
      </span>
    );
  }
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-lg bg-brand-blueLight text-sm font-extrabold text-brand-blue", className)}
      style={{ width: size, height: size }}
      aria-label={agencyName ? `${agencyName} logo placeholder` : "Agency logo placeholder"}
    >
      {initials || "A"}
    </span>
  );
}
