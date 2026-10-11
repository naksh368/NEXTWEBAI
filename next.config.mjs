/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    // Remote sample imagery (Unsplash) used for the seed catalogue.
    // Replace/extend with your own CDN in production.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      // Allow admin-imported package images from any HTTPS host (Package Importer).
      { protocol: "https", hostname: "**" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24,
  },
  async headers() {
    // Content Security Policy: only this site's own scripts run (plus Razorpay's
    // checkout when online payment is switched on), the site cannot be framed
    // elsewhere, and forms can only post back here. Images may come from any
    // HTTPS host because package photos are often hosted by suppliers.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com",
      "frame-src 'self' https://www.google.com https://maps.google.com https://api.razorpay.com https://checkout.razorpay.com",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; ");

    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-DNS-Prefetch-Control", value: "on" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://checkout.razorpay.com\")",
      },
      // The dev server needs eval for hot reload; the policy applies to real builds.
      ...(process.env.NODE_ENV === "production" ? [{ key: "Content-Security-Policy", value: csp }] : []),
    ];
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    // Retired pages from the original multi-destination template. Old links
    // land on the Andaman equivalent instead of a dead end.
    return [
      { source: "/travel-guide", destination: "/destinations", permanent: true },
      { source: "/offers", destination: "/packages", permanent: true },
      { source: "/wishlist", destination: "/saved", permanent: true },
    ];
  },
};

export default nextConfig;
