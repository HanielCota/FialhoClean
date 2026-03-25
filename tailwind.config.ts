import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#111111",
        sidebar: "#0c0c0c",
        card: "#1b1b1b",
        "card-hover": "#222222",
        "card-elevated": "#292929",
        accent: "#ffffff",
        "accent-hover": "#e8e8e8",
        "on-accent": "#111111",
        text: "#f2f2f2",
        "text-muted": "#888888",
        "text-tertiary": "#484848",
        green: "#34c759",
        orange: "#ff9f0a",
        red: "#ff453a",
        blue: "#0a84ff",
        // Aliases kept for backward compatibility
        error: "#ff453a",
        success: "#34c759",
        warning: "#ff9f0a",
      },
      fontFamily: {
        sans: ["Geist", "sans-serif"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [],
} satisfies Config;
