import type { Config } from "tailwindcss";

/**
 * JST Andaman Travels design system.
 *
 * Deep ocean navy for structure and typography, royal ocean blue for primary
 * actions, turquoise for small highlights, coral orange reserved for booking
 * and enquiry CTAs. White foundation, soft blue-grey surfaces, restrained
 * shadows — premium island travel, not a template.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", lg: "2rem" },
      screens: { "2xl": "1200px" },
    },
    extend: {
      colors: {
        brand: {
          // Royal Ocean Blue — primary actions, links, active states.
          blue: "#087EBA",
          blueDark: "#066A9E",
          blueLight: "#E8F3FA",
          // Deep Ocean Navy — headings, structure, footer.
          navy: "#102B4E",
          navyDark: "#0A1E38",
          navyLight: "#E9EEF5",
          // Turquoise — small highlights, eyebrows, accents on imagery.
          turquoise: "#18B8CE",
          turquoiseDark: "#119BAF",
          turquoiseLight: "#E4F7FA",
          // Coral Orange — booking and enquiry CTAs only.
          orange: "#F26535",
          orangeDark: "#D84E1F",
          orangeLight: "#FEEFE9",
        },
        ink: {
          DEFAULT: "#172B45", // primary text
          muted: "#63748A",   // secondary text
          faint: "#93A2B5",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F6F9FC",   // soft background
          border: "#E2EAF1",
        },
        success: "#17886A",
        warning: "#C2740B",
        danger: "#D23B3B",
      },
      fontFamily: {
        // Nunito Sans across the entire application (next/font, self-hosted).
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,43,78,0.04), 0 8px 24px rgba(16,43,78,0.06)",
        cardHover: "0 2px 4px rgba(16,43,78,0.06), 0 18px 44px rgba(16,43,78,0.11)",
        sticky: "0 -2px 12px rgba(16,43,78,0.08)",
        lift: "0 24px 60px -24px rgba(16,43,78,0.35)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-slow": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out both",
        "fade-in-slow": "fade-in-slow 0.6s cubic-bezier(0.22,1,0.36,1) both",
        shimmer: "shimmer 1.4s infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
