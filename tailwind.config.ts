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
        // App palette, kept in lockstep with the marketing `site` scale below
        // and with the CSS custom properties in globals.css.
        paper: {
          DEFAULT: "#F7F5F1", // app background — warm paper
          deep: "#ECE7DE", // subtle inset / hover on paper
          sheet: "#FFFFFF", // a raised "sheet"
        },
        ink: {
          DEFAULT: "#111315", // primary text
          soft: "#6F6E6957", // muted (uses alpha for quiet secondary text)
          muted: "#6F6E69", // secondary text, opaque
        },
        rule: {
          DEFAULT: "#D9D4CA", // ruled lines — borders/dividers
          strong: "#C6C0B4", // heavier rule where emphasis is needed
        },
        pending: {
          DEFAULT: "#B94B3D", // accountant's red ink — OUTSTANDING/OVERDUE ONLY
          soft: "#B94B3D1A",
        },
        cleared: {
          DEFAULT: "#0E8A5F", // ledger green — completed/reconciled
          soft: "#0E8A5F14",
        },
        brass: {
          DEFAULT: "#C59B3A", // gold accent — sparingly
        },
        // Marketing site: warmer editorial palette (echoes the app, bolder).
        site: {
          bg: "#F7F5F1",
          paper: "#ECE7DE",
          ink: "#111315",
          secondary: "#6F6E69",
          border: "#D9D4CA",
          green: "#0E8A5F",
          red: "#B94B3D",
          gold: "#C59B3A",
          white: "#FFFFFF",
        },
      },
      fontFamily: {
        // Titles use the same editorial serif as the marketing site.
        display: ["var(--font-newsreader)", "Georgia", "Times New Roman", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
        // Marketing: literary serif display + tiny mono labels.
        editorial: ["var(--font-newsreader)", "Georgia", "Times New Roman", "serif"],
        // Geist Mono is unavailable in this Next version; fall back to the shared Plex Mono.
        geist: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sheet: "14px", // softened toward a modern SaaS look
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
