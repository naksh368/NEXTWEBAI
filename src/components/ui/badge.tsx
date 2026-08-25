import { cn } from "@/lib/utils";

type Tone = "blue" | "orange" | "success" | "warning" | "danger" | "neutral" | "navy";

const tones: Record<Tone, string> = {
  blue: "bg-blue-50 text-blue",
  orange: "bg-orange-50 text-orange-700",
  success: "bg-[#E7F5EF] text-success",
  warning: "bg-[#FBF1E0] text-warning",
  danger: "bg-[#FDECEA] text-danger",
  neutral: "bg-surface-muted text-ink-muted",
  navy: "bg-blue-800/8 text-navy",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Status pill mapped from booking / KYC / refund states. */
export type StatusKind =
  | "TICKET ISSUED"
  | "CONFIRMED"
  | "PENDING"
  | "ON HOLD"
  | "CANCELLED"
  | "FAILED"
  | "REFUND INITIATED"
  | "REFUNDED"
  | "KYC PENDING"
  | "KYC APPROVED"
  | "KYC REJECTED"
  | "ACTIVE"
  | "SUSPENDED";

const statusTone: Record<StatusKind, Tone> = {
  "TICKET ISSUED": "success",
  CONFIRMED: "success",
  "KYC APPROVED": "success",
  ACTIVE: "success",
  REFUNDED: "success",
  PENDING: "warning",
  "ON HOLD": "warning",
  "KYC PENDING": "warning",
  "REFUND INITIATED": "blue",
  CANCELLED: "neutral",
  FAILED: "danger",
  "KYC REJECTED": "danger",
  SUSPENDED: "danger",
};

export function StatusBadge({ status }: { status: StatusKind }) {
  const tone = statusTone[status] ?? "neutral";
  const dot: Record<Tone, string> = {
    blue: "bg-blue",
    orange: "bg-orange",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    neutral: "bg-ink-faint",
    navy: "bg-navy",
  };
  return (
    <Badge tone={tone}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dot[tone])} />
      {status}
    </Badge>
  );
}
