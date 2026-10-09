"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { BRAND_SHORT } from "@/lib/brand";

/**
 * next/image wrapper with a branded fallback. Uses `fill`, so the
 * parent must set an aspect ratio (avoids layout shift). If the remote image
 * fails to load/optimize, we render a subtle brand gradient instead of a broken
 * image — the page never looks broken.
 */
export function SmartImage({
  src,
  alt,
  sizes = "100vw",
  priority,
  className,
  imgClassName,
}: {
  src: string | null | undefined;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
}) {
  const [failed, setFailed] = useState(!src);

  return (
    <div className={cn("aspect-frame h-full w-full", className)}>
      {failed ? (
        <div
          aria-hidden
          className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-blueLight via-white to-brand-turquoiseLight"
        >
          <span className="px-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-brand-blue/45">{BRAND_SHORT}</span>
        </div>
      ) : (
        <Image
          src={src as string}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          className={cn("object-cover", imgClassName)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
