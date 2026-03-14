import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Helvetica Neue", "Arial", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#e6fff5",
          100: "#b3ffe0",
          200: "#80ffcc",
          300: "#4dffb8",
          400: "#1affa3",
          500: "#00E59B",
          600: "#00B87A",
          700: "#008c5d",
          800: "#005f3f",
          900: "#003322",
        },
        accent: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3B82F6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        dark: {
          DEFAULT: "#0B0E14",
          50: "#1a1f2e",
          100: "#151a26",
          200: "#10141d",
          300: "#0B0E14",
          400: "#070a0f",
          500: "#03050a",
        },
        muted: {
          DEFAULT: "#5A6578",
          light: "#8892A4",
        },
        surface: {
          DEFAULT: "#F1F5F9",
          dark: "#111827",
        },
      },
    },
  },
  plugins: [],
};

export default config;
