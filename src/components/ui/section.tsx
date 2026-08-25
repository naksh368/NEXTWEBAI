import { cn } from "@/lib/utils";

export function Eyebrow({
  children,
  tone = "blue",
  className,
}: {
  children: React.ReactNode;
  tone?: "blue" | "orange";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "eyebrow",
        tone === "blue" ? "text-blue" : "text-orange",
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "blue" ? "bg-blue" : "bg-orange",
        )}
      />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  eyebrowTone = "blue",
  title,
  subtitle,
  align = "center",
  className,
}: {
  eyebrow?: string;
  eyebrowTone?: "blue" | "orange";
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl",
        className,
      )}
    >
      {eyebrow && (
        <div className={cn("mb-3", align === "center" && "flex justify-center")}>
          <Eyebrow tone={eyebrowTone}>{eyebrow}</Eyebrow>
        </div>
      )}
      <h2 className="text-[1.75rem] leading-tight sm:text-[2.1rem]">{title}</h2>
      {subtitle && (
        <p className="mt-3 text-[0.98rem] leading-relaxed text-ink-muted">{subtitle}</p>
      )}
    </div>
  );
}
