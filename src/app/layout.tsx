import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { PromoBar } from "@/components/layout/promo-bar";
import { HeaderWrapper } from "@/components/layout/header-wrapper";
import { Footer } from "@/components/layout/footer";
import { FloatingActionsWrapper } from "@/components/layout/floating-actions-wrapper";
import { HideOnAdmin } from "@/components/layout/hide-on-admin";
import { getSiteUrl } from "@/lib/utils";
import { getSiteSettings } from "@/lib/site-settings";
import { BRAND_COLORS } from "@/lib/brand";

/**
 * Nunito Sans across the whole application, self-hosted by next/font at build
 * time (no runtime font request, no layout shift). Weight scale: 800 display,
 * 700 section titles, 600 UI/buttons, 400 body.
 */
const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const siteUrl = getSiteUrl();

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    metadataBase: new URL(siteUrl),
    title: { default: s.seoTitle, template: `%s · ${s.brandName}` },
    description: s.seoDescription,
    keywords: s.seoKeywords,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: s.brandName,
      title: s.seoTitle,
      description: s.seoDescription,
      url: siteUrl,
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title: s.seoTitle,
      description: s.seoDescription,
    },
    robots: { index: true, follow: true },
    icons: { icon: s.logoUrl || "/brand/jst-andaman-travels-logo.webp" },
  };
}

export const viewport: Viewport = {
  themeColor: BRAND_COLORS.navy,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunitoSans.variable}>
      <body className="flex min-h-screen flex-col overflow-x-hidden">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-blue focus:px-4 focus:py-2 focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <HideOnAdmin><PromoBar /></HideOnAdmin>
        <HideOnAdmin><HeaderWrapper /></HideOnAdmin>
        <main id="main" className="flex-1">
          {children}
        </main>
        <HideOnAdmin><Footer /></HideOnAdmin>
        <HideOnAdmin><FloatingActionsWrapper /></HideOnAdmin>
      </body>
    </html>
  );
}
