import type { Config } from "tailwindcss";

export default {
  content: ["./popup/**/*.{tsx,ts,html}"],
  theme: {
    extend: {
      colors: {
        uxlens: {
          bg: "#0a0a0a",
          card: "#141414",
          border: "#1e1e1e",
          accent: "#4C2CFF",
          "accent-hover": "#5e3fff",
          text: "#fafafa",
          muted: "#737373",
          success: "#22c55e",
          warning: "#f59e0b",
          error: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
