"use client";

import { usePathname } from "next/navigation";

/** Routes that render their own full-page chrome (no global header/footer/promo). */
export function isChromelessRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith("/admin") ||
    pathname === "/login" ||
    pathname === "/register"
  );
}

/** Hides the public site chrome (header/footer) on admin + standalone auth pages. */
export function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isChromelessRoute(pathname)) return null;
  return <>{children}</>;
}
