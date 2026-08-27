import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { PromoBar } from "@/components/layout/promo-bar";
import { HeaderWrapper } from "@/components/layout/header-wrapper";
import { Footer } from "@/components/layout/footer";
import { HideOnAdmin } from "@/components/layout/hide-on-admin";
import { getSiteUrl } from "@/lib/utils";

// ExpertzTrip brand font — Plus Jakarta Sans, a modern premium geometric-humanist
// sans that matches the clean B2B reference. Self-hosted at build (no runtime font
// requests, display:swap to avoid layout shift). Used across the entire app.
const sans = Plus_Jakarta_Sans({
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
    "Powerful tools, smarter booking workflows and transparent business tools built for travel agents. Search and book flights, manage a prepaid booking balance, track bookings and grow your agency.",
  keywords: ["B2B travel platform", "travel agents", "flight booking", "ExpertzTrip", "agency portal", "prepaid wallet", "India travel agents"],
  openGraph: {
    type: "website",
    siteName: "ExpertzTrip",
    title: "ExpertzTrip — India's Smarter B2B Travel Platform",
    description: "Find better flights. Earn more. Grow your business — built for travel agents.",
    url: siteUrl,
  },
  twitter: { card: "summary_large_image", title: "ExpertzTrip", description: "India's smarter B2B travel platform for travel agents." },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#2340d9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-blue focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <PromoBar />
        <HideOnAdmin><HeaderWrapper /></HideOnAdmin>
        <main id="main" className="flex-1">
          {children}
        </main>
        <HideOnAdmin><Footer /></HideOnAdmin>
      </body>
    </html>
  );
}
