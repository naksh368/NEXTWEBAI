import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { getSiteUrl } from "@/lib/utils";

// ExpertzTrip brand font — Plus Jakarta Sans: a clean, modern, slightly-rounded
// premium sans that suits a corporate B2B travel-tech product. Self-hosted at
// build (no runtime font requests), display:swap to avoid layout shift. Sets the
// --font-sans variable consumed across the whole app. (Deliberately not Nunito.)
const jakarta = Plus_Jakarta_Sans({
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
    "Powerful tools, competitive fares and a simpler booking experience built for travel agents. Register your agency, add prepaid balance and book flights.",
  keywords: ["B2B travel", "travel agent platform", "flight booking", "travel agency", "ExpertzTrip", "India"],
  openGraph: {
    type: "website",
    siteName: "ExpertzTrip",
    title: "ExpertzTrip — India's Smarter B2B Travel Platform",
    description: "Find better flights. Earn more. Grow your business.",
    url: siteUrl,
  },
  twitter: { card: "summary_large_image", title: "ExpertzTrip", description: "India's smarter B2B travel platform." },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#2340d9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="flex min-h-screen flex-col bg-surface">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-blue focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
