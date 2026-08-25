import type { Config } from "tailwindcss";

/**
 * ExpertzTrip design system.
 * B2B flight platform · royal blue primary · strategic orange accents.
 * Palette derived directly from the ExpertzTrip logo.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
    "./src/data/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.25rem", lg: "2rem" },
      screens: { "2xl": "1240px" },
    },
    extend: {
      colors: {
        // Primary Blue
        blue: {
          DEFAULT: "#1455D9",
          50: "#F4F8FF",
          100: "#E4EDFC",
          200: "#C6D9F8",
          300: "#93B4F0",
          400: "#4E82E6",
          500: "#1455D9",
          600: "#1145B3",
          700: "#0E378F",
          800: "#0B1B4A", // Deep Navy
          900: "#081233",
        },
        navy: "#0B1B4A",
        orange: {
          DEFAULT: "#FF6B00",
          50: "#FFF3EA",
          100: "#FFE3CC",
          400: "#FF8A33",
          500: "#FF6B00",
          600: "#E85F00",
          700: "#C24E00",
        },
        ink: {
          DEFAULT: "#1A2340",
          muted: "#5A6480",
          faint: "#8A93AD",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F4F8FF", // Very Light Blue
          border: "#DCE6F7", // Soft Border
        },
        success: "#15926C",
        warning: "#C97A00",
        danger: "#D92D20",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Nunito", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,27,74,0.04), 0 6px 20px rgba(11,27,74,0.06)",
        cardHover: "0 2px 6px rgba(11,27,74,0.08), 0 14px 36px rgba(11,27,74,0.12)",
        pop: "0 12px 40px rgba(11,27,74,0.16)",
        sticky: "0 -2px 16px rgba(11,27,74,0.08)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-fast": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out both",
        "fade-in-fast": "fade-in-fast 0.3s ease-out both",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
