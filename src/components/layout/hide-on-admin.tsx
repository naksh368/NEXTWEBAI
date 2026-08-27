"use client";

import { usePathname } from "next/navigation";

/** Hides the public marketing chrome on the admin and agent-dashboard apps. */
export function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  if (pathname?.startsWith("/partner") && pathname !== "/partner-login") return null;
  return <>{children}</>;
}
