import type { Config } from "tailwindcss";

const withVar = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1rem", md: "2rem" }, screens: { "2xl": "1280px" } },
    extend: {
      colors: {
        bg: withVar("bg"),
        surface: withVar("surface"),
        elevated: withVar("elevated"),
        fg: withVar("fg"),
        muted: withVar("muted"),
        line: withVar("line"),
        gold: { DEFAULT: withVar("gold"), soft: withVar("gold-soft") },
        palm: withVar("palm"),
        clay: withVar("clay"),
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-body)", "serif"],
      },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "none" } },
        drift: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
      },
      animation: {
        "fade-up": "fade-up .7s cubic-bezier(.2,.7,.2,1) both",
        drift: "drift 40s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
