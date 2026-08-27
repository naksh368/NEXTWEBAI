import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { HeaderWrapper } from "@/components/layout/header-wrapper";
import { Footer } from "@/components/layout/footer";
import { HideOnAdmin } from "@/components/layout/hide-on-admin";
import { getSiteUrl } from "@/lib/utils";

// ExpertzTrip brand font — Poppins: a clean, rounded, geometric sans that
// matches the reference typography (friendly + premium). Self-hosted at build
// (no runtime font requests; display:swap to avoid layout shift). Used across
// the entire app.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ExpertzTrip — India's Smarter B2B Travel Platform",
    template: "%s · ExpertzTrip",
  },
  description:
    "Find better flights, earn more and grow your agency. Powerful tools, competitive fares, a prepaid wallet and a simpler booking experience built for India's travel agents.",
  keywords: ["B2B travel", "travel agent platform", "flight booking for agents", "travel agency", "prepaid wallet", "India", "ExpertzTrip"],
  openGraph: {
    type: "website",
    siteName: "ExpertzTrip",
    title: "ExpertzTrip — India's Smarter B2B Travel Platform",
    description: "Find better flights. Earn more. Grow your business. Built for travel agents.",
    url: siteUrl,
  },
  twitter: { card: "summary_large_image", title: "ExpertzTrip", description: "India's smarter B2B travel platform for agents." },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#2340d9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-blue focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <HideOnAdmin><HeaderWrapper /></HideOnAdmin>
        <main id="main" className="flex-1">
          {children}
        </main>
        <HideOnAdmin><Footer /></HideOnAdmin>
      </body>
    </html>
  );
}
