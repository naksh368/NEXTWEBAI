import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SmartImage } from "@/components/ui/smart-image";
import { cn } from "@/lib/utils";

/**
 * Shared header band for interior pages. With `image` it becomes a photographic
 * banner with a legibility scrim; without one it falls back to a light ocean
 * wash so a page is never blocked on artwork being uploaded.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
  image,
  imageAlt,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs: { label: string; href?: string }[];
  image?: string | null;
  imageAlt?: string;
  children?: React.ReactNode;
}) {
  const photo = Boolean(image);

  return (
    <header className={cn("relative isolate overflow-hidden", photo ? "bg-brand-navy" : "ocean-wash border-b border-surface-border bg-white")}>
      {photo && (
        <>
          <div className="absolute inset-0">
            <SmartImage src={image} alt={imageAlt ?? ""} sizes="100vw" priority className="h-full" />
          </div>
          <div className="absolute inset-0 photo-scrim" aria-hidden />
        </>
      )}

      <Container className={cn("relative", photo ? "pb-12 pt-6 sm:pb-16 sm:pt-8" : "pb-10 pt-6 sm:pb-14")}>
        <div className={photo ? "[&_*]:text-white/70 [&_a:hover]:!text-brand-turquoise [&_span[aria-current]]:!text-white" : ""}>
          <Breadcrumbs items={breadcrumbs} />
        </div>

        <div className="mt-6 max-w-3xl">
          {eyebrow && (
            <p className={cn("text-xs font-bold uppercase tracking-[0.18em]", photo ? "text-brand-turquoise" : "text-brand-turquoiseDark")}>
              {eyebrow}
            </p>
          )}
          <h1 className={cn("mt-2.5 text-[2rem] sm:text-5xl", photo && "text-white")}>{title}</h1>
          {description && (
            <p className={cn("mt-4 text-base leading-relaxed sm:text-lg", photo ? "text-white/85" : "text-ink-muted")}>
              {description}
            </p>
          )}
          {children && <div className="mt-6">{children}</div>}
        </div>
      </Container>
    </header>
  );
}
