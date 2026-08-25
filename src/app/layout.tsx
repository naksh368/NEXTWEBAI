import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ExpertzTrip — India's Smarter B2B Flight Platform",
    template: "%s · ExpertzTrip",
  },
  description:
    "ExpertzTrip is a B2B flight booking platform for travel agents in India. Powerful tools, competitive fares and smarter business solutions built for travel agents.",
  keywords: [
    "B2B flight booking",
    "travel agents India",
    "ExpertzTrip",
    "ExpertzWallet",
    "flight platform for agents",
  ],
  metadataBase: new URL("https://expertztrip.example"),
};

export const viewport: Viewport = {
  themeColor: "#1455D9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="min-h-screen bg-white">{children}</body>
    </html>
  );
}
