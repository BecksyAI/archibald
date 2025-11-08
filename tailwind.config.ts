import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark mode colors (current - peaty orange look)
        "peat-smoke": "#1a1a18",
        "aged-oak": "#2c2c2a",
        "amber-dram": "#d97706",
        parchment: "#e5e7eb",
        limestone: "#6b7280",
        verdant: "#4ade80",
        crimson: "#f87171",
        // Light mode colors
        "light-bg": "#f5f5f0",
        "light-surface": "#ffffff",
        "light-text": "#1a1a18",
        "light-text-secondary": "#6b7280",
        "light-border": "#e5e7eb",
      },
      fontFamily: {
        serif: ["Lora", "serif"],
        sans: ["Inter", "sans-serif"],
      },
      animation: {
        "pulse-amber": "pulse-amber 2s ease-in-out infinite",
      },
      keyframes: {
        "pulse-amber": {
          "0%, 100%": {
            opacity: "0.4",
          },
          "50%": {
            opacity: "1",
          },
        },
      },
      boxShadow: {
        luxury: "0 10px 25px -5px rgba(217, 119, 6, 0.1), 0 10px 10px -5px rgba(217, 119, 6, 0.04)",
      },
    },
  },
  plugins: [],
  darkMode: 'class', // Enable class-based dark mode
} satisfies Config;
