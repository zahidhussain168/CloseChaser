# RuledOff — DESIGN.md ("Ledger, elevated")

Direction locked after repeated feedback that the UI was too plain. We keep the
Ledger brand DNA but move from "quiet minimalism" to a **premium, animated SaaS**
with depth and motion. Interaction tier: **L3** (immersive).

## 1. Visual theme & atmosphere
Warm ledger paper brought to life. Calm and trustworthy, but alive: ambient ruled
lines drift in the hero, ledger sheets assemble on load, numbers tick up, and the
accountant's double-rule remains the signature "done" gesture. Depth is allowed
now — soft ink-tinted elevation, layered sheets, a cursor spotlight.

## 2. Color palette & roles
```
--paper #F2F5EF (242,245,239)   app background
--paper-deep #E9EEE4            insets, hover
--paper-sheet #FBFCFA           raised sheets
--ink #232A25 (35,42,37)        primary text, dark band
--ink-muted #5E6A5F             secondary text
--rule #C9D6C6                  ruled lines
--rule-strong #AEBFAA           emphasis rules
--pending #B3402E (179,64,46)   outstanding / overdue ONLY
--pending-bright #CF5B45        red ink on dark
--cleared #2F6B4F (47,107,79)   completed / reconciled
--brass #A88B4C (168,139,76)    marks only (never text on paper)
```
Depth token: `--elev-1: 0 8px 24px rgba(35,42,37,0.08)`, `--elev-2: 0 18px 48px rgba(35,42,37,0.12)`.

## 3. Typography
Display **Fraunces**, body **Inter**, data **IBM Plex Mono** (tabular). Locked scale:
display 88 / h2 48 / h3 24 / body-lg 18 / body 16 / small 14 / mono-label 13.
Ceremony line 64 (single exception). Numbers, amounts, dates, counts always mono.

## 4. Components
- **Sheet card**: paper-sheet, 1px rule border, radius 6, `--elev-1`; hover raises to `--elev-2` (no translate) + cursor spotlight.
- **Button primary**: ink fill, min 44px, press `scale(0.98)` + darken 100ms, magnetic on hover (desktop, hover-capable only).
- **Stat card**: mono counter that ticks up on view + thin ink-fill bar.
- **Status pill**: red = open, green = ruled off, muted = idle.

## 5. Layout
Container max-w 6xl. Section spacing tokens `--section-y 128 / --section-y-hero 160` (mobile 80/96). Dashboard: summary stat row + ruled client table.

## 6. Depth & elevation
`--elev-1` default sheets, `--elev-2` on hover / hero stack top sheet. Dark band flat. Everything else on paper may cast one soft ink shadow. No stacked shadows, no glow except the faint hero cursor spotlight.

## 7. Animation (L3)
- **Ambient hero background**: canvas ruled lines + drifting brass posting ticks + cursor spotlight. Paused when offscreen. Reduced-motion → static.
- **Hero H1**: clip-path mask reveal on load.
- **Hero ledger stack**: three sheets fan in from a pile; top sheet rows rule off in sequence (80ms).
- **Counters**: numbers tick up on scroll-in (mono odometer).
- **Sections**: H2 blur+rise on scroll; cards spotlight on hover; lists stagger 40ms.
- **CTA**: magnetic pull on hover.
- Shared easing `cubic-bezier(0.22,1,0.36,1)`; every effect has `prefers-reduced-motion` fallback; transform/opacity/clip-path only.

## 8. Do / Don't
DO: keep ledger palette + mono numerals + double-rule; add soft ink elevation; animate with restraint-but-presence; pause offscreen canvas; reduced-motion everywhere.
DON'T: gradients as fill, purple, glassmorphism, blobs, stacked shadows, brass text on paper, emoji icons, more than one canvas scene, blur on moving elements, animations that cause layout shift, red used for anything but outstanding.

## 9. Responsive
Breakpoints 375 / 768 / 1024 / 1440. Touch targets ≥44px. Hero stack + dashboard table reflow to single column on mobile. Canvas ambient downgrades to a static ruled texture under 768px and under reduced-motion.
