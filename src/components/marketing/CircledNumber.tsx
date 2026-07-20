/**
 * A step number inside a hand-drawn brass circle. Rendered entirely as an SVG
 * mark (circle + digit), so brass never applies to an HTML text element.
 */
export function CircledNumber({ n }: { n: string }) {
  return (
    <span className="inline-flex h-11 w-11 items-center justify-center">
      <svg viewBox="0 0 44 44" className="h-full w-full" fill="none" aria-hidden="true">
        <path
          d="M22 4.5 C32 3.8, 40.6 11, 40 22 C39.5 32.6, 32 40.4, 21.5 40 C11 39.6, 3.6 31.4, 4 21.5 C4.4 11.4, 12 5.2, 22 4.5 Z"
          stroke="var(--brass)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <text
          x="22"
          y="22"
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--brass)"
          fontFamily="var(--font-plex-mono), monospace"
          fontSize="14"
          letterSpacing="-0.5"
        >
          {n}
        </text>
      </svg>
    </span>
  );
}
