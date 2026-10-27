import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: {
          950: "#070910",
          900: "#0C1020",
          800: "#12172A",
          700: "#1A2036",
        },
        accent: {
          DEFAULT: "#8B5CF6",
          soft: "rgba(139,92,246,0.16)",
        },
        neocyan: "#22D3EE",
        romance: "#F472B6",
        ink: {
          DEFAULT: "#F4F5FA",
          muted: "#9CA3B8",
        },
      },
      fontFamily: {
        sans: [
          "Noto Sans Thai Variable",
          "Noto Sans Thai",
          "IBM Plex Sans Thai",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
