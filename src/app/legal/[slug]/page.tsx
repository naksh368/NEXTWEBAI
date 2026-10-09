import { permanentRedirect, notFound } from "next/navigation";

/**
 * Legacy policy URLs.
 *
 * The policies now live at /privacy-policy and /terms. These older paths are
 * permanently redirected so any existing link or bookmark still works and the
 * ranking follows the new URL.
 */
const MOVED: Record<string, string> = {
  terms: "/terms",
  privacy: "/privacy-policy",
  "privacy-policy": "/privacy-policy",
  cancellation: "/terms#cancellation",
};

export function generateStaticParams() {
  return Object.keys(MOVED).map((slug) => ({ slug }));
}

export default async function LegacyLegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const target = MOVED[slug];
  if (!target) notFound();
  permanentRedirect(target);
}
