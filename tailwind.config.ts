import type { Config } from "tailwindcss";

/**
 * RuledOff 2026 design system.
 * Modern fintech: teal brand, cool slate neutrals, emerald for "ruled off",
 * amber for pending, red for overdue. Light + dark (class strategy).
 * Utilities read CSS variables so light/dark swap without recompiling classes.
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          // DEFAULT is variable-backed so text-brand / bg-brand swap in dark mode.
          DEFAULT: "var(--brand)",
          50: "#f4f7fa",
          100: "#e8eef5",
          200: "#cdd9e8",
          300: "#a7bdd5",
          400: "#6b93bf",
          500: "#1e3a5f",
          600: "#162d4a",
          700: "#12253c",
          800: "#0e1d30",
          900: "#0b1725",
          tint: "var(--brand-tint)",
          "tint-2": "var(--brand-tint-2)",
        },
        // Variable-backed roles so dark mode swaps automatically.
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        line: "var(--border)",
        "line-strong": "var(--border-strong)",
        text: "var(--text)",
        muted: "var(--muted)",
        faint: "var(--faint)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",

        // Legacy names kept so app screens keep compiling; now variable-backed.
        paper: {
          DEFAULT: "var(--bg)",
          deep: "var(--surface-2)",
          sheet: "var(--surface)",
        },
        ink: {
          DEFAULT: "var(--text)",
          soft: "var(--muted)",
          muted: "var(--muted)",
        },
        rule: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        pending: { DEFAULT: "var(--warning)", soft: "var(--warning-tint)" },
        cleared: { DEFAULT: "var(--success)", soft: "var(--success-tint)" },
        brass: { DEFAULT: "var(--brass)", soft: "var(--gold-tint)" },
        gold: { DEFAULT: "var(--gold)", soft: "var(--gold-tint)" },
        site: {
          bg: "var(--bg)",
          paper: "var(--surface-2)",
          ink: "var(--text)",
          secondary: "var(--muted)",
          border: "var(--border)",
          green: "var(--success)",
          red: "var(--danger)",
          gold: "var(--gold)",
          white: "var(--surface)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Inter", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
        editorial: ["var(--font-display)", "Inter", "system-ui", "sans-serif"],
        geist: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sheet: "14px",
        xl2: "20px",
      },
      boxShadow: {
        elev1: "var(--elev-1)",
        elev2: "var(--elev-2)",
        brand: "var(--elev-brand)",
      },
      keyframes: {
        ruleoff: { "0%": { transform: "scaleX(0)" }, "100%": { transform: "scaleX(1)" } },
        checkdraw: { "0%": { "stroke-dashoffset": "24" }, "100%": { "stroke-dashoffset": "0" } },
        fadein: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        ruleoff: "ruleoff 300ms ease-out forwards",
        checkdraw: "checkdraw 260ms ease-out forwards",
        fadein: "fadein 240ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
