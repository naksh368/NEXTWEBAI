import type { Config } from "tailwindcss";

/**
 * ExpertzTrip design system (Phase 4).
 * White/light foundation · blue/navy typography · orange accent.
 * Restrained palette — no neon, minimal gradients.
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
          // Primary royal blue (logo "expertz")
          blue: "#2340D9",
          blueDark: "#1B33AE",
          blueLight: "#EEF1FE",
          // Headings/titles are near-black (not blue). Only the tagline + accents use brand blue.
          navy: "#16171C",
          // Orange accent (logo "trip")
          orange: "#FF6A1A",
          orangeDark: "#E85A0C",
          orangeLight: "#FFF2EA",
        },
        ink: {
          DEFAULT: "#1C1E26", // neutral dark for body text (not blue)
          muted: "#565B6B",
          faint: "#8A8F9E",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F7F8FB",
          border: "#E7EAF1",
        },
        success: "#16A34A",
        warning: "#D97706",
        danger: "#DC2626",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,27,69,0.04), 0 8px 24px rgba(11,27,69,0.06)",
        cardHover: "0 2px 4px rgba(11,27,69,0.06), 0 16px 40px rgba(11,27,69,0.10)",
        sticky: "0 -2px 12px rgba(11,27,69,0.08)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out both",
        shimmer: "shimmer 1.4s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
