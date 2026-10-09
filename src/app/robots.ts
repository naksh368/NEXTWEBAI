import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private areas and machine endpoints are never offered to crawlers.
        disallow: ["/admin", "/account", "/api", "/sign-in", "/sign-up", "/checkout", "/quote"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
