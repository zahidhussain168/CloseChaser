import type { Config } from "tailwindcss";

/**
 * "The Ledger" design system.
 * Palette and type are derived from CLAUDE.md — this must NOT look like a
 * generic SaaS template. Colors are the accountant's ledger: pale-green paper,
 * green-black ink, ruled lines, red ink for outstanding, deep green for cleared,
 * and a sparingly-used brass accent.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#F2F5EF", // app background — pale ledger-green paper
          deep: "#E9EEE4", // subtle inset / hover on paper
          sheet: "#FBFCFA", // a raised "sheet" (slightly whiter than paper)
        },
        ink: {
          DEFAULT: "#232A25", // primary text — near-black green ink
          soft: "#55605457", // muted (uses alpha for quiet secondary text)
          muted: "#5E6A5F", // secondary text, opaque
        },
        rule: {
          DEFAULT: "#C9D6C6", // ruled lines — borders/dividers
          strong: "#AEBFAA", // heavier rule where emphasis is needed
        },
        pending: {
          DEFAULT: "#B3402E", // accountant's red ink — OUTSTANDING/OVERDUE ONLY
          soft: "#B3402E1A",
        },
        cleared: {
          DEFAULT: "#2F6B4F", // deep ledger green — completed/reconciled
          soft: "#2F6B4F14",
        },
        brass: {
          DEFAULT: "#A88B4C", // brass paper-fastener accent — sparingly
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sheet: "6px", // max radius per brief
      },
      fontVariantNumeric: {
        tabular: "tabular-nums",
      },
      keyframes: {
        // The signature "ruled off" double-rule, drawn left-to-right.
        ruleoff: {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        checkdraw: {
          "0%": { "stroke-dashoffset": "24" },
          "100%": { "stroke-dashoffset": "0" },
        },
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
