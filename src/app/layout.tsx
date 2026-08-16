import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AiFab } from "@/components/layout/ai-fab";
import { HideOnAdmin } from "@/components/layout/hide-on-admin";

// ExpertzTrip brand font — Nunito (the rounded wordmark font used in the logo),
// self-hosted at build (no runtime font requests, display:swap to avoid layout
// shift). Used across the entire app so all text matches the logo.
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ExpertzTrip — Your holiday, your way",
    template: "%s · ExpertzTrip",
  },
  description:
    "Real holiday packages with clear pricing and expert support. Customize any trip to Dubai, Bali, Maldives, Thailand, Singapore and Europe — and book securely.",
  keywords: ["holiday packages", "Dubai", "Bali", "Maldives", "Thailand", "Singapore", "Europe", "travel", "ExpertzTrip"],
  openGraph: {
    type: "website",
    siteName: "ExpertzTrip",
    title: "ExpertzTrip — Your holiday, your way",
    description: "Real holiday packages. Clear pricing. Expert support.",
    url: siteUrl,
  },
  twitter: { card: "summary_large_image", title: "ExpertzTrip", description: "Real holiday packages. Clear pricing. Expert support." },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#2340d9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-blue focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <HideOnAdmin><Header /></HideOnAdmin>
        <main id="main" className="flex-1">
          {children}
        </main>
        <HideOnAdmin><Footer /></HideOnAdmin>
        <HideOnAdmin><AiFab /></HideOnAdmin>
      </body>
    </html>
  );
}
