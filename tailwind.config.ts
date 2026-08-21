import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        paper: {
          50: "#ffffff",
          100: "#fdfbfa", // Base background from Contour/DESIGN.md
          200: "#f6f2e8",
          300: "#ece5d8",
          400: "#dcd2c0",
        },
        ink: {
          900: "#27251e", // Primary text from Contour/DESIGN.md
          950: "#1a1813",
          800: "#3d3a31",
          600: "#6a6860",
          400: "#9e9a90",
        },
        contour: {
          red: "#8b1e1e",    // Primary Burgundy Accent from Contour/DESIGN.md
          dark: "#271a00",   // Dark Accent
          amber: "#e57a1a",  // Banya Amber
          emerald: "#10b981",// Confirmed / Sold
          cobalt: "#3b82f6", // Rented
          yellow: "#f59e0b", // For Rent
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        border: "var(--border)",
      },
      borderRadius: {
        "2xl": "16px",
        xl: "12px",
        lg: "8px",
        md: "6px",
        sm: "4px",
      },
      boxShadow: {
        subtle: "rgba(0, 0, 0, 0.08) 0px 1px 2px 0px",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        floating: "0 10px 25px -5px rgba(39, 37, 30, 0.1), 0 8px 10px -6px rgba(39, 37, 30, 0.1)",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        serif: ["Playfair Display", "Georgia", "serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
